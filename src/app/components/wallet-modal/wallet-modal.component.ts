import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../shared/toast/toast.service';
import {
  WalletAdjustType,
  WalletTransaction,
  WalletUserType,
} from '../../types/wallet.type';

interface WalletUserOption {
  id: number;
  name: string;
  phone: string;
}

@Component({
  selector: 'app-wallet-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './wallet-modal.component.html',
  styleUrl: './wallet-modal.component.scss',
})
export class WalletModalComponent implements OnChanges {
  @Input() visible = false;
  @Input() userType: WalletUserType = 'Client';
  @Input() userId: number | null = null;
  @Input() ownerName: string | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() adjusted = new EventEmitter<WalletTransaction>();

  @ViewChild('userPicker') userPicker?: ElementRef<HTMLDivElement>;

  // current selection
  selectedUserId: number | null = null;
  selectedUserLabel = '';

  // dropdown
  pickerOpen = false;
  pickerSearch = '';
  pickerLoading = false;
  users: WalletUserOption[] = [];

  transactions: WalletTransaction[] = [];
  pageIndex = 1;
  pageSize = 10;
  totalCount = 0;
  totalPages = 0;
  loadingTx = false;

  searchTerm = '';
  filterType: '' | 'إضافة' | 'خصم' = '';

  adjustForm: FormGroup;
  adjustLoading = false;

  currentBalance: number | null = null;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {
    this.adjustForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(1)]],
      type: ['Credit' as WalletAdjustType, Validators.required],
      description: ['', [Validators.minLength(2)]],
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.resetState();
      this.loadUsers();
      if (this.userId) {
        this.selectedUserId = this.userId;
        this.selectedUserLabel = this.ownerName
          ? `${this.ownerName} · #${this.userId}`
          : `#${this.userId}`;
        this.loadTransactions(1);
      }
    }
  }

  private resetState() {
    this.transactions = [];
    this.pageIndex = 1;
    this.totalCount = 0;
    this.totalPages = 0;
    this.searchTerm = '';
    this.filterType = '';
    this.currentBalance = null;
    this.selectedUserId = null;
    this.selectedUserLabel = '';
    this.pickerSearch = '';
    this.pickerOpen = false;
    this.adjustForm.reset({ amount: null, type: 'Credit', description: '' });
  }

  private loadUsers() {
    this.pickerLoading = true;
    const params = new HttpParams()
      .set(this.userType === 'Client' ? 'pageIndex' : 'PageIndex', '1')
      .set(this.userType === 'Client' ? 'pageSize' : 'PageSize', '1000000000');

    if (this.userType === 'Client') {
      this.api.getAllClients(params).subscribe({
        next: (res) => {
          this.users = (res.data || []).map((c) => ({
            id: c.id,
            name: c.name,
            phone: c.phone,
          }));
          this.pickerLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.pickerLoading = false;
        },
      });
    } else {
      this.api.getAllDrivers(params).subscribe({
        next: (res) => {
          this.users = (res.data?.data || []).map((d) => ({
            id: d.id,
            name: d.name,
            phone: d.phone,
          }));
          this.pickerLoading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.pickerLoading = false;
        },
      });
    }
  }

  get filteredUsers(): WalletUserOption[] {
    const t = this.pickerSearch.trim().toLowerCase();
    if (!t) return this.users;
    return this.users.filter(
      (u) =>
        u.name?.toLowerCase().includes(t) ||
        u.phone?.toLowerCase().includes(t) ||
        u.id.toString().includes(t),
    );
  }

  togglePicker() {
    this.pickerOpen = !this.pickerOpen;
    if (this.pickerOpen) this.pickerSearch = '';
  }

  selectUser(user: WalletUserOption) {
    this.selectedUserId = user.id;
    this.selectedUserLabel = `${user.name} · #${user.id}`;
    this.pickerOpen = false;
    this.transactions = [];
    this.currentBalance = null;
    this.loadTransactions(1);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent) {
    if (!this.pickerOpen) return;
    const target = event.target as HTMLElement;
    if (this.userPicker && !this.userPicker.nativeElement.contains(target)) {
      this.pickerOpen = false;
    }
  }

  loadTransactions(page: number) {
    if (!this.selectedUserId) return;
    this.loadingTx = true;
    this.api
      .getWalletTransactions(this.userType, this.selectedUserId, page, this.pageSize)
      .subscribe({
        next: (res) => {
          this.pageIndex = res.pageIndex || 1;
          this.totalCount = res.count || 0;
          this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
          this.transactions = res.data || [];
          if (this.transactions.length && this.pageIndex === 1) {
            this.currentBalance = this.transactions[0].balanceAfter;
          } else if (!this.transactions.length) {
            this.currentBalance = 0;
          }
          this.loadingTx = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.toast.error(err.message || 'فشل جلب معاملات المحفظة', 'خطأ');
          this.loadingTx = false;
          this.cdr.detectChanges();
        },
      });
  }

  get filteredTransactions(): WalletTransaction[] {
    const term = this.searchTerm.trim().toLowerCase();
    return this.transactions.filter((t) => {
      const matchesType = this.filterType ? t.type === this.filterType : true;
      if (!matchesType) return false;
      if (!term) return true;
      const haystack = [
        t.description ?? '',
        t.performedBy ?? '',
        t.amount?.toString() ?? '',
        t.balanceAfter?.toString() ?? '',
        t.id?.toString() ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }

  submitAdjust() {
    if (this.adjustForm.invalid || !this.selectedUserId) {
      this.adjustForm.markAllAsTouched();
      if (!this.selectedUserId) {
        this.toast.warning('اختر العميل/السائق أولًا');
      }
      return;
    }
    this.adjustLoading = true;

    const v = this.adjustForm.value;
    this.api
      .adjustWallet({
        userType: this.userType,
        userId: this.selectedUserId,
        amount: Number(v.amount),
        type: v.type,
        description: v.description.trim(),
      })
      .subscribe({
        next: (tx) => {
          this.adjustLoading = false;
          const label = v.type === 'Credit' ? 'تم إضافة' : 'تم خصم';
          this.toast.success(
            `${label} ${tx.amount} ج.م. الرصيد الحالي: ${tx.balanceAfter} ج.م`,
            'تم تعديل المحفظة',
          );
          this.currentBalance = tx.balanceAfter;
          this.adjusted.emit(tx);
          this.adjustForm.reset({ amount: null, type: 'Credit', description: '' });
          this.loadTransactions(1);
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.adjustLoading = false;
          this.toast.error(err.message || 'فشل تعديل رصيد المحفظة', 'خطأ');
          this.cdr.detectChanges();
        },
      });
  }

  onPageChange(page: number) {
    if (page < 1 || page > this.totalPages || page === this.pageIndex) return;
    this.loadTransactions(page);
  }

  close() {
    this.closed.emit();
  }

  formatDate(date: string): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return date;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  get pages(): number[] {
    if (this.totalPages <= 1) return [];
    const max = 5;
    let start = Math.max(1, this.pageIndex - 2);
    let end = Math.min(this.totalPages, start + max - 1);
    start = Math.max(1, end - max + 1);
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }
}
