import { Injectable, signal } from '@angular/core';

/** يحفظ حالة تصغير الـ Sidebar بين الجلسات (سطح المكتب فقط). */
const COLLAPSED_STORAGE_KEY = 'sidebarCollapsed';

/**
 * مصدر واحد للحقيقة لحالة الـ Sidebar، بيسمح لأي مكوّن (Header مستقبلًا، أو الشِل
 * نفسه) بالتحكم في فتح/قفل/تصغير الـ Sidebar بدون الحاجة لمرجع مباشر للكومبوننت.
 */
@Injectable({ providedIn: 'root' })
export class SidebarService {
  /** مفتوحة في وضع الموبايل (Drawer) أم مقفولة. */
  readonly isOpen = signal(false);
  /** مصغّرة في وضع سطح المكتب (أيقونات فقط) أم كاملة. */
  readonly isCollapsed = signal(this.readStoredCollapsed());

  open(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggleOpen(): void {
    this.isOpen.set(!this.isOpen());
  }

  toggleCollapsed(): void {
    const next = !this.isCollapsed();
    this.isCollapsed.set(next);
    localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
  }

  private readStoredCollapsed(): boolean {
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
  }
}
