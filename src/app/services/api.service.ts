import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpParams,
} from '@angular/common/http';
import { catchError, map, Observable, of, throwError } from 'rxjs';

import {
  DashboardLastTripsData,
  DashboardLastTripsResponse,
  DashboardSummaryData,
  DashboardSummaryResponse,
  DashboardTripsStatusData,
  DashboardTripsStatusResponse,
} from '../types/dashboard.type';
import { allClient, ClientsResponse } from '../types/clients.type';
import { DriversResponse } from '../types/driver.type';
import {
  AddPricingResponse,
  allPricing,
  allPricingResponse,
  ApiResponse,
} from '../types/pricing.type';
import { AddAdminResponse, adminsResponse } from '../types/admins.type';
import { ReportsApiResponse } from '../types/reports.type';
import { allContent, allContentResponse } from '../types/content.type';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'https://zego.premiumasp.net';

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
      }),
    );
  }

  // لو استخدمت الـ interfaces المنظمة اللي اقترحتها قبل كده
  getLastTrips(
    pageSize: number,
    page: number,
  ): Observable<DashboardLastTripsData> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // ممكن تضيف query params لو الـ API بيدعم الـ pagination من الـ backend
    const params = new HttpParams()
      .set('pageSize', pageSize.toString())
      .set('page', page.toString());

    const url = `${this.baseUrl}/api/Dashboard/trips/last-24-hours`;

    return this.http
      .get<DashboardLastTripsResponse>(url, { headers, params })
      .pipe(
        map((res) => {
          if (res.statusCode === 200 && res.data) {
            return res.data; // هنا بنرجع الـ { items, pagination }
          }
          throw new Error(res.message || 'Invalid response');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في جلب آخر الرحلات:', error);

          let errorMessage = 'فشل جلب آخر الرحلات';

          if (error.status === 0) {
            errorMessage = 'فشل الاتصال بالخادم. تحقق من الشبكة.';
          } else if (error.status === 401) {
            errorMessage = 'غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.';
            // هنا ممكن تضيف: this.router.navigate(['/login']);
          } else if (error.status === 404) {
            errorMessage = 'الصفحة أو البيانات غير موجودة.';
          } else if (error.status === 400) {
            errorMessage = error.error?.message || 'طلب غير صحيح';
          }

          return throwError(() => new Error(errorMessage));
        }),
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
      }),
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
      catchError(() => of({ data: [], pageIndex: 1, pageSize: 10, count: 0 })),
    );
  }

  //حظر العميل
  deactivateClients(id: number): Observable<string> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    const url = `${this.baseUrl}/api/Dashboard/deactivateClient/${id}`;
    return this.http
      .put<string>(url, {}, { headers, responseType: 'text' as 'json' })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في حظر العميل ${id}:`, error);
          let errorMessage = `فشل حظر العميل ${id}`;
          if (error.status === 401) {
            errorMessage = 'غير مصرح. تحقق من الـ token أو الصلاحيات.';
          } else if (error.status === 400) {
            errorMessage = 'طلب غير صالح. تحقق من بيانات الطلب.';
          } else if (error.status === 404) {
            errorMessage = 'العميل غير موجود.';
          }
          return throwError(() => new Error(errorMessage));
        }),
      );
  }

  //تفعيل العميل
  activateClients(id: number): Observable<string> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    const url = `${this.baseUrl}/api/Dashboard/activateClient/${id}`;
    return this.http
      .put<string>(url, {}, { headers, responseType: 'text' as 'json' })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في تفعيل العميل ${id}:`, error);
          let errorMessage = `فشل تفعيل العميل ${id}`;
          if (error.status === 401) {
            errorMessage = 'غير مصرح. تحقق من الـ token أو الصلاحيات.';
          } else if (error.status === 400) {
            errorMessage = 'طلب غير صالح. تحقق من بيانات الطلب.';
          } else if (error.status === 404) {
            errorMessage = 'العميل غير موجود.';
          }
          return throwError(() => new Error(errorMessage));
        }),
      );
  }

  //حذف العميل
  deletedClient(id: number): Observable<string> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}/api/Dashboard/deleteClient/${id}`;

    return this.http
      .delete(url, {
        headers,
        responseType: 'text' as const, // ← الأهم هنا
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في حذف العميل ${id}:`, error);
          let errorMessage = `فشل حذف العميل ${id}`;
          if (error.status === 401) {
            errorMessage = 'غير مصرح. تحقق من الـ token أو الصلاحيات.';
          } else if (error.status === 400) {
            errorMessage = 'طلب غير صالح. تحقق من بيانات الطلب.';
          } else if (error.status === 404) {
            errorMessage = 'العميل غير موجود.';
          }
          return throwError(() => new Error(errorMessage));
        }),
      );
  }

  getClientById(id: number): Observable<allClient> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}/api/Dashboard/getClientById/${id}`;

    return this.http.get<allClient>(url, { headers }).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMsg = 'فشل جلب بيانات العميل';
        if (error.status === 404) {
          errorMsg = 'العميل غير موجود';
        } else if (error.status === 401) {
          errorMsg = 'غير مصرح – تحقق من التوكن';
        }
        console.error(`Error fetching client ${id}:`, error);
        return throwError(() => new Error(errorMsg));
      }),
    );
  }

  updateClient(
    id: number, // ← أضفنا id كـ parameter أول
    Name: string,
    Phone: string,
    profileImage: File | null,
  ): Observable<AddPricingResponse> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}/api/Dashboard/updateClient/${id}`;

    // إنشاء FormData
    const formData = new FormData();

    // إضافة الحقول النصية
    formData.append('Name', Name);
    formData.append('Phone', Phone);

    // إضافة الملف لو موجود (ProfileImageUrl في Swagger بيبقى اسم الحقل غالباً)
    if (profileImage) {
      formData.append('ProfileImageUrl', profileImage); // ← نفس الاسم اللي في Postman/Swagger
    }

    return this.http
      .put<{ message: string }>(url, formData, { headers }) // ← body هو FormData
      .pipe(
        map(
          (res) =>
            ({
              success: true,
              message: res.message || 'تم تحديث العميل بنجاح',
            }) as AddPricingResponse,
        ),

        catchError((err) => {
          let errorMsg = 'فشل تحديث العميل';

          if (err.error?.message) {
            errorMsg = err.error.message;
          } else if (err.status === 400) {
            errorMsg = 'بيانات غير صالحة';
          } else if (err.status === 401) {
            errorMsg = 'غير مصرح – تحقق من التوكن';
          } else if (err.status === 404) {
            errorMsg = 'العميل غير موجود';
          }

          return throwError(
            () =>
              ({
                success: false,
                message: errorMsg,
              }) as AddPricingResponse,
          );
        }),
      );
  }

  resetClientPassword(
    id: number,
    body: { newPassword: string },
  ): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    });

    return this.http
      .post(`${this.baseUrl}/api/Dashboard/reset-client-password/${id}`, body, {
        headers,
      })
      .pipe(
        map((res) => ({
          success: true,
          message: 'تم إعادة تعيين كلمة السر بنجاح',
        })),
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في اعادة تعيين كلمة المرور ${id}:`, error);
          let errorMessage = `فشل اعادة تعيين كلمة المرور ${id}`;
          if (error.status === 401) {
            errorMessage = 'غير مصرح. تحقق من الـ token أو الصلاحيات.';
          } else if (error.status === 400) {
            errorMessage = 'كلمة المرو ضعيفة جدا';
          } else if (error.status === 404) {
            errorMessage = 'العميل غير موجود.';
          }
          return throwError(() => new Error(errorMessage));
        }),
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
          },
      ),
      catchError((err) => {
        console.error('Error fetching drivers:', err);
        return of({
          data: { data: [], pageIndex: 1, pageSize: 10, totalCount: 0 },
        });
      }),
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
        }),
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
        }),
      );
  }

  //حذف السائق
  deletedDriver(id: number): Observable<string> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}/api/Dashboard/deleteDriver/${id}`;

    return this.http
      .delete(url, {
        headers,
        responseType: 'text' as const, // ← الأهم هنا
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في حذف السائق ${id}:`, error);
          let errorMessage = `فشل حذف السائق ${id}`;
          if (error.status === 401) {
            errorMessage = 'غير مصرح. تحقق من الـ token أو الصلاحيات.';
          } else if (error.status === 400) {
            errorMessage = 'طلب غير صالح. تحقق من بيانات الطلب.';
          } else if (error.status === 404) {
            errorMessage = 'السائق غير موجود.';
          }
          return throwError(() => new Error(errorMessage));
        }),
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

  updateDriver(id: number, formData: FormData): Observable<any> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    // مهم: لا تضع Content-Type يدويًا مع FormData
    // Angular/httpclient هيحطها تلقائيًا مع boundary

    const url = `${this.baseUrl}/api/Dashboard/updateDriver/${id}`;

    return this.http.put<{ message: string }>(url, formData, { headers }).pipe(
      map((res) => ({
        success: true,
        message: res.message || 'تم تحديث بيانات السائق بنجاح',
      })),

      catchError((err: HttpErrorResponse) => {
        let errorMsg = 'فشل تحديث بيانات السائق';

        if (err.error?.message) {
          errorMsg = err.error.message;
        } else if (err.status === 400) {
          errorMsg = 'البيانات غير صالحة';
        } else if (err.status === 401) {
          errorMsg = 'غير مصرح – تحقق من التوكن';
        } else if (err.status === 404) {
          errorMsg = 'السائق غير موجود';
        }

        return throwError(() => ({ success: false, message: errorMsg }));
      }),
    );
  }

  resetDriverPassword(
    id: number,
    body: { newPassword: string },
  ): Observable<any> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    });

    return this.http
      .post(`${this.baseUrl}/api/Dashboard/reset-driver-password/${id}`, body, {
        headers,
      })
      .pipe(
        map((res) => ({
          success: true,
          message: 'تم إعادة تعيين كلمة السر بنجاح',
        })),
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في اعادة تعيين كلمة المرور ${id}:`, error);
          let errorMessage = `فشل اعادة تعيين كلمة المرور ${id}`;
          if (error.status === 401) {
            errorMessage = 'غير مصرح. تحقق من الـ token أو الصلاحيات.';
          } else if (error.status === 400) {
            errorMessage = 'كلمة المرو ضعيفة جدا';
          } else if (error.status === 404) {
            errorMessage = 'العميل غير موجود.';
          }
          return throwError(() => new Error(errorMessage));
        }),
      );
  }

  /**********************************pricing**************************************/

  /*********AddPricing***********/

  addPricing(body: {
    carNormalPricePerKm: number | null;
    carPeakPricePerKm: number | null;
    carMinimumFare: number | null;
    motorcycleNormalPricePerKm: number | null;
    motorcyclePeakPricePerKm: number | null;
    motorcycleMinimumFare: number | null;
    deliveryNormalPricePerKm: number | null;
    deliveryPeakPricePerKm: number | null;
    deliveryMinimumFare: number | null;
    peakStart: string;
    peakEnd: string;
  }): Observable<AddPricingResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });

    const url = `${this.baseUrl}/api/Dashboard/addEditPricing`;

    return this.http.put<ApiResponse<null>>(url, body, { headers }).pipe(
      map((response) => {
        console.log('addPricing API raw response:', response);

        return {
          success: response.statusCode === 200,
          message: response.message,
        } as AddPricingResponse;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في إضافة السعر:', error);

        let errorMessage = 'حدث خطأ أثناء الإضافة';

        // لو الباك بيرجع message
        if (error.error?.message) {
          errorMessage = error.error.message;
        }

        return throwError(
          () =>
            ({
              success: false,
              message: errorMessage,
            }) as AddPricingResponse,
        );
      }),
    );
  }

  //getall
  getPricing(): Observable<allPricing> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}/api/Dashboard/pricing`;

    return this.http.get<allPricingResponse>(url, { headers }).pipe(
      map((res) => {
        if (res.statusCode === 200 && res.data) {
          return res.data; // نرجع الـ data فقط
        }
        throw new Error('Invalid response');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في جلب كل الاسعار:', error);
        let errorMessage = 'فشل جلب كل الاسعار';
        if (error.status === 0) {
          errorMessage = 'فشل الاتصال بالخادم. تحقق من الشبكة.';
        } else if (error.status === 401) {
          errorMessage = 'غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.';
          // ممكن تضيف redirect للـ login هنا
        } else if (error.status === 404) {
          errorMessage = 'الـ endpoint غير موجود.';
        }
        return throwError(() => new Error(errorMessage));
      }),
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
      }),
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
    },
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
              (err: any) => err.code === 'DuplicateUserName',
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
        }),
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
        }),
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
                err.code === 'PasswordRequiresUpper',
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
        }),
      );
  }

  /************************************reports*******************************************/
  getAllreports(params?: HttpParams): Observable<ReportsApiResponse> {
    const token = localStorage.getItem('token');
    const headers = token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : undefined;
    const url = `${this.baseUrl}/api/Dashboard/driver-profit-reports-adv`;

    return this.http.get<ReportsApiResponse>(url, { headers, params }).pipe(
      catchError((error) => {
        console.error('Error fetching driver profit reports:', error);

        // اجعل الكائن مطابق للنوع
        return of({
          statusCode: error.status ? Number(error.status) : 500, // ضمن number
          message: String(error.error?.message || 'فشل تحميل التقارير'), // ضمن string
          data: {
            filterType: 'monthly' as 'monthly', // صريح كـ literal type
            year: null,
            month: null,
            driverNameSearch: null,
            page: 1,
            pageSize: 20,
            totalPages: 0,
            totalItems: 0,
            totals: {
              totalEarnings: 0,
              totalDeps: 0,
              totalTrips: 0,
              totalClients: 0,
              totalDriversInResult: 0,
              totalActiveDriversInCurrentPage: 0,
            },
            data: [],
          },
        });
      }),
    );
  }

  /**********************************content**************************************/

  /*********Addcontent***********/

  addContent(body: {
    contactPhone: string;
    whatsAppPhone: string;
  }): Observable<AddPricingResponse> {
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({
      Authorization: token ? `Bearer ${token}` : '',
    });
    const url = `${this.baseUrl}/api/Dashboard/addEditContact`;

    return this.http.put<{ message: string }>(url, body, { headers }).pipe(
      map((response) => {
        console.log('addContent Response:', response);
        return {
          success: response.message.toLowerCase().includes('successfully'),
          message: response.message,
        } as AddPricingResponse;
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في إضافة الارقام:', error);
        let errorMessage = 'حدث خطأ أثناء الإضافة';
        if (error.error && typeof error.error === 'string') {
          errorMessage = error.error;
        } else if (error.status) {
          errorMessage = `خطأ ${error.status}: ${error.statusText}`;
        }
        return throwError(
          () =>
            ({ success: false, message: errorMessage }) as AddPricingResponse,
        );
      }),
    );
  }

  //getall
  getContent(): Observable<allContent> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}/api/Dashboard/contact`;

    return this.http.get<allContentResponse>(url, { headers }).pipe(
      map((res) => {
        if (res.statusCode === 200 && res.data) {
          return res.data; // نرجع الـ data فقط
        }
        throw new Error('Invalid response');
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('خطأ في جلب كل الارقام:', error);
        let errorMessage = 'فشل جلب كل الارقام';
        if (error.status === 0) {
          errorMessage = 'فشل الاتصال بالخادم. تحقق من الشبكة.';
        } else if (error.status === 401) {
          errorMessage = 'غير مصرح لك. يرجى تسجيل الدخول مرة أخرى.';
          // ممكن تضيف redirect للـ login هنا
        } else if (error.status === 404) {
          errorMessage = 'الـ endpoint غير موجود.';
        }
        return throwError(() => new Error(errorMessage));
      }),
    );
  }

  /********************************************updatePercentage***************************************/

  updatePercentage(
    id: number,
    percentage: number,
  ): Observable<AddPricingResponse> {
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${this.baseUrl}/api/Dashboard/updatePercentage/${id}?percentage=${percentage}`;

    return this.http.put<ApiResponse<null>>(url, null, { headers }).pipe(
      map(
        (res) =>
          ({
            success: res.statusCode === 200,
            message: res.message ?? 'تم التحديث بنجاح',
          }) as AddPricingResponse,
      ),

      catchError((err) => {
        const msg = err.error?.message ?? 'فشل تحديث النسبة';
        return throwError(
          () => ({ success: false, message: msg }) as AddPricingResponse,
        );
      }),
    );
  }
}
