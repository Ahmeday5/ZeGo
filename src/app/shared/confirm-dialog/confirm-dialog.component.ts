import { Component, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmService } from './confirm.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss',
})
export class ConfirmDialogComponent {
  private confirm = inject(ConfirmService);
  state = this.confirm.state;

  iconFor(variant: string | undefined, override?: string): string {
    if (override) return override;
    switch (variant) {
      case 'danger': return 'fa-triangle-exclamation';
      case 'success': return 'fa-circle-check';
      case 'info': return 'fa-circle-info';
      default: return 'fa-circle-exclamation';
    }
  }

  onConfirm() {
    this.confirm.resolveConfirm();
  }

  onCancel() {
    this.confirm.resolveCancel();
  }

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.state().open) this.onCancel();
  }
}
