// src/app/services/auth.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { RawAuthResponse, StoredUser } from '../types/login.type';

export interface JwtPayload {
  exp?: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = 'http://78.89.159.126:9393/TheOneAPIZego';

  public isLoggedInSubject = new BehaviorSubject<boolean>(
    localStorage.getItem('isLoggedIn') === 'true'
  );
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private userDataSubject = new BehaviorSubject<StoredUser | null>(null);
  private refreshTimeoutId: any = null;

  constructor(private http: HttpClient, private router: Router) {
    this.loadUserData();
  }

  // === فك الـ exp من الـ JWT ===
  private decodeExpFromToken(token: string): number | null {
    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded?.exp ? decoded.exp * 1000 : null;
    } catch (e) {
      console.error('Failed to decode token:', e);
      return null;
    }
  }

  // === تحويل الاستجابة لـ StoredUser ===
  private makeStoredUserFromRaw(raw: RawAuthResponse): StoredUser {
    const accessExp = this.decodeExpFromToken(raw.accessToken!);
    const accessTokenExpiresAt = accessExp
      ? new Date(accessExp).toISOString()
      : new Date(Date.now() + 30 * 60 * 1000).toISOString(); // fallback 30 دقيقة

    // لو الـ backend مرجعش refresh expiry → نفترض 14 يوم
    const refreshTokenExpiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    return {
      accessToken: raw.accessToken!,
      refreshToken: raw.refreshToken!,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  // === حفظ البيانات بعد اللوجين أو الرفريش ===
  private persistUser(user: StoredUser) {
    this.userDataSubject.next(user);
    localStorage.setItem('userData', JSON.stringify(user));
    localStorage.setItem('token', user.accessToken);
    localStorage.setItem('isLoggedIn', 'true');
    this.isLoggedInSubject.next(true);
    this.startTokenRefreshTimer(); // مهم جدًا: نعيد جدولة التايمر بالوقت الجديد
  }

  // === تنظيف كل حاجة ===
  private clearPersisted() {
    this.userDataSubject.next(null);
    localStorage.removeItem('userData');
    localStorage.removeItem('token');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('savedEmail');
    if (this.refreshTimeoutId) {
      clearTimeout(this.refreshTimeoutId);
      this.refreshTimeoutId = null;
    }
  }

  // === تحميل البيانات عند بدء التطبيق ===
  private loadUserData(): void {
    const stored = localStorage.getItem('userData');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!stored || !isLoggedIn) {
      this.clearPersisted();
      return;
    }

    try {
      const parsed = JSON.parse(stored) as StoredUser;
      this.userDataSubject.next(parsed);

      const accessValid = !!parsed.accessToken && !this.isTokenExpired();
      const refreshValid = !this.isRefreshTokenExpired();

      if (accessValid && refreshValid) {
        this.startTokenRefreshTimer();
      } else if (!accessValid && refreshValid) {
        // access انتهى بس refresh شغال → نعمل refresh فورًا
        this.refresh()
          .then(() => this.startTokenRefreshTimer())
          .catch(() => this.logoutAndRedirect());
      } else {
        this.logoutAndRedirect();
      }
    } catch (e) {
      console.error('Failed to parse userData', e);
      this.logoutAndRedirect();
    }
  }

  private logoutAndRedirect() {
    this.clearPersisted();
    this.isLoggedInSubject.next(false);
    void this.router.navigate(['/']);
  }

  // === تسجيل الدخول ===
  async login(userNameOrEmail: string, password: string, rememberMe: boolean = true): Promise<StoredUser> {
    this.clearPersisted();

    const payload = { userNameOrEmail, password, rememberMe };

    try {
      const raw = await firstValueFrom(
        this.http.post<RawAuthResponse>(`${this.API_URL}/api/Auth/login/appuser`, payload)
          .pipe(
            catchError(err => {
              if (err.status === 401) throw new Error('البريد أو كلمة المرور غير صحيحة');
              if (err.status === 400) throw new Error('بيانات غير صحيحة');
              throw new Error('فشل تسجيل الدخول');
            })
          )
      );

      const user = this.makeStoredUserFromRaw(raw);
      this.persistUser(user);
      if (rememberMe) localStorage.setItem('savedEmail', userNameOrEmail);

      return user;
    } catch (error: any) {
      throw new Error(error.message || 'فشل تسجيل الدخول');
    }
  }

  // === تجديد التوكن ===
  async refresh(): Promise<StoredUser> {
    const current = this.userDataSubject.value;
    const refreshToken = current?.refreshToken;

    if (!refreshToken || this.isRefreshTokenExpired()) {
      this.logoutAndRedirect();
      throw new Error('Refresh token منتهي');
    }

    try {
      const raw = await firstValueFrom(
        this.http.post<RawAuthResponse>(`${this.API_URL}/api/Auth/refresh-token`, { refreshToken })
      );

      const newUser = this.makeStoredUserFromRaw({
        accessToken: raw.accessToken,
        refreshToken: raw.refreshToken ?? refreshToken,
      });

      this.persistUser(newUser); // ← هنا بيحصل startTokenRefreshTimer تلقائي
      return newUser;
    } catch (error) {
      this.logoutAndRedirect();
      throw error;
    }
  }

  // === جدولة الرفريش التلقائي ===
  startTokenRefreshTimer(): void {
    if (this.refreshTimeoutId) clearTimeout(this.refreshTimeoutId);

    const stored = this.userDataSubject.value;
    if (!stored?.accessTokenExpiresAt) {
      this.logoutAndRedirect();
      return;
    }

    const expiry = Date.parse(stored.accessTokenExpiresAt);
    if (isNaN(expiry)) {
      this.logoutAndRedirect();
      return;
    }

    const now = Date.now();
    const timeLeft = expiry - now;
    const threshold = 2 * 60 * 1000; // 2 دقايق قبل الانتهاء

    if (timeLeft <= threshold) {
      void this.refresh().catch(() => this.logoutAndRedirect());
      return;
    }

    const delay = timeLeft - threshold;

    this.refreshTimeoutId = setTimeout(() => {
      void this.refresh().catch(() => this.logoutAndRedirect());
    }, delay);
  }

  // === تسجيل الخروج ===
  logout(): void {
    const token = this.userDataSubject.value?.refreshToken;
    if (token) {
      this.http.post(`${this.API_URL}/api/Auth/logout`, { refreshToken: token })
        .pipe(catchError(() => of(null)))
        .subscribe();
    }
    this.clearPersisted();
    this.isLoggedInSubject.next(false);
    void this.router.navigate(['/']);
  }

  // === دوال مساعدة ===
  isLoggedIn(): boolean {
    return !!this.getToken() && !this.isTokenExpired();
  }

  isTokenExpired(): boolean {
    const stored = this.userDataSubject.value;
    return !stored?.accessTokenExpiresAt || Date.parse(stored.accessTokenExpiresAt) < Date.now();
  }

  isRefreshTokenExpired(): boolean {
    const stored = this.userDataSubject.value;
    if (!stored?.refreshTokenExpiresAt) return false;
    return Date.parse(stored.refreshTokenExpiresAt) < Date.now();
  }

  getToken(): string | null {
    return this.userDataSubject.value?.accessToken || localStorage.getItem('token');
  }

  getSavedEmail(): string | null {
    return localStorage.getItem('savedEmail');
  }
}
