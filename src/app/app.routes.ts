import { Router, Routes } from '@angular/router';
import { canActivate } from './guards/auth.guard';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { map } from 'rxjs';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { ManageUsersComponent } from './components/manage-users/manage-users.component';
import { CustomerListComponent } from './components/manage-users/customer-list/customer-list.component';
import { ListDriversComponent } from './components/manage-users/list-drivers/list-drivers.component';
import { DriverApprovalsComponent } from './components/manage-users/driver-approvals/driver-approvals.component';
import { FinancesComponent } from './components/reports/finances/finances.component';
import { PricePerformanceComponent } from './components/reports/price-performance/price-performance.component';
import { PricingEditorComponent } from './components/pricing-editor/pricing-editor.component';
import { AllAdminComponent } from './components/admins/all-admin/all-admin.component';
import { UpdateAdminComponent } from './components/admins/update-admin/update-admin.component';
import { AddAdminComponent } from './components/admins/add-admin/add-admin.component';
import { NotificationComponent } from './components/notification/notification.component';
import { ContentsComponent } from './components/contents/contents.component';
import { LastTripsDetailsComponent } from './components/last-trips-details/last-trips-details.component';
import { GoogleMapsUsageComponent } from './components/google-maps-usage/google-maps-usage.component';
import { PromoCodesComponent } from './components/promo-codes/promo-codes.component';

export const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
    canActivate: [
      () => {
        const authService = inject(AuthService);
        const router = inject(Router);
        return authService.isLoggedIn$.pipe(
          map((isLoggedIn) => {
            if (isLoggedIn) {
              return router.createUrlTree(['/dashboard']);
            }
            return true;
          }),
        );
      },
    ],
  },
  { path: 'login', redirectTo: '', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: DashboardComponent,
    title: 'اللوحة الرئيسية',
    canActivate: [canActivate],
  },
  {
    path: 'last-trip/:tripId',
    component: LastTripsDetailsComponent,
    title: 'تفاصيل الرحلة',
    canActivate: [canActivate],
  },
  {
    path: 'manage-users',
    component: ManageUsersComponent,
    title: 'إدارة المستخدمين',
    canActivate: [canActivate],
    children: [
      {
        path: 'list-customer',
        component: CustomerListComponent,
        title: 'قائمة العملاء',
        canActivate: [canActivate],
      },
      {
        path: 'list-driver',
        component: ListDriversComponent,
        title: 'قائمة السائقين',
        canActivate: [canActivate],
      },
      {
        path: '',
        redirectTo: 'list-customer',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: 'driver-details/:id',
    component: DriverApprovalsComponent,
    title: 'تفاصيل السائق',
    canActivate: [canActivate],
  },
  {
    path: 'reports-finances',
    component: FinancesComponent,
    title: 'الماليات',
    canActivate: [canActivate],
  },
  {
    path: 'finances-driver/:nationalId',
    component: PricePerformanceComponent,
    title: 'تقارير رحلات سائق',
    canActivate: [canActivate],
  },
  {
    path: 'Pricing-editor',
    component: PricingEditorComponent,
    title: 'التسعير حسب المحافظة',
    canActivate: [canActivate],
  },
  {
    path: 'promo-codes',
    component: PromoCodesComponent,
    title: 'أكواد الخصم',
    canActivate: [canActivate],
  },
  {
    path: 'all-admins',
    component: AllAdminComponent,
    title: 'المديرين',
    canActivate: [canActivate],
  },
  {
    path: 'edit-admin/:id',
    component: UpdateAdminComponent,
    title: 'تعديل مدير',
    canActivate: [canActivate],
  },
  {
    path: 'add-admin',
    component: AddAdminComponent,
    title: 'اضافة مدير',
    canActivate: [canActivate],
  },
  {
    path: 'Notification',
    component: NotificationComponent,
    title: 'الرسائل',
    canActivate: [canActivate],
  },
  {
    path: 'contents',
    component: ContentsComponent,
    title: 'جهات الاتصال',
    canActivate: [canActivate],
  },
  {
    path: 'google-maps-usage',
    component: GoogleMapsUsageComponent,
    title: 'استخدام Google Maps',
    canActivate: [canActivate],
  },
];
