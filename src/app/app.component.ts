import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { SidebarService } from './services/sidebar.service';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';
import { ToastContainerComponent } from './shared/toast/toast-container.component';
import { ConfirmDialogComponent } from './shared/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    CommonModule,
    SidebarComponent,
    HeaderComponent,
    ToastContainerComponent,
    ConfirmDialogComponent,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'ZeGo';
  isLoggedIn$: Observable<boolean>;

  private readonly sidebarService = inject(SidebarService);
  readonly isSidebarCollapsed = this.sidebarService.isCollapsed;

  constructor(private authService: AuthService, private router: Router) {
    this.isLoggedIn$ = this.authService.isLoggedIn$;
    setTimeout(() => this.checkAuth(), 0);
  }

  checkAuth(): void {
    this.isLoggedIn$.pipe(take(1)).subscribe((isLoggedIn) => {
      console.log('Checking auth, isLoggedIn:', isLoggedIn);
      if (!isLoggedIn) {
        const currentUrl = this.router.url;
        if (currentUrl !== '/' && currentUrl !== '/login') {
          console.warn('User not logged in, redirecting to login');
          this.router.navigate(['/']);
        }
      }
    });
  }
}
