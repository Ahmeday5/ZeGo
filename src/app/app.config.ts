// src/app/app.config.ts

import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor'; // تأكد من المسار ده صحيح عندك

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),

    // أهم سطرين في حياتك دلوقتي
    provideHttpClient(
      withInterceptors([authInterceptor]) // ← الـ Interceptor بتاع الـ Refresh Token هيشتغل هنا
    ),
  ],
};
