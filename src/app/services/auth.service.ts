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
  private readonly API_URL = 'https://zego.premiumasp.net';

  public isLoggedInSubject = new BehaviorSubject<boolean>(
    localStorage.getItem('isLoggedIn') === 'true'
  );
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private userDataSubject = new BehaviorSubject<StoredUser | null>(null);
  private refreshTimeoutId: any = null;
  private refreshInProgress: Promise<StoredUser> | null = null;

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
  // Handles both flat { accessToken } and nested { data: { accessToken } } response formats
  private makeStoredUserFromRaw(raw: RawAuthResponse): StoredUser {
    const nested = raw.data ?? raw['Data'];
    const accessToken: string | undefined = raw.accessToken ?? nested?.accessToken;
    const refreshToken: string | undefined = raw.refreshToken ?? nested?.refreshToken;

    if (!accessToken || accessToken === 'undefined') {
      console.error('[Auth] Invalid auth response — no accessToken found:', raw);
      throw new Error('Invalid auth response: missing accessToken');
    }

    const accessExp = this.decodeExpFromToken(accessToken);
    const accessTokenExpiresAt = accessExp
      ? new Date(accessExp).toISOString()
      : new Date(Date.now() + 30 * 60 * 1000).toISOString();

    const refreshTokenExpiresAt = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString();

    return {
      accessToken,
      refreshToken: refreshToken ?? '',
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

      // نطلع المستخدم بس لو الـ refresh token نفسه انتهى (14 يوم)
      // لو access token بس منتهي → خليه يفضل logged in
      // الـ interceptor هيتعامل مع الـ 401 ويعمل refresh تلقائياً
      if (this.isRefreshTokenExpired()) {
        this.logoutAndRedirect();
        return;
      }

      // لو access token لسه صالح → جدول الـ refresh التلقائي
      // لو access token منتهي → الـ interceptor هيجدده عند أول API call
      if (!this.isTokenExpired()) {
        this.startTokenRefreshTimer();
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
  refresh(): Promise<StoredUser> {
    // Deduplicate: if a refresh is already in progress, return the same promise
    if (this.refreshInProgress) {
      return this.refreshInProgress;
    }

    this.refreshInProgress = this.performRefresh().finally(() => {
      this.refreshInProgress = null;
    });

    return this.refreshInProgress;
  }

  private async performRefresh(): Promise<StoredUser> {
    const current = this.userDataSubject.value;
    const refreshToken = current?.refreshToken;

    if (!refreshToken || this.isRefreshTokenExpired()) {
      this.logoutAndRedirect();
      throw new Error('Refresh token expired');
    }

    try {
      const raw = await firstValueFrom(
        this.http.post<RawAuthResponse>(`${this.API_URL}/api/Auth/refresh-token`, { refreshToken })
      );

      // Pass raw directly so makeStoredUserFromRaw can handle both flat and nested formats.
      // Fall back to the old refreshToken if the new response doesn't include one.
      const nested = raw.data ?? raw['Data'];
      const newUser = this.makeStoredUserFromRaw({
        ...raw,
        refreshToken: raw.refreshToken ?? nested?.refreshToken ?? refreshToken,
      });

      this.persistUser(newUser);
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
    if (!stored?.accessTokenExpiresAt) return;

    const expiry = Date.parse(stored.accessTokenExpiresAt);
    if (isNaN(expiry)) return;

    const now = Date.now();
    const timeLeft = expiry - now;
    const threshold = 2 * 60 * 1000; // 2 دقايق قبل الانتهاء

    // لو التوكن انتهى أو قارب → مش هنعمل حاجة دلوقتي
    // الـ interceptor هيتعامل معاه لما يجي 401 على أول request
    if (timeLeft <= threshold) return;

    this.refreshTimeoutId = setTimeout(() => {
      void this.refresh().catch(() => this.logoutAndRedirect());
    }, timeLeft - threshold);
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
    const token =
      this.userDataSubject.value?.accessToken ?? localStorage.getItem('token');
    // Guard against the string "undefined" or "null" stored in localStorage
    return token && token !== 'undefined' && token !== 'null' ? token : null;
  }

  getSavedEmail(): string | null {
    return localStorage.getItem('savedEmail');
  }
}
