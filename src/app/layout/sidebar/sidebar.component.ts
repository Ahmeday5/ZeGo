import { Component, OnInit, AfterViewInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common'; // إضافة CommonModule

interface MenuItem {
  label: string;
  path: string | null; // ممكن يكون null لعنصر "تسجيل الخروج"
  iconActive?: string;
  iconInactive?: string;
  icons?: string; // للحالات اللي عندك key مختلف
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule], // إضافة RouterModule لدعم routerLink و routerLinkActive
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit, AfterViewInit {
  // حالة الـ Sidebar (مفتوحة أو مغلقة)
  isSidebarOpen: boolean = window.innerWidth > 992;

  // حقن Router و AuthService
  constructor(private authService: AuthService, private router: Router) {}

  // التهيئة عند تحميل الكومبوننت
  ngOnInit(): void {
    // لا حاجة لتهيئة إضافية
  }

  // بعد تحميل العرض
  ngAfterViewInit(): void {
    // إضافة مستمع لتغيير حجم النافذة
    window.addEventListener('resize', () => {
      this.isSidebarOpen = window.innerWidth > 992;
    });
  }

  // فتح/قفل الـ Sidebar
  toggleSidebar(): void {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  // دالة تسجيل الخروج
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  // دالة للتحقق إذا كان العنصر هو زر تسجيل الخروج
  isLogoutItem(item: any): boolean {
    return item.label === 'تسجيل الخروج';
  }

  // ===== تغيير مهم: الدالة تقبل string | null =====
  // إذا path = null فنحن نرجع false مباشرة (مش نشط)
  isActive(path: string | null): boolean {
    if (!path) return false;

    return this.router.isActive(path, {
      paths: 'subset',
      queryParams: 'subset',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  // قائمة العناصر في الـ Sidebar
  menuItems: MenuItem[] = [
    {
      label: 'الرئيسية',
      path: '/dashboard',
      iconActive: 'fas fa-home text-primary', // أزرق لما تكون في الداشبورد
      iconInactive: 'fas fa-home',
    },
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
    {
      label: 'محرر التسعير',
      path: '/Pricing-editor',
      iconActive: 'fas fa-money-bill-wave text-info',
      iconInactive: 'fas fa-money-bill-wave',
    },
    {
      label: 'التقارير',
      path: '/reports-finances',
      iconActive: 'fas fa-chart-bar text-danger',
      iconInactive: 'fas fa-chart-bar',
    },
    {
      label: 'الرسائل',
      path: '/Notification', // أو أي path عندك
      iconActive: 'fas fa-envelope text-primary',
      iconInactive: 'far fa-envelope',
    },
    {
      label: 'تسجيل الخروج',
      path: null,
      icons: 'fas fa-sign-out-alt text-muted',
    },
  ];
}
