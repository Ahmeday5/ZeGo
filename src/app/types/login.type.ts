// src/app/types/login.type.ts

export interface LoginCredentials {
  userNameOrEmail: string;
  password: string;
  rememberMe: boolean;
}

// Raw response from login or refresh-token endpoint.
// Handles both flat { accessToken } and nested { data: { accessToken } } formats.
export interface RawAuthResponse {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
  message?: any;
  statusCode?: number;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: string;
    [k: string]: any;
  };
  [k: string]: any;
}

// البيانات اللي هنخزنها في localStorage ونستخدمها داخل التطبيق
export interface StoredUser {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string; // ISO string - من الـ JWT نفسه
  refreshTokenExpiresAt?: string; // اختياري - لو الـ backend بيرجعه (إحنا بنحسبه 14 يوم)
}
