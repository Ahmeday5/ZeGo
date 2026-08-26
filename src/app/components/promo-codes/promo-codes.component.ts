import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../shared/toast/toast.service';
import { ConfirmService } from '../../shared/confirm-dialog/confirm.service';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { SearchSelectComponent, SearchSelectOption } from '../../shared/search-select/search-select.component';
import {
  PromoCode,
  PromoCodeCreateRequest,
  PromoCodeRedemption,
  PromoCodeUpdateRequest,
} from '../../types/promo-code.type';

type ActiveTab = 'codes' | 'redemptions';

@Component({
  selector: 'app-promo-codes',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginationComponent, SearchSelectComponent],
  templateUrl: './promo-codes.component.html',
  styleUrl: './promo-codes.component.scss',
})
export class PromoCodesComponent implements OnInit {
  activeTab: ActiveTab = 'codes';

  /*** الأكواد ***/
  promoCodes: PromoCode[] = [];
  loading = false;
  showFilter = false;
  currentPage = 1;
  pageSize = 20;
  totalCount = 0;
  totalPages = 0;

  filterForm: FormGroup;

  showCreateModal = false;
  createLoading = false;
  createForm: FormGroup;

  showEditModal = false;
  editLoading = false;
  editForm: FormGroup;
  selectedPromoCode: PromoCode | null = null;

  /*** سجل الاستخدام ***/
  redemptions: PromoCodeRedemption[] = [];
  redemptionsLoading = false;
  redemptionsLoadedOnce = false;
  redemptionsCurrentPage = 1;
  redemptionsPageSize = 20;
  redemptionsTotalCount = 0;
  redemptionsTotalPages = 0;
  redemptionsFilterForm: FormGroup;

  promoCodeOptions: SearchSelectOption[] = [];
  promoCodeOptionsLoading = false;
  clientOptions: SearchSelectOption[] = [];
  clientOptionsLoading = false;
  driverOptions: SearchSelectOption[] = [];
  driverOptionsLoading = false;

