import { Injectable, signal } from '@angular/core';

export type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmOptions {
  title?: string;
  message: string;
  variant?: ConfirmVariant;
  confirmText?: string;
  cancelText?: string;
  icon?: string;
}

interface InternalConfirmState extends ConfirmOptions {
  open: boolean;
  resolve?: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private _state = signal<InternalConfirmState>({ open: false, message: '' });
  readonly state = this._state.asReadonly();

  ask(options: ConfirmOptions): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      this._state.set({
        open: true,
        title: options.title ?? 'تأكيد العملية',
        message: options.message,
        variant: options.variant ?? 'warning',
        confirmText: options.confirmText ?? 'تأكيد',
        cancelText: options.cancelText ?? 'إلغاء',
        icon: options.icon,
        resolve,
      });
    });
  }

  resolveConfirm() {
    const s = this._state();
    s.resolve?.(true);
    this._state.set({ open: false, message: '' });
  }

  resolveCancel() {
    const s = this._state();
    s.resolve?.(false);
    this._state.set({ open: false, message: '' });
  }
}
