export interface NavItem {
  label: string;
  path: string;
  iconActive: string;
  iconInactive: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    title: 'الرئيسية',
    items: [
      {
        label: 'الرئيسية',
        path: '/dashboard',
        iconActive: 'fas fa-home text-primary',
        iconInactive: 'fas fa-home',
      },
    ],
  },
  {
    title: 'المستخدمين',
    items: [
      {
        label: 'إدارة المستخدمين',
        path: '/manage-users',
        iconActive: 'fas fa-users text-success',
        iconInactive: 'fas fa-users',
      },
      {
        label: 'إدارة المديرين',
        path: '/all-admins',
        iconActive: 'fas fa-user-shield text-warning',
        iconInactive: 'fas fa-user-shield',
      },
    ],
  },
  {
    title: 'المالية',
    items: [
      {
        label: 'التسعير حسب المحافظة',
        path: '/Pricing-editor',
        iconActive: 'fas fa-money-bill-wave text-info',
        iconInactive: 'fas fa-money-bill-wave',
      },
      {
        label: 'أكواد الخصم',
        path: '/promo-codes',
        iconActive: 'fas fa-ticket text-warning',
        iconInactive: 'fas fa-ticket',
      },
      {
        label: 'التقارير',
        path: '/reports-finances',
        iconActive: 'fas fa-chart-bar text-danger',
        iconInactive: 'fas fa-chart-bar',
      },
    ],
  },
  {
    title: 'المحتوى والتواصل',
    items: [
      {
        label: 'الرسائل',
        path: '/Notification',
        iconActive: 'fas fa-envelope text-primary',
        iconInactive: 'far fa-envelope',
      },
      {
        label: 'جهات الاتصال',
        path: '/contents',
        iconActive: 'fas fa-headset text-success',
        iconInactive: 'fas fa-headset',
      },
      {
        label: 'Google Maps',
        path: '/google-maps-usage',
        iconActive: 'fas fa-map-location-dot text-success',
        iconInactive: 'fas fa-map-location-dot',
      },
    ],
  },
];
