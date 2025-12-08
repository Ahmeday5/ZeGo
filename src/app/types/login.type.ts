// src/app/types/login.type.ts

export interface LoginCredentials {
  userNameOrEmail: string;
  password: string;
  rememberMe: boolean;
}

// استجابة الـ API الخام (من login أو refresh-token)
export interface RawAuthResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  message?: any;
  [k: string]: any; // عشان الـ API بيرجع حاجات زيادة زي statusCode و data
}

// البيانات اللي هنخزنها في localStorage ونستخدمها داخل التطبيق
export interface StoredUser {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string; // ISO string - من الـ JWT نفسه
  refreshTokenExpiresAt?: string; // اختياري - لو الـ backend بيرجعه (إحنا بنحسبه 14 يوم)
}
