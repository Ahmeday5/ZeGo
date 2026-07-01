import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { inject } from '@angular/core';
import {
  catchError,
  switchMap,
  filter,
  take,
  throwError,
  BehaviorSubject,
  Observable,
  from,
} from 'rxjs';
import { AuthService } from '../services/auth.service';
import { StoredUser } from '../types/login.type';

let isRefreshing = false;
let refreshTokenSubject = new BehaviorSubject<string | null>(null);

const isAuthUrl = (url: string) =>
  url.includes('/login') || url.includes('/refresh-token') || url.includes('/logout');

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn,
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);

  const accessToken = authService.getToken();

  // نبعت التوكن دايمًا لو موجود — السيرفر هو اللي يحكم إنه صالح أو لا
  // (إزلنا شرط isTokenExpired لأن ساعة الجهاز ممكن تختلف عن السيرفر)
  if (!isAuthUrl(req.url) && accessToken) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401 && !isAuthUrl(req.url)) {
        if (!isRefreshing) {
          isRefreshing = true;
          // نعمل reset للـ subject عند كل دورة refresh جديدة
          refreshTokenSubject = new BehaviorSubject<string | null>(null);

          return from(authService.refresh()).pipe(
            switchMap((newTokens: StoredUser) => {
              isRefreshing = false;
              refreshTokenSubject.next(newTokens.accessToken);
              return next(
                req.clone({
                  setHeaders: { Authorization: `Bearer ${newTokens.accessToken}` },
                }),
              );
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              refreshTokenSubject.next(null);
              authService.logout();
              return throwError(() => refreshError);
            }),
          );
        } else {
          // طلبات منتظرة → تستنى التوكن الجديد
          return refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((token) =>
              next(
                req.clone({
                  setHeaders: { Authorization: `Bearer ${token!}` },
                }),
              ),
            ),
          );
        }
      }

      return throwError(() => error);
    }),
  );
};
