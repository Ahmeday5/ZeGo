// src/app/interceptors/auth.interceptor.ts

import { inject } from '@angular/core';
import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpEvent,
} from '@angular/common/http';
import { BehaviorSubject, from, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { StoredUser } from '../types/login.type';
import { Router } from '@angular/router';

let isRefreshing = false;

// ده اللي بيخلّي كل الطلبات اللي جت أثناء الـ refresh تنتظر لحد ما التوكن الجديد يجي
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const authService = inject(AuthService);
  const router = inject(Router); // لو حابب تستخدمه بعدين (اختياري)

  const accessToken = authService.getToken();

  // نضيف الـ Bearer فقط لو الطلب مش للوجين أو ريفريش أو لوج أوت، والتوكن موجود ولم ينتهي
  if (
    !req.url.includes('/login') &&
    !req.url.includes('/refresh-token') &&
    !req.url.includes('/logout') &&
    accessToken &&
    !authService.isTokenExpired()
  ) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      // لو السيرفر رد 401 وكان الطلب عادي (مش ريفريش ولا لوجين)
      if (
        error.status === 401 &&
        !req.url.includes('/refresh-token') &&
        !req.url.includes('/login') &&
        !req.url.includes('/logout')
      ) {
        // أول طلب وصل 401 → نبدأ عملية الـ refresh
        if (!isRefreshing) {
          isRefreshing = true;
          refreshTokenSubject.next(null); // نقول للطلبات التانية: انتظروا

          return from(authService.refresh()).pipe(
            switchMap((newTokens: StoredUser) => {
              isRefreshing = false;
              refreshTokenSubject.next(newTokens.accessToken); // نطلّع التوكن الجديد للكل

              // نعيد الطلب الأصلي بالتوكن الجديد
              return next(
                req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${newTokens.accessToken}`,
                  },
                })
              );
            }),
            catchError((refreshError) => {
              isRefreshing = false;
              refreshTokenSubject.next(null);

              // لو الـ refresh فشل → يعني الريفريش توكن خلص أو فيه مشكلة → نطلّع المستخدم
              authService.logout(); // ده هينظف كل حاجة ويروح للـ login

              return throwError(() => refreshError);
            })
          );
        } else {
          // في طلب تاني جاله 401 بس احنا بالفعل بنعمل refresh
          // هنستنى لحد ما التوكن الجديد يوصل
          return refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((token) => {
              return next(
                req.clone({
                  setHeaders: {
                    Authorization: `Bearer ${token!}`,
                  },
                })
              );
            })
          );
        }
      }

      // أي إيرور تاني غير 401 → نرميه عادي
      return throwError(() => error);
    })
  );
};
