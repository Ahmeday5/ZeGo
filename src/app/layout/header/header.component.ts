import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SidebarService } from '../../services/sidebar.service';

const SIDEBAR_TOGGLE_ATTR = 'data-sidebar-toggle';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sidebarService = inject(SidebarService);

  readonly isMobile = signal(window.innerWidth <= 992);
  readonly isSidebarOpen = this.sidebarService.isOpen;
  readonly isSidebarCollapsed = this.sidebarService.isCollapsed;

  readonly sidebarToggleAttr = SIDEBAR_TOGGLE_ATTR;

  @HostListener('window:resize')
  onResize(): void {
    this.isMobile.set(window.innerWidth <= 992);
  }

  toggleSidebar(): void {
    if (this.isMobile()) {
      this.sidebarService.toggleOpen();
    } else {
      this.sidebarService.toggleCollapsed();
    }
  }

  logout(): void {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
      this.authService.logout();
      this.router.navigate(['/']);
    }
  }
}