  @ViewChild('promoCodeSelect') promoCodeSelect?: SearchSelectComponent;
  @ViewChild('clientSelect') clientSelect?: SearchSelectComponent;
  @ViewChild('driverSelect') driverSelect?: SearchSelectComponent;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private confirm: ConfirmService,
  ) {
    this.filterForm = this.fb.group({
      code: [''],
      isActive: [''],
    });

    this.createForm = this.fb.group({
      code: ['', Validators.required],
      discountPercentage: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      maxDiscountAmount: [null],
      maxTotalUsage: [null],
      maxUsagePerClient: [null],
    });

    this.editForm = this.fb.group({
      discountPercentage: [null, [Validators.required, Validators.min(0), Validators.max(100)]],
      maxDiscountAmount: [null],
      maxTotalUsage: [null],
      maxUsagePerClient: [null],
    });

    this.redemptionsFilterForm = this.fb.group({
      promoCodeId: [''],
      clientId: [''],
      driverId: [''],
      status: [''],
    });
  }

  ngOnInit(): void {
    this.loadPromoCodes(1);
  }

  switchTab(tab: ActiveTab): void {
    this.activeTab = tab;
    if (tab === 'redemptions' && !this.redemptionsLoadedOnce) {
      this.redemptionsLoadedOnce = true;
      this.loadRedemptions(1);
    }
  }

  searchPromoCodeOptions(term: string): void {
    this.promoCodeOptionsLoading = true;
    let params = new HttpParams().set('pageIndex', '1').set('pageSize', '20');
    if (term?.trim()) params = params.set('code', term.trim());

    this.api.getPromoCodes(params).subscribe({
      next: (res) => {
        this.promoCodeOptions = (res.data || []).map((pc) => ({ id: pc.id, label: pc.code }));
        this.promoCodeOptionsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.promoCodeOptions = [];
        this.promoCodeOptionsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  searchClientOptions(term: string): void {
    this.clientOptionsLoading = true;
    let params = new HttpParams().set('pageIndex', '1').set('pageSize', '20');
    if (term?.trim()) params = params.set('name', term.trim());

    this.api.getAllClients(params).subscribe({
      next: (res) => {
        this.clientOptions = (res.data || []).map((c) => ({ id: c.id, label: c.name }));
        this.clientOptionsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.clientOptions = [];
        this.clientOptionsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  searchDriverOptions(term: string): void {
    this.driverOptionsLoading = true;
    let params = new HttpParams().set('pageIndex', '1').set('pageSize', '20');
    if (term?.trim()) params = params.set('Name', term.trim());

    this.api.getAllDrivers(params).subscribe({
      next: (res) => {
        this.driverOptions = (res.data?.data || []).map((d) => ({ id: d.id, label: d.name }));
        this.driverOptionsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.driverOptions = [];
        this.driverOptionsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onPromoCodeOptionChange(option: SearchSelectOption | null): void {
    this.redemptionsFilterForm.patchValue({ promoCodeId: option ? option.id : '' });
  }

  onClientOptionChange(option: SearchSelectOption | null): void {
    this.redemptionsFilterForm.patchValue({ clientId: option ? option.id : '' });
  }

  onDriverOptionChange(option: SearchSelectOption | null): void {
    this.redemptionsFilterForm.patchValue({ driverId: option ? option.id : '' });
  }

  /*******************************************الأكواد****************************************************/

  loadPromoCodes(page: number, params: HttpParams = new HttpParams()): void {
    this.loading = true;
    this.currentPage = page;

    params = params.set('pageIndex', page.toString());
    params = params.set('pageSize', this.pageSize.toString());

    this.api.getPromoCodes(params).subscribe({
      next: (res) => {
        this.promoCodes = res.data || [];
        this.totalCount = res.count || 0;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);
        this.currentPage = res.pageIndex || 1;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.promoCodes = [];
        this.totalCount = 0;
        this.totalPages = 0;
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  getFilterParams(): HttpParams {
    let params = new HttpParams();
    const value = this.filterForm.value;

    if (value.code?.trim()) params = params.set('code', value.code.trim());
    if (value.isActive !== '' && value.isActive !== null) {
      params = params.set('isActive', value.isActive);
    }

    return params;
  }

  onFilter(): void {
    this.loadPromoCodes(1, this.getFilterParams());
  }

  onClear(): void {
    this.filterForm.reset();
    this.loadPromoCodes(1);
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  onPageChange(page: number): void {
    if (page === this.currentPage) return;
    this.loadPromoCodes(page, this.getFilterParams());
  }

  onPageSizeChange(size: number): void {
    if (size === this.pageSize) return;
    this.pageSize = size;
    this.loadPromoCodes(1, this.getFilterParams());
  }

  /*******************************************إضافة كود****************************************************/

  openCreateModal(): void {
    this.createForm.reset();
    this.showCreateModal = true;
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.createForm.reset();
    this.createLoading = false;
  }

  submitCreate(): void {
    if (this.createForm.invalid) {
      Object.values(this.createForm.controls).forEach((c) => c.markAsTouched());
      return;
    }

    const value = this.createForm.value;
    const body: PromoCodeCreateRequest = {
      code: value.code.trim(),
      discountPercentage: value.discountPercentage,
      maxDiscountAmount: value.maxDiscountAmount === '' ? null : value.maxDiscountAmount,
      maxTotalUsage: value.maxTotalUsage === '' ? null : value.maxTotalUsage,
      maxUsagePerClient: value.maxUsagePerClient === '' ? null : value.maxUsagePerClient,
    };

    this.createLoading = true;
    this.api.createPromoCode(body).subscribe({
      next: (res) => {
        this.createLoading = false;
        if (res.success) {
          this.toast.success('تم إضافة كود الخصم بنجاح', 'نجاح');
          this.closeCreateModal();
          this.loadPromoCodes(1, this.getFilterParams());
        } else {
          this.toast.error(res.message || 'فشل إضافة كود الخصم', 'خطأ');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.createLoading = false;
        this.toast.error(err.message || 'فشل إضافة كود الخصم', 'خطأ');
        this.cdr.detectChanges();
      },
    });
  }

  /*******************************************تعديل كود****************************************************/

  openEditModal(promoCode: PromoCode): void {
    this.selectedPromoCode = promoCode;
    this.editForm.patchValue({
      discountPercentage: promoCode.discountPercentage,
      maxDiscountAmount: promoCode.maxDiscountAmount,
      maxTotalUsage: promoCode.maxTotalUsage,
      maxUsagePerClient: promoCode.maxUsagePerClient,
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedPromoCode = null;
    this.editForm.reset();
    this.editLoading = false;
  }

  submitEdit(): void {
    if (this.editForm.invalid || !this.selectedPromoCode) {
      Object.values(this.editForm.controls).forEach((c) => c.markAsTouched());
      return;
    }

    const value = this.editForm.value;
    const body: PromoCodeUpdateRequest = {
      discountPercentage: value.discountPercentage,
      maxDiscountAmount: value.maxDiscountAmount === '' ? null : value.maxDiscountAmount,
      maxTotalUsage: value.maxTotalUsage === '' ? null : value.maxTotalUsage,
      maxUsagePerClient: value.maxUsagePerClient === '' ? null : value.maxUsagePerClient,
    };

    this.editLoading = true;
    this.api.updatePromoCode(this.selectedPromoCode.id, body).subscribe({
      next: (res) => {
        this.editLoading = false;
        if (res.success) {
          this.toast.success('تم تحديث كود الخصم بنجاح', 'نجاح');
          this.closeEditModal();
          this.loadPromoCodes(this.currentPage, this.getFilterParams());
        } else {
          this.toast.error(res.message || 'فشل تحديث كود الخصم', 'خطأ');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.editLoading = false;
        this.toast.error(err.message || 'فشل تحديث كود الخصم', 'خطأ');
        this.cdr.detectChanges();
      },
    });
  }

  /*******************************************تفعيل / إيقاف / حذف****************************************************/

  async toggleActive(promoCode: PromoCode): Promise<void> {
    const activating = !promoCode.isActive;
    const ok = await this.confirm.ask({
      title: activating ? 'تفعيل الكود' : 'إيقاف الكود',
      message: activating
        ? `هل أنت متأكد من تفعيل الكود "${promoCode.code}"؟`
        : `هل أنت متأكد من إيقاف الكود "${promoCode.code}"؟`,
      variant: activating ? 'success' : 'danger',
      icon: activating ? 'fa-toggle-on' : 'fa-toggle-off',
      confirmText: activating ? 'نعم، تفعيل' : 'نعم، إيقاف',
    });
    if (!ok) return;

    const request = activating
      ? this.api.activatePromoCode(promoCode.id)
      : this.api.deactivatePromoCode(promoCode.id);

    this.loading = true;
    request.subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.toast.success(activating ? 'تم تفعيل الكود بنجاح' : 'تم إيقاف الكود بنجاح', 'نجاح');
          this.loadPromoCodes(this.currentPage, this.getFilterParams());
        } else {
          this.toast.error(res.message || 'فشلت العملية', 'خطأ');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.message || 'فشلت العملية', 'خطأ');
        this.cdr.detectChanges();
      },
    });
  }

  async deletePromoCode(promoCode: PromoCode): Promise<void> {
    const ok = await this.confirm.ask({
      title: 'حذف كود الخصم',
      message: `هل أنت متأكد من حذف الكود "${promoCode.code}" نهائيًا؟ هذا الإجراء لا يمكن التراجع عنه.`,
      variant: 'danger',
      icon: 'fa-trash',
      confirmText: 'نعم، حذف',
    });
    if (!ok) return;

    this.loading = true;
    this.api.deletePromoCode(promoCode.id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.toast.success('تم حذف الكود بنجاح', 'نجاح');
          this.loadPromoCodes(this.currentPage, this.getFilterParams());
        } else {
          this.toast.error(res.message || 'فشل حذف الكود', 'خطأ');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.toast.error(err.message || 'فشل حذف الكود', 'خطأ');
        this.cdr.detectChanges();
      },
    });
  }

  /*******************************************سجل الاستخدام****************************************************/

  loadRedemptions(page: number, params: HttpParams = new HttpParams()): void {
    this.redemptionsLoading = true;
    this.redemptionsCurrentPage = page;

    params = params.set('pageIndex', page.toString());
    params = params.set('pageSize', this.redemptionsPageSize.toString());

    this.api.getPromoCodeRedemptions(params).subscribe({
      next: (res) => {
        this.redemptions = res.data || [];
        this.redemptionsTotalCount = res.count || 0;
        this.redemptionsTotalPages = Math.ceil(this.redemptionsTotalCount / this.redemptionsPageSize);
        this.redemptionsCurrentPage = res.pageIndex || 1;
        this.redemptionsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.redemptions = [];
        this.redemptionsTotalCount = 0;
        this.redemptionsTotalPages = 0;
        this.redemptionsLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  getRedemptionsFilterParams(): HttpParams {
    let params = new HttpParams();
    const value = this.redemptionsFilterForm.value;

    if (value.promoCodeId) params = params.set('promoCodeId', value.promoCodeId);
    if (value.clientId) params = params.set('clientId', value.clientId);
    if (value.driverId) params = params.set('driverId', value.driverId);
    if (value.status) params = params.set('status', value.status);

    return params;
  }

  onFilterRedemptions(): void {
    this.loadRedemptions(1, this.getRedemptionsFilterParams());
  }

  onClearRedemptions(): void {
    this.redemptionsFilterForm.reset();
    this.promoCodeSelect?.reset();
    this.clientSelect?.reset();
    this.driverSelect?.reset();
    this.loadRedemptions(1);
  }

  onRedemptionsPageChange(page: number): void {
    if (page === this.redemptionsCurrentPage) return;
    this.loadRedemptions(page, this.getRedemptionsFilterParams());
  }

  onRedemptionsPageSizeChange(size: number): void {
    if (size === this.redemptionsPageSize) return;
    this.redemptionsPageSize = size;
    this.loadRedemptions(1, this.getRedemptionsFilterParams());
  }
}
