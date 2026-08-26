import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { catchError, map, Observable, of, shareReplay, throwError } from 'rxjs';

import {
  DashboardLastTripsData,
  DashboardLastTripsResponse,
  DashboardSummaryData,
  DashboardSummaryResponse,
  DashboardTripsStatusData,
  DashboardTripsStatusResponse,
  MapsUsageData,
  MapsUsageResponse,
  MapsSummaryData,
  MapsSummaryResponse,
} from '../types/dashboard.type';
import { allClient, ClientsResponse } from '../types/clients.type';
import { DriversResponse } from '../types/driver.type';
import {
  AddPricingResponse,
  ApiResponse,
  PricingRow,
  PricingAllResponse,
  PricingByGovernmentResponse,
  PricingUpsertRequest,
} from '../types/pricing.type';
import {
  PromoCode,
  PromoCodeCreateRequest,
  PromoCodeUpdateRequest,
  PromoCodesListResponse,
  PromoCodesPage,
  PromoCodeRedemptionsResponse,
  PromoCodeRedemptionsPage,
} from '../types/promo-code.type';
import { AddAdminResponse, adminsResponse } from '../types/admins.type';
import { Government, GovernmentResponse } from '../types/government.type';
import { ReportsApiResponse } from '../types/reports.type';
import { allContent, allContentResponse } from '../types/content.type';
import {
  WalletAdjustRequest,
  WalletAdjustResponse,
  WalletTransaction,
  WalletTransactionsPage,
  WalletTransactionsResponse,
} from '../types/wallet.type';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private baseUrl = 'https://zego.premiumasp.net';
  private governmentsCache$: Observable<Government[]> | null = null;

  constructor(private http: HttpClient) {}

  /************************************************Dashboard********************************************************/

  getTotalSummary(): Observable<DashboardSummaryData> {
    return this.http
      .get<DashboardSummaryResponse>(`${this.baseUrl}/api/Dashboard/summary`)
      .pipe(
        map((res) => {
          if (res.statusCode === 200 && res.data) return res.data;
          throw new Error('Invalid response');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في جلب الإحصائيات:', error);
          return throwError(() => new Error(this.resolveErrorMessage(error, 'فشل جلب الإحصائيات')));
        }),
      );
  }

  getLastTrips(pageSize: number, page: number): Observable<DashboardLastTripsData> {
    const params = new HttpParams()
      .set('pageSize', pageSize.toString())
      .set('page', page.toString());

    return this.http
      .get<DashboardLastTripsResponse>(
        `${this.baseUrl}/api/Dashboard/trips/last-24-hours`,
        { params },
      )
      .pipe(
        map((res) => {
          if (res.statusCode === 200 && res.data) return res.data;
          throw new Error(res.message || 'Invalid response');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في جلب آخر الرحلات:', error);
          return throwError(() => new Error(this.resolveErrorMessage(error, 'فشل جلب آخر الرحلات')));
        }),
      );
  }

  getTripsStatus(): Observable<DashboardTripsStatusData[]> {
    return this.http
      .get<DashboardTripsStatusResponse>(
        `${this.baseUrl}/api/Dashboard/trips/status`,
      )
      .pipe(
        map((res) => {
          if (res.statusCode === 200 && res.data) return res.data;
          throw new Error('Invalid response');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في جلب حالات الرحلات:', error);
          return throwError(() => new Error(this.resolveErrorMessage(error, 'فشل جلب حالات الرحلات')));
        }),
      );
  }

  /************************************Governments (المحافظات)*******************************************/

  /** قائمة المحافظات - بيانات ثابتة نادرًا ما تتغير، فنخزّنها مؤقتًا (cache) عشان نتجنب تكرار الطلب في كل صفحة. */
  getGovernments(): Observable<Government[]> {
    if (!this.governmentsCache$) {
      this.governmentsCache$ = this.http
        .get<GovernmentResponse>(`${this.baseUrl}/api/Auth/government`)
        .pipe(
          map((res) => (res.statusCode === 200 && res.data ? res.data : [])),
          catchError((error: HttpErrorResponse) => {
            console.error('خطأ في جلب المحافظات:', error);
            return of([]);
          }),
          shareReplay(1),
        );
    }
    return this.governmentsCache$;
  }

  /************************************Clients*******************************************/

  getAllClients(params?: HttpParams): Observable<ClientsResponse> {
    return this.http
      .get<ClientsResponse>(`${this.baseUrl}/api/Dashboard/getAllClients`, { params })
      .pipe(
        map((res) => res || { data: [], pageIndex: 1, pageSize: 10, count: 0 }),
        catchError(() => of({ data: [], pageIndex: 1, pageSize: 10, count: 0 })),
      );
  }

  deactivateClients(id: number): Observable<string> {
    return this.http
      .put<string>(
        `${this.baseUrl}/api/Dashboard/deactivateClient/${id}`,
        {},
        { responseType: 'text' as 'json' },
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في حظر العميل ${id}:`, error);
          return throwError(() => new Error(this.resolveErrorMessage(error, `فشل حظر العميل ${id}`)));
        }),
      );
  }

  activateClients(id: number): Observable<string> {
    return this.http
      .put<string>(
        `${this.baseUrl}/api/Dashboard/activateClient/${id}`,
        {},
        { responseType: 'text' as 'json' },
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في تفعيل العميل ${id}:`, error);
          return throwError(() => new Error(this.resolveErrorMessage(error, `فشل تفعيل العميل ${id}`)));
        }),
      );
  }

  deletedClient(id: number): Observable<string> {
    return this.http
      .delete(`${this.baseUrl}/api/Dashboard/deleteClient/${id}`, {
        responseType: 'text' as const,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في حذف العميل ${id}:`, error);
          return throwError(() => new Error(this.resolveErrorMessage(error, `فشل حذف العميل ${id}`)));
        }),
      );
  }

  getClientById(id: number): Observable<allClient> {
    return this.http
      .get<allClient>(`${this.baseUrl}/api/Dashboard/getClientById/${id}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`Error fetching client ${id}:`, error);
          return throwError(() => new Error(this.resolveErrorMessage(error, 'فشل جلب بيانات العميل')));
        }),
      );
  }

  updateClient(
    id: number,
    Name: string,
    Phone: string,
    profileImage: File | null,
    Gender?: string,
  ): Observable<AddPricingResponse> {
    const formData = new FormData();
    formData.append('Name', Name);
    formData.append('Phone', Phone);
    if (profileImage) {
      formData.append('ProfileImageUrl', profileImage);
    }
    if (Gender) {
      formData.append('Gender', Gender);
    }

    return this.http
      .put<{ message: string }>(
        `${this.baseUrl}/api/Dashboard/updateClient/${id}`,
        formData,
      )
      .pipe(
        map(
          (res) =>
            ({
              success: true,
              message: res.message || 'تم تحديث العميل بنجاح',
            }) as AddPricingResponse,
        ),
        catchError((err) => {
          const errorMsg =
            err.error?.message ||
            (err.status === 400 ? 'بيانات غير صالحة' : 'فشل تحديث العميل');
          return throwError(() => ({ success: false, message: errorMsg }) as AddPricingResponse);
        }),
      );
  }

  resetClientPassword(id: number, body: { newPassword: string }): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/api/Dashboard/reset-client-password/${id}`, body)
      .pipe(
        map(() => ({ success: true, message: 'تم إعادة تعيين كلمة السر بنجاح' })),
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في إعادة تعيين كلمة المرور ${id}:`, error);
          return throwError(() => new Error(this.resolveErrorMessage(error, 'فشل إعادة تعيين كلمة المرور')));
        }),
      );
  }

  /************************************Drivers*******************************************/

  getAllDrivers(params?: HttpParams): Observable<DriversResponse> {
    return this.http
      .get<DriversResponse>(`${this.baseUrl}/api/Dashboard/drivers`, { params })
      .pipe(
        map(
          (res) =>
            res || { data: { data: [], pageIndex: 1, pageSize: 10, totalCount: 0 } },
        ),
        catchError((err) => {
          console.error('Error fetching drivers:', err);
          return of({ data: { data: [], pageIndex: 1, pageSize: 10, totalCount: 0 } });
        }),
      );
  }

  deactivateDriver(id: number): Observable<string> {
    return this.http
      .put<string>(
        `${this.baseUrl}/api/Dashboard/deactivate/${id}`,
        {},
        { responseType: 'text' as 'json' },
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في حظر السائق ${id}:`, error);
          return throwError(() => new Error(this.resolveErrorMessage(error, `فشل حظر السائق ${id}`)));
        }),
      );
  }

  activateDriver(id: number): Observable<string> {
    return this.http
      .put<string>(
        `${this.baseUrl}/api/Dashboard/activate/${id}`,
        {},
        { responseType: 'text' as 'json' },
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في تفعيل السائق ${id}:`, error);
          return throwError(() => new Error(this.resolveErrorMessage(error, `فشل تفعيل السائق ${id}`)));
        }),
      );
  }

  deletedDriver(id: number): Observable<string> {
    return this.http
      .delete(`${this.baseUrl}/api/Dashboard/deleteDriver/${id}`, {
        responseType: 'text' as const,
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في حذف السائق ${id}:`, error);
          return throwError(() => new Error(this.resolveErrorMessage(error, `فشل حذف السائق ${id}`)));
        }),
      );
  }

  getDriverById(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/Dashboard/driver/${id}`);
  }

  updateDriver(id: number, formData: FormData): Observable<any> {
    return this.http
      .put<{ message: string }>(
        `${this.baseUrl}/api/Dashboard/updateDriver/${id}`,
        formData,
      )
      .pipe(
        map((res) => ({
          success: true,
          message: res.message || 'تم تحديث بيانات السائق بنجاح',
        })),
        catchError((err: HttpErrorResponse) => {
          const errorMsg =
            err.error?.message ||
            (err.status === 400 ? 'البيانات غير صالحة' : 'فشل تحديث بيانات السائق');
          return throwError(() => ({ success: false, message: errorMsg }));
        }),
      );
  }

  resetDriverPassword(id: number, body: { newPassword: string }): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/api/Dashboard/reset-driver-password/${id}`, body)
      .pipe(
        map(() => ({ success: true, message: 'تم إعادة تعيين كلمة السر بنجاح' })),
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في إعادة تعيين كلمة المرور ${id}:`, error);
          return throwError(() => new Error(this.resolveErrorMessage(error, 'فشل إعادة تعيين كلمة المرور')));
        }),
      );
  }

  /**********************************Pricing (per government)**************************************/

  getAllPricing(): Observable<PricingRow[]> {
    return this.http
      .get<PricingAllResponse>(`${this.baseUrl}/api/Dashboard/pricing/all`)
      .pipe(
        map((res) => {
          if (res.statusCode === 200) return res.data || [];
          throw new Error(res.message || 'Invalid response');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في جلب قائمة الأسعار:', error);
          return throwError(() => new Error(this.resolveErrorMessage(error, 'فشل جلب قائمة الأسعار')));
        }),
      );
  }

  getPricingByGovernment(governmentId?: number | null): Observable<PricingRow | null> {
    let params = new HttpParams();
    if (governmentId !== null && governmentId !== undefined) {
      params = params.set('governmentId', governmentId.toString());
    }

    return this.http
      .get<PricingByGovernmentResponse>(`${this.baseUrl}/api/Dashboard/pricing`, { params })
      .pipe(
        map((res) => {
          if (res.statusCode === 200) return res.data;
          throw new Error(res.message || 'Invalid response');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في جلب سعر المحافظة:', error);
          return throwError(() => new Error(this.resolveErrorMessage(error, 'فشل جلب السعر')));
        }),
      );
  }

  upsertPricing(body: PricingUpsertRequest): Observable<AddPricingResponse> {
    return this.http
      .put<ApiResponse<null>>(`${this.baseUrl}/api/Dashboard/addEditPricing`, body)
      .pipe(
        map(
          (response) =>
            ({
              success: response.statusCode === 200,
              message: response.message,
            }) as AddPricingResponse,
        ),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في حفظ السعر:', error);
          const errorMessage = error.error?.message || 'حدث خطأ أثناء الحفظ';
          return throwError(
            () => ({ success: false, message: errorMessage }) as AddPricingResponse,
          );
        }),
      );
  }

  /**********************************Promo Codes**************************************/

  createPromoCode(body: PromoCodeCreateRequest): Observable<AddPricingResponse> {
    return this.http
      .post<ApiResponse<null>>(`${this.baseUrl}/api/Dashboard/promocodes`, body)
      .pipe(
        map(
          (res) =>
            ({ success: res.statusCode === 200, message: res.message }) as AddPricingResponse,
        ),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في إضافة كود الخصم:', error);
          const errorMessage = error.error?.message || 'حدث خطأ أثناء إضافة الكود';
          return throwError(
            () => ({ success: false, message: errorMessage }) as AddPricingResponse,
          );
        }),
      );
  }

  getPromoCodes(params?: HttpParams): Observable<PromoCodesPage> {
    return this.http
      .get<PromoCodesListResponse>(`${this.baseUrl}/api/Dashboard/promocodes`, { params })
      .pipe(
        map((res) => res?.data || { pageIndex: 1, pageSize: 20, count: 0, data: [] }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في جلب أكواد الخصم:', error);
          return of({ pageIndex: 1, pageSize: 20, count: 0, data: [] });
        }),
      );
  }

  getPromoCodeById(id: number): Observable<PromoCode> {
    return this.http
      .get<ApiResponse<PromoCode>>(`${this.baseUrl}/api/Dashboard/promocodes/${id}`)
      .pipe(
        map((res) => {
          if (res.statusCode === 200 && res.data) return res.data;
          throw new Error(res.message || 'Invalid response');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في جلب كود الخصم ${id}:`, error);
          return throwError(() => new Error(this.resolveErrorMessage(error, 'فشل جلب بيانات الكود')));
        }),
      );
  }

  updatePromoCode(id: number, body: PromoCodeUpdateRequest): Observable<AddPricingResponse> {
    return this.http
      .put<ApiResponse<null>>(`${this.baseUrl}/api/Dashboard/promocodes/${id}`, body)
      .pipe(
        map(
          (res) =>
            ({ success: res.statusCode === 200, message: res.message }) as AddPricingResponse,
        ),
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في تحديث كود الخصم ${id}:`, error);
          const errorMessage = error.error?.message || 'حدث خطأ أثناء التحديث';
          return throwError(
            () => ({ success: false, message: errorMessage }) as AddPricingResponse,
          );
        }),
      );
  }

  activatePromoCode(id: number): Observable<AddPricingResponse> {
    return this.http
      .put<ApiResponse<null>>(`${this.baseUrl}/api/Dashboard/promocodes/${id}/activate`, {})
      .pipe(
        map(
          (res) =>
            ({ success: res.statusCode === 200, message: res.message }) as AddPricingResponse,
        ),
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في تفعيل كود الخصم ${id}:`, error);
          return throwError(
            () =>
              ({
                success: false,
                message: this.resolveErrorMessage(error, 'فشل تفعيل الكود'),
              }) as AddPricingResponse,
          );
        }),
      );
  }

  deactivatePromoCode(id: number): Observable<AddPricingResponse> {
    return this.http
      .put<ApiResponse<null>>(`${this.baseUrl}/api/Dashboard/promocodes/${id}/deactivate`, {})
      .pipe(
        map(
          (res) =>
            ({ success: res.statusCode === 200, message: res.message }) as AddPricingResponse,
        ),
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في إيقاف كود الخصم ${id}:`, error);
          return throwError(
            () =>
              ({
                success: false,
                message: this.resolveErrorMessage(error, 'فشل إيقاف الكود'),
              }) as AddPricingResponse,
          );
        }),
      );
  }

  deletePromoCode(id: number): Observable<AddPricingResponse> {
    return this.http
      .delete<ApiResponse<null>>(`${this.baseUrl}/api/Dashboard/promocodes/${id}`)
      .pipe(
        map(
          (res) =>
            ({ success: res.statusCode === 200, message: res.message }) as AddPricingResponse,
        ),
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في حذف كود الخصم ${id}:`, error);
          return throwError(
            () =>
              ({
                success: false,
                message: this.resolveErrorMessage(error, 'فشل حذف الكود'),
              }) as AddPricingResponse,
          );
        }),
      );
  }

  getPromoCodeRedemptions(params?: HttpParams): Observable<PromoCodeRedemptionsPage> {
    return this.http
      .get<PromoCodeRedemptionsResponse>(`${this.baseUrl}/api/Dashboard/promocodes/redemptions`, {
        params,
      })
      .pipe(
        map((res) => res?.data || { pageIndex: 1, pageSize: 20, count: 0, data: [] }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في جلب سجل استخدام الأكواد:', error);
          return of({ pageIndex: 1, pageSize: 20, count: 0, data: [] });
        }),
      );
  }

  /***************************************************Admins*******************************************************/

  getAllAdmins(): Observable<adminsResponse> {
    return this.http
      .get<adminsResponse>(`${this.baseUrl}/api/Dashboard/getAllUsers`)
      .pipe(
        map((response) => response || { items: [], totalItems: 0 }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في جلب المشرفين:', error);
          return throwError(() => new Error(this.resolveErrorMessage(error, 'فشل جلب المشرفين')));
        }),
      );
  }

  updateAdmin(
    id: string,
    body: {
      email: string;
      role: string;
      newPassword?: string;
      userName: string;
    },
  ): Observable<any> {
    return this.http
      .put(`${this.baseUrl}/api/Dashboard/updateUser/${id}`, body, {
        responseType: 'text',
      })
      .pipe(
        map((response: string) => {
          const success = response.toLowerCase().trim().includes('successfully');
          return { success, message: response };
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في تحديث المشرف:', error);
          let errorMessage = 'حدث خطأ أثناء التحديث';
          if (error.status === 400 && Array.isArray(error.error)) {
            const duplicateError = error.error.find(
              (err: any) => err.code === 'DuplicateUserName',
            );
            errorMessage = duplicateError
              ? 'البريد الإلكتروني مستخدم بالفعل. يرجى إدخال بريد إلكتروني آخر.'
              : error.error.map((err: any) => err.description).join(', ') ||
                `خطأ ${error.status}: ${error.statusText}`;
          } else if (error.error && typeof error.error === 'string') {
            errorMessage = error.error;
          } else if (error.status) {
            errorMessage = `خطأ ${error.status}: ${error.statusText}`;
          }
          return throwError(() => ({ success: false, message: errorMessage }));
        }),
      );
  }

  deleteAdmin(id: string): Observable<string> {
    return this.http
      .delete<string>(`${this.baseUrl}/api/Dashboard/deleteUser/${id}`, {
        responseType: 'text' as 'json',
      })
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في حذف المشرف ${id}:`, error);
          return throwError(() => new Error(this.resolveErrorMessage(error, `فشل حذف المشرف ${id}`)));
        }),
      );
  }

  addAdmin(body: {
    email: string;
    password: string;
    userName: string;
    role: string;
  }): Observable<any> {
    return this.http
      .post(`${this.baseUrl}/api/Dashboard/addUser`, body)
      .pipe(
        map((response: any) => {
          const success = response.message.toLowerCase().includes('successfully');
          return {
            success,
            message: success ? 'تم إضافة المشرف بنجاح' : response.message,
            data: response.userId
              ? { userId: response.userId, email: response.email, role: response.role }
              : undefined,
          };
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في إضافة المشرف:', error);
          let errorMessage = 'حدث خطأ أثناء الإضافة';
          if (error.status === 400 && Array.isArray(error.error)) {
            const passwordErrors = error.error.filter((err: any) =>
              ['PasswordRequiresNonAlphanumeric', 'PasswordRequiresLower', 'PasswordRequiresUpper'].includes(err.code),
            );
            errorMessage = passwordErrors.length > 0
              ? 'كلمة المرور يجب أن تحتوي على حرف صغير، حرف كبير، ورمز غير أبجدي واحد على الأقل.'
              : error.error.map((err: any) => err.description).join(', ') ||
                `خطأ ${error.status}: ${error.statusText}`;
          } else if (typeof error.error === 'string') {
            errorMessage = error.error.toLowerCase().includes('email is already registered')
              ? 'البريد الإلكتروني مستخدم بالفعل. يرجى إدخال بريد إلكتروني آخر.'
              : error.error;
          } else if (error.status) {
            errorMessage = `خطأ ${error.status}: ${error.statusText}`;
          }
          return throwError(() => ({ success: false, message: errorMessage }));
        }),
      );
  }

  /************************************Reports*******************************************/

  getAllreports(params?: HttpParams): Observable<ReportsApiResponse> {
    return this.http
      .get<ReportsApiResponse>(
        `${this.baseUrl}/api/Dashboard/driver-profit-reports-adv`,
        { params },
      )
      .pipe(
        catchError((error) => {
          console.error('Error fetching driver profit reports:', error);
          return of({
            statusCode: error.status ? Number(error.status) : 500,
            message: String(error.error?.message || 'فشل تحميل التقارير'),
            data: {
              filterType: 'monthly' as 'monthly',
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

  /**********************************Content**************************************/

  addContent(body: {
    contactPhone: string;
    whatsAppPhone: string;
  }): Observable<AddPricingResponse> {
    return this.http
      .put<{ message: string }>(`${this.baseUrl}/api/Dashboard/addEditContact`, body)
      .pipe(
        map(
          (response) =>
            ({
              success: response.message.toLowerCase().includes('successfully'),
              message: response.message,
            }) as AddPricingResponse,
        ),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في إضافة الأرقام:', error);
          const errorMessage =
            typeof error.error === 'string'
              ? error.error
              : `خطأ ${error.status}: ${error.statusText}`;
          return throwError(
            () => ({ success: false, message: errorMessage }) as AddPricingResponse,
          );
        }),
      );
  }

  getContent(): Observable<allContent> {
    return this.http
      .get<allContentResponse>(`${this.baseUrl}/api/Dashboard/contact`)
      .pipe(
        map((res) => {
          if (res.statusCode === 200 && res.data) return res.data;
          throw new Error('Invalid response');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في جلب الأرقام:', error);
          return throwError(() => new Error(this.resolveErrorMessage(error, 'فشل جلب الأرقام')));
        }),
      );
  }

  /********************************************Percentage***************************************/

  updatePercentage(id: number, percentage: number): Observable<AddPricingResponse> {
    return this.http
      .put<ApiResponse<null>>(
        `${this.baseUrl}/api/Dashboard/updatePercentage/${id}?percentage=${percentage}`,
        null,
      )
      .pipe(
        map(
          (res) =>
            ({
              success: res.statusCode === 200,
              message: res.message ?? 'تم التحديث بنجاح',
            }) as AddPricingResponse,
        ),
        catchError((err) => {
          const msg = err.error?.message ?? 'فشل تحديث النسبة';
          return throwError(() => ({ success: false, message: msg }) as AddPricingResponse);
        }),
      );
  }

  /********************************************Wallet***************************************/

  adjustWallet(body: WalletAdjustRequest): Observable<WalletTransaction> {
    return this.http
      .post<WalletAdjustResponse>(`${this.baseUrl}/api/Dashboard/wallet/adjust`, body)
      .pipe(
        map((res) => {
          if (res.statusCode === 200 && res.data) return res.data;
          throw new Error(res.message || 'فشل تعديل رصيد المحفظة');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في تعديل رصيد المحفظة:', error);
          return throwError(() => new Error(this.resolveErrorMessage(error, 'فشل تعديل رصيد المحفظة')));
        }),
      );
  }

  getWalletTransactions(
    userType: 'Client' | 'Driver',
    userId: number,
    pageIndex: number,
    pageSize: number,
  ): Observable<WalletTransactionsPage> {
    const params = new HttpParams()
      .set('userType', userType)
      .set('userId', userId.toString())
      .set('pageIndex', pageIndex.toString())
      .set('pageSize', pageSize.toString());

    return this.http
      .get<WalletTransactionsResponse>(`${this.baseUrl}/api/Dashboard/wallet/transactions`, { params })
      .pipe(
        map((res) => {
          if (res.statusCode === 200 && res.data) return res.data;
          throw new Error(res.message || 'فشل جلب معاملات المحفظة');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في جلب معاملات المحفظة:', error);
          return throwError(() => new Error(this.resolveErrorMessage(error, 'فشل جلب معاملات المحفظة')));
        }),
      );
  }

  /************************************Google Maps Usage*******************************************/

  getGoogleMapsUsage(params?: { from?: string; to?: string; top?: number }): Observable<MapsUsageData> {
    let httpParams = new HttpParams();
    if (params?.from) httpParams = httpParams.set('from', params.from);
    if (params?.to) httpParams = httpParams.set('to', params.to);
    if (params?.top != null) httpParams = httpParams.set('top', params.top.toString());

    return this.http
      .get<MapsUsageResponse>(`${this.baseUrl}/api/Dashboard/google-maps-usage`, { params: httpParams })
      .pipe(
        map((res) => {
          if (res.statusCode === 200 && res.data) return res.data;
          throw new Error(res.message || 'Invalid response');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في جلب بيانات Google Maps:', error);
          return throwError(() => new Error(this.resolveErrorMessage(error, 'فشل جلب بيانات Google Maps')));
        }),
      );
  }

  getGoogleMapsSummary(params?: { from?: string; to?: string }): Observable<MapsSummaryData> {
    let httpParams = new HttpParams();
    if (params?.from) httpParams = httpParams.set('from', params.from);
    if (params?.to) httpParams = httpParams.set('to', params.to);

    return this.http
      .get<MapsSummaryResponse>(`${this.baseUrl}/api/Dashboard/google-maps-usage/summary`, { params: httpParams })
      .pipe(
        map((res) => {
          if (res.statusCode === 200 && res.data) return res.data;
          throw new Error(res.message || 'Invalid response');
        }),
        catchError((error: HttpErrorResponse) => {
          console.error('خطأ في جلب ملخص Google Maps:', error);
          return throwError(() => new Error(this.resolveErrorMessage(error, 'فشل جلب ملخص Google Maps')));
        }),
      );
  }

  /************************************Trips*******************************************/

  cancelTrip(tripId: number): Observable<{ statusCode: number; message: string; data: null }> {
    return this.http
      .put<{ statusCode: number; message: string; data: null }>(
        `${this.baseUrl}/api/Dashboard/trips/${tripId}/cancel`,
        {},
      )
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error(`خطأ في إلغاء الرحلة ${tripId}:`, error);
          return throwError(() => new Error(this.resolveErrorMessage(error, `فشل إلغاء الرحلة ${tripId}`)));
        }),
      );
  }

  /********************************************Helpers***************************************/

  private resolveErrorMessage(error: HttpErrorResponse, fallback: string): string {
    if (error.status === 0) return 'فشل الاتصال بالخادم. تحقق من الشبكة.';
    if (error.status === 404) return 'المورد غير موجود.';
    if (error.error?.message) return error.error.message;
    return fallback;
  }
}
