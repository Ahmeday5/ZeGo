import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import {
  DashboardlastTripsData,
  DashboardlastTripsResponse,
  DashboardSummaryData,
  DashboardSummaryResponse,
  DashboardTripsStatusData,
  DashboardTripsStatusResponse,
} from '../types/dashboard.type';
import { ClientsResponse } from '../types/clients.type';
import { DriversResponse } from '../types/driver.type';
import { AddPricingResponse } from '../types/pricing.type';
import { AddAdminResponse, adminsResponse } from '../types/admins.type';
import { ReportsApiResponse } from '../types/reports.type';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'http://78.89.159.126:9393/TheOneAPIZego';

  constructor(private http: HttpClient) {}

  /************************************************Dasboard****************************************************************/

  //getTotalSummary
  getTotalSummary(): Observable<DashboardSummaryData> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}/api/Dashboard/summary`;

    return this.http.get<DashboardSummaryResponse>(url, { headers }).pipe(
      map((res) => {
        if (res.statusCode === 200 && res.data) {
          return res.data; // نرجع الـ data فقط
        }
        throw new Error('Invalid response');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في جلب كل الاحصائيات:', error);
        let errorMessage = 'فشل جلب كل الاحصائيات';
        if (error.status === 0) {
          errorMessage = 'فشل الاتصال بالخادم. تحقق من الشبكة.';
        } else if (error.status === 401) {
          errorMessage = 'غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.';
          // ممكن تضيف redirect للـ login هنا
        } else if (error.status === 404) {
          errorMessage = 'الـ endpoint غير موجود.';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  //getTotalSummary
  getLastTrips(): Observable<DashboardlastTripsData[]> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}/api/Dashboard/trips/last`;

    return this.http.get<DashboardlastTripsResponse>(url, { headers }).pipe(
      map((res) => {
        if (res.statusCode === 200 && res.data) {
          return res.data; // نرجع الـ data فقط
        }
        throw new Error('Invalid response');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في جلب كل اخر رحلات:', error);
        let errorMessage = 'فشل جلب كل اخر رحلات';
        if (error.status === 0) {
          errorMessage = 'فشل الاتصال بالخادم. تحقق من الشبكة.';
        } else if (error.status === 401) {
          errorMessage = 'غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.';
          // ممكن تضيف redirect للـ login هنا
        } else if (error.status === 404) {
          errorMessage = 'الـ endpoint غير موجود.';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  //getTripsStatus
  getTripsStatus(): Observable<DashboardTripsStatusData[]> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}/api/Dashboard/trips/status`;

    return this.http.get<DashboardTripsStatusResponse>(url, { headers }).pipe(
      map((res) => {
        if (res.statusCode === 200 && res.data) {
          return res.data; // نرجع الـ data فقط
        }
        throw new Error('Invalid response');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في جلب كل اخر رحلات:', error);
        let errorMessage = 'فشل جلب كل اخر رحلات';
        if (error.status === 0) {
          errorMessage = 'فشل الاتصال بالخادم. تحقق من الشبكة.';
        } else if (error.status === 401) {
          errorMessage = 'غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.';
          // ممكن تضيف redirect للـ login هنا
        } else if (error.status === 404) {
          errorMessage = 'الـ endpoint غير موجود.';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /************************************clients*******************************************/
  getAllClients(params?: HttpParams): Observable<ClientsResponse> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}/api/Dashboard/getAllClients`;

    return this.http.get<ClientsResponse>(url, { headers, params }).pipe(
      map((res) => res || { data: [], pageIndex: 1, pageSize: 10, count: 0 }),
      catchError(() => of({ data: [], pageIndex: 1, pageSize: 10, count: 0 }))
    );
  }

  /************************************drivers*******************************************/
  getAllDrivers(params?: HttpParams): Observable<DriversResponse> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}/api/Dashboard/drivers`;

    return this.http.get<DriversResponse>(url, { headers, params }).pipe(
      map(
        (res) =>
          res || {
            data: { data: [], pageIndex: 1, pageSize: 10, totalCount: 0 },
          }
      ),
      catchError((err) => {
        console.error('Error fetching drivers:', err);
        return of({
          data: { data: [], pageIndex: 1, pageSize: 10, totalCount: 0 },
        });
      })
    );
  }

  //حظر السائق
  deactivateDriver(id: number): Observable<string> {
    const token = localStorage.getItem('token');
    console.log('Token being sent:', token ? token : 'No token found');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    const url = `${this.baseUrl}/api/Dashboard/deactivate/${id}`;
    return this.http
      .put<string>(url, {}, { headers, responseType: 'text' as 'json' })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في حظر السائق ${id}:`, error);
          let errorMessage = `فشل حظر السائق ${id}`;
          if (error.status === 401) {
            errorMessage = 'غير مصرح. تحقق من الـ token أو الصلاحيات.';
          } else if (error.status === 400) {
            errorMessage = 'طلب غير صالح. تحقق من بيانات الطلب.';
          } else if (error.status === 404) {
            errorMessage = 'السائق غير موجود.';
          }
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  //تفعيل السائق
  activateDriver(id: number): Observable<string> {
    const token = localStorage.getItem('token');
    console.log('Token being sent:', token ? token : 'No token found');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    const url = `${this.baseUrl}/api/Dashboard/activate/${id}`;
    return this.http
      .put<string>(url, {}, { headers, responseType: 'text' as 'json' })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في تفعيل السائق ${id}:`, error);
          let errorMessage = `فشل تفعيل السائق ${id}`;
          if (error.status === 401) {
            errorMessage = 'غير مصرح. تحقق من الـ token أو الصلاحيات.';
          } else if (error.status === 400) {
            errorMessage = 'طلب غير صالح. تحقق من بيانات الطلب.';
          } else if (error.status === 404) {
            errorMessage = 'السائق غير موجود.';
          }
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  //تفاصيل السائق
  getDriverById(id: number): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}/api/Dashboard/driver/${id}`;

    return this.http.get<any>(url, { headers });
  }

  /**********************************pricing**************************************/

  /*********AddPricing***********/

  addPricing(body: {
    normalPricePerKm: number | null;
    peakPricePerKm: number | null;
    peakStart: string;
    peakEnd: string;
  }): Observable<AddPricingResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });

    const url = `${this.baseUrl}/api/Dashboard/addEditPricing`;

    return this.http.put<{ message: string }>(url, body, { headers }).pipe(
      map((response) => {
        console.log('addPricing Response:', response);
        return {
          success: response.message.toLowerCase().includes('successfully'),
          message: response.message,
        } as AddPricingResponse;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في إضافة السعر:', error);
        let errorMessage = 'حدث خطأ أثناء الإضافة';
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.status) {
          errorMessage = `خطأ ${error.status}: ${error.statusText}`;
        }
        return throwError(
          () =>
            ({ success: false, message: errorMessage } as AddPricingResponse)
        );
      })
    );
  }

  /***************************************************admins*******************************************************/

  // دالة جديدة لجلب كل الادمن
  getAllAdmins(): Observable<adminsResponse> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    console.log('Token being sent:', token ? 'Present' : 'Missing'); // log للتحقق من الـ token

    // بناء URL ديناميكي
    let url = `${this.baseUrl}/api/Dashboard/getAllUsers`;

    return this.http.get<adminsResponse>(url, { headers }).pipe(
      map((response) => {
        console.log('API Response:', response); // log للتحقق
        return response || { items: [], totalItems: 0 };
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في جلب كل الادمن:', error);
        let errorMessage = 'فشل جلب كل الادمن';
        if (error.status === 0) {
          errorMessage = 'فشل الاتصال بالخادم. تحقق من الشبكة.';
        } else if (error.status === 401) {
          errorMessage = 'غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.';
          // ممكن تضيف redirect للـ login هنا
        } else if (error.status === 404) {
          errorMessage = 'الـ endpoint غير موجود.';
        }
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /*****update admin*****/

  updateAdmin(
    id: string,
    body: {
      email: string;
      role: string;
      newPassword?: string;
      userName: string;
    }
  ): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });

    return this.http
      .put(`${this.baseUrl}/api/Dashboard/updateUser/${id}`, body, {
        headers,
        responseType: 'text', // نص بسيط زي "Doctor updated successfully"
      })
      .pipe(
        map((response: string) => {
          // تحقق من الاستجابة بناءً على النص بدقة أكبر
          const lowerCaseResponse = response.toLowerCase().trim(); // تحويل لصغير وإزالة المسافات
          if (lowerCaseResponse.includes('successfully')) {
            return { success: true, message: response }; // نجاح
          } else {
            return { success: false, message: response }; // فشل
          }
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في تحديث الادمن:', error);
          let errorMessage = 'حدث خطأ أثناء التحديث';
          if (
            error.status === 400 &&
            error.error &&
            Array.isArray(error.error)
          ) {
            // التعامل مع duplicate email (array من errors)
            const duplicateError = error.error.find(
              (err: any) => err.code === 'DuplicateUserName'
            );
            if (duplicateError) {
              errorMessage =
                'البريد الإلكتروني مستخدم بالفعل. يرجى إدخال بريد إلكتروني آخر.';
            } else {
              errorMessage =
                error.error.map((err: any) => err.description).join(', ') ||
                `خطأ ${error.status}: ${error.statusText}`;
            }
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.status) {
            errorMessage = `خطأ ${error.status}: ${error.statusText}`;
          }
          return throwError(() => ({ success: false, message: errorMessage }));
        })
      );
  }

  //حذف ادمن
  deleteAdmin(id: string): Observable<string> {
    const token = localStorage.getItem('token');
    console.log('Token being sent:', token ? token : 'No token found');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    const url = `${this.baseUrl}/api/Dashboard/deleteUser/${id}`;
    return this.http
      .delete<string>(url, { headers, responseType: 'text' as 'json' })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في حذف الادمن ${id}:`, error);
          let errorMessage = `فشل حذف الادمن ${id}`;
          if (error.status === 401) {
            errorMessage = 'غير مصرح. تحقق من الـ token أو الصلاحيات.';
          } else if (error.status === 400) {
            errorMessage = 'طلب غير صالح. تحقق من بيانات الطلب.';
          } else if (error.status === 404) {
            errorMessage = 'الادمن غير موجود.';
          }
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /*********add admin*********/
  addAdmin(body: {
    email: string;
    password: string;
    userName: string;
    role: string;
  }): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    });

    return this.http
      .post(`${this.baseUrl}/api/Dashboard/addUser`, body, { headers })
      .pipe(
        map((response: any) => {
          const success = response.message
            .toLowerCase()
            .includes('successfully');
          return {
            success,
            message: success ? 'تم إضافة الادمن بنجاح' : response.message,
            data: response.userId
              ? {
                  userId: response.userId,
                  email: response.email,
                  role: response.role,
                }
              : undefined,
          };
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في إضافة الادمن:', error);
          let errorMessage = 'حدث خطأ أثناء الإضافة';
          if (
            error.status === 400 &&
            error.error &&
            Array.isArray(error.error)
          ) {
            const passwordErrors = error.error.filter(
              (err: any) =>
                err.code === 'PasswordRequiresNonAlphanumeric' ||
                err.code === 'PasswordRequiresLower' ||
                err.code === 'PasswordRequiresUpper'
            );
            if (passwordErrors.length > 0) {
              errorMessage =
                'كلمة المرور يجب أن تحتوي على حرف صغير، حرف كبير، ورمز غير أبجدي واحد على الأقل.';
            } else {
              errorMessage =
                error.error.map((err: any) => err.description).join(', ') ||
                `خطأ ${error.status}: ${error.statusText}`;
            }
          } else if (typeof error.error === 'string') {
            if (
              error.error.toLowerCase().includes('email is already registered')
            ) {
              errorMessage =
                'البريد الإلكتروني مستخدم بالفعل. يرجى إدخال بريد إلكتروني آخر.';
            } else {
              errorMessage = error.error;
            }
          } else if (error.status) {
            errorMessage = `خطأ ${error.status}: ${error.statusText}`;
          }
          return throwError(() => ({ success: false, message: errorMessage }));
        })
      );
  }

  /************************************reports*******************************************/
  getAllreports(params?: HttpParams): Observable<ReportsApiResponse> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}/api/Dashboard/driver-profit-reports`;

    return this.http.get<ReportsApiResponse>(url, { headers, params }).pipe(
      map((response) => response),

      // لو حصل خطأ (شبكة، 500، 401، إلخ) → نرجع response آمن عشان الـ UI ما يقعش
      catchError((error) => {
        console.error('Error fetching driver profit reports:', error);

        // نرجع نفس الهيكل لكن فاضي + رسالة خطأ
        const emptyResponse: ReportsApiResponse = {
          statusCode: error.status || 500,
          message: error.error?.message || 'فشل تحميل التقارير',
          data: {
            filterType: 'monthly',
            page: 1,
            pageSize: 20,
            totalPages: 0,
            totalItems: 0,
            totals: {
              totalEarnings: 0,
              totalTrips: 0,
              totalDrivers: 0,
              totalClients: 0,
            },
            data: [],
          },
        };

        return of(emptyResponse);
      })
    );
  }
}
