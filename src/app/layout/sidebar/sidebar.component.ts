import {
  Component,
  ElementRef,
  HostListener,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NAV_SECTIONS, NavSection } from '../../core/constants/nav-sections.const';
import { SidebarService } from '../../services/sidebar.service';

const MOBILE_BREAKPOINT_PX = 992;
const SIDEBAR_TOGGLE_ATTR = 'data-sidebar-toggle';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
})
export class SidebarComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly sidebarService = inject(SidebarService);
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly isMobile = signal(this.computeIsMobile());
  readonly isOpen = this.sidebarService.isOpen;
  readonly isCollapsed = this.sidebarService.isCollapsed;

  /** مصغّرة فعليًا فقط في وضع سطح المكتب - الموبايل دايمًا بعرضه الكامل. */
  readonly isMiniMode = computed(() => this.isCollapsed() && !this.isMobile());

  readonly sections: readonly NavSection[] = NAV_SECTIONS;

  ngOnInit(): void {
    // في وضع سطح المكتب الـ Sidebar ظاهرة دايمًا (الفتح/القفل يخص الموبايل فقط)
    if (!this.isMobile()) {
      this.sidebarService.close();
    }
  }

  @HostListener('window:resize')
  onResize(): void {
    const wasMobile = this.isMobile();
    const nowMobile = this.computeIsMobile();
    this.isMobile.set(nowMobile);

    // الانتقال من موبايل لسطح مكتب أو العكس: نصفّر حالة الفتح لتفادي حالة متضاربة
    if (wasMobile !== nowMobile) {
      this.sidebarService.close();
    }
  }

  /** يقفل الـ Drawer لو ضغط المستخدم برة الـ Sidebar وبرة زر الفتح نفسه. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isMobile() || !this.isOpen()) return;

    const target = event.target as HTMLElement | null;
    if (!target) return;
    if (this.host.nativeElement.contains(target)) return;
    if (target.closest(`[${SIDEBAR_TOGGLE_ATTR}]`)) return;

    this.sidebarService.close();
  }

  closeSidebar(): void {
    this.sidebarService.close();
  }

  /** ينفّذ بعد أي ضغط على لينك: يقفل الـ Drawer في الموبايل فقط. */
  onLinkClicked(): void {
    if (this.isMobile()) {
      this.sidebarService.close();
    }
  }

  isActive(path: string): boolean {
    return this.router.isActive(path, {
      paths: 'subset',
      queryParams: 'subset',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  private computeIsMobile(): boolean {
    return window.innerWidth <= MOBILE_BREAKPOINT_PX;
  }
}
