import { Injectable, signal } from '@angular/core';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: number;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration: number;
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<ToastItem[]>([]);
  readonly toasts = this._toasts.asReadonly();
  private nextId = 1;

  success(message: string, title?: string, duration = 4000) {
    this.push('success', message, title, duration);
  }

  error(message: string, title?: string, duration = 5000) {
    this.push('error', message, title, duration);
  }

  warning(message: string, title?: string, duration = 4500) {
    this.push('warning', message, title, duration);
  }

  info(message: string, title?: string, duration = 4000) {
    this.push('info', message, title, duration);
  }

  dismiss(id: number) {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  private push(variant: ToastVariant, message: string, title: string | undefined, duration: number) {
    const id = this.nextId++;
    const item: ToastItem = {
      id,
      variant,
      title,
      message,
      duration,
      createdAt: Date.now(),
    };
    this._toasts.update((list) => [...list, item]);
    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }
}
