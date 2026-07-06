import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../services/api.service';
import { PaginationComponent } from '../../../layout/pagination/pagination.component';
import { allClient, ClientsResponse } from '../../../types/clients.type';
import { Government } from '../../../types/government.type';
import { WalletModalComponent } from '../../wallet-modal/wallet-modal.component';
import { ToastService } from '../../../shared/toast/toast.service';
import { ConfirmService } from '../../../shared/confirm-dialog/confirm.service';
import {
  buildExportFileName,
  ExcelColumn,
  exportToExcel,
  formatDateForExport,
} from '../../../shared/utils/excel-export.util';
@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    PaginationComponent,
    WalletModalComponent,
  ],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.scss'],
})
export class CustomerListComponent implements OnInit {
  clients: allClient[] = [];
  response: ClientsResponse | null = null;
  selectedImage: string = '';

  loading = false;
  showFilter = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalCount = 0
  filterForm: FormGroup;
  noClientMessage: string | null = null;
  ClientMessage: string | null = null;

  governments: Government[] = [];

  showEditModal = false;
  selectedClient: allClient | null = null;
  fileToUpload: File | null = null;
  editForm: FormGroup;
  showEditLoading = false; // لعرض spinner داخل المودال أو قبل فتحه
  currentprofileImageUrl: string | null = null; // عشان نعرض الصورة القديمة (اختياري)
  // في أعلى الكلاس (مع المتغيرات)
  private readonly BASE_URL = 'https://zego.premiumasp.net';

  //اعادة تعيين كلمة المرور
  showResetPasswordModal = false;
  selectedClientId: number | null = null;
  selectedClientName: string | null = null;
  resetPasswordForm: FormGroup;
  resetLoading = false;
  resetErrorMessage: string | null = null;

  // محفظة العميل
  walletModalVisible = false;
  walletUserId: number | null = null;
  walletUserName: string | null = null;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private confirm: ConfirmService,
  ) {
    this.filterForm = this.fb.group({
      name: [''],
      phone: [''],
      governmentId: [''],
    });

    this.editForm = this.fb.group({
      name: ['', Validators.required],
      phone: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]],
      profileImageUrl: [''],
    });

    this.resetPasswordForm = this.fb.group(
      {
        newPassword: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  ngOnInit(): void {
    this.loadClients(1);
    this.api.getGovernments().subscribe((governments) => {
      this.governments = governments;
      this.cdr.detectChanges();
    });
  }

  /********************************اعادة تعيين كلمة المور***********************************************************/
  // Validator للتأكد إن كلمتي المرور متطابقتين
  passwordMatchValidator(form: FormGroup) {
    const newPass = form.get('newPassword')?.value;
    const confirmPass = form.get('confirmPassword')?.value;

    if (newPass !== confirmPass) {
      form.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  openResetPasswordModal(id: number, name: string) {
    this.selectedClientId = id;
    this.selectedClientName = name;
    this.resetPasswordForm.reset();
    this.resetErrorMessage = null;
    this.showResetPasswordModal = true;
    this.cdr.detectChanges();
  }

  closeResetPasswordModal() {
    this.showResetPasswordModal = false;
    this.selectedClientId = null;
    this.selectedClientName = null;
    this.resetPasswordForm.reset();
    this.resetErrorMessage = null;
    this.resetLoading = false;
    this.cdr.detectChanges();
  }

  resetClientPasswordSubmit() {
    if (this.resetPasswordForm.invalid || !this.selectedClientId) {
      return;
    }

    this.resetLoading = true;
    this.resetErrorMessage = null;

    const payload = {
      newPassword: this.resetPasswordForm.get('newPassword')?.value.trim(),
    };

    this.api.resetClientPassword(this.selectedClientId, payload).subscribe({
      next: () => {
        this.resetLoading = false;
        this.toast.success('تم إعادة تعيين كلمة المرور بنجاح', 'نجاح');
        this.closeResetPasswordModal();
      },
      error: (err) => {
        this.resetLoading = false;
        this.resetErrorMessage =
          err.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور';
        this.cdr.detectChanges();
      },
    });
  }

  /*******************************************تعديل العميل****************************************************/

  // دالة لعرض الصورة في الـ modal
  showImage(src: string) {
    this.selectedImage = 'https://zego.premiumasp.net' + src;
    this.cdr.detectChanges();
  }

  openEdit(client: allClient) {
    this.showEditLoading = true;
    this.showEditModal = true; // نفتح المودال فورًا (تجربة مستخدم أفضل)
    this.selectedClient = null; // ننظفه مؤقتًا
    this.currentprofileImageUrl = null;
    this.fileToUpload = null;

    // نعبي الفورم ببيانات أولية سريعة (تحسين UX)
    this.editForm.patchValue({
      name: client.name,
      phone: client.phone,
      profileImageUrl: client.profileImageUrl,
    });

    // نجيب البيانات الكاملة
    this.api.getClientById(client.id).subscribe({
      next: (fullClient) => {
        this.selectedClient = fullClient;

        // تحديث الفورم بالبيانات الدقيقة
        this.editForm.patchValue({
          name: fullClient.name,
          phone: fullClient.phone,
          profileImageUrl: fullClient.profileImageUrl,
        });

        // لو عايزين نعرض الصورة القديمة
        this.currentprofileImageUrl = fullClient.profileImageUrl // ← صغير p
          ? this.BASE_URL +
            (fullClient.profileImageUrl.startsWith('/') ? '' : '/') +
            fullClient.profileImageUrl
          : null;

        this.showEditLoading = false;
        this.cdr.detectChanges(); // مهم لو فيه مشاكل في الـ UI update
      },
      error: (err) => {
        this.showEditLoading = false;
        this.noClientMessage = err.message || 'تعذر جلب بيانات العميل';
        setTimeout(() => (this.noClientMessage = null), 4000);

        // نغلّق المودال لو فشل الجلب (أو نسيبه مفتوح بالبيانات القديمة)
        // this.closeEdit();   ← اختياري
      },
    });
  }

  closeEdit() {
    this.showEditModal = false;
    this.selectedClient = null;
    this.fileToUpload = null;
    this.editForm.reset();
  }

  onFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.fileToUpload = input.files[0];
    }
  }

  saveEdit() {
    if (this.editForm.invalid || !this.selectedClient) return;

    this.loading = true;

    this.api
      .updateClient(
        this.selectedClient.id,
        this.editForm.value.name.trim(),
        this.editForm.value.phone.trim(),
        this.fileToUpload,
      )
      .subscribe({
        next: () => {
          this.toast.success('تم تعديل بيانات العميل بنجاح', 'نجاح');
          this.closeEdit();
          const params = this.getFilterParams();
          this.loadClients(this.currentPage, params);
          this.loading = false;
        },
        error: (err) => {
          this.toast.error(err?.error?.message || err?.message || 'فشل تعديل العميل', 'خطأ');
          this.loading = false;
        },
      });
  }

  /******************************************************تحميل العميل************************************************************/

  // === نفس طريقة الأوردرز بالضبط ===
  loadClients(page: number, params: HttpParams = new HttpParams()): void {
    this.loading = true;
    this.currentPage = page;

    // دايماً نضيف الـ pageIndex و pageSize
    params = params.set('pageIndex', page.toString());
    params = params.set('pageSize', this.pageSize.toString());

    this.api.getAllClients(params).subscribe({
      next: (res) => {
        this.response = res;
        this.clients = res.data || [];
        this.totalCount = res.count || 0;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);
        this.currentPage = res.pageIndex || 1;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading clients:', err);
        this.clients = [];
        this.totalPages = 0;
        this.loading = false;
      },
    });
  }

  onFilter(): void {
    this.currentPage = 1;
    this.loadClients(1, this.getFilterParams());
    //this.showFilter = false;
  }

  onClear(): void {
    this.filterForm.reset();
    this.currentPage = 1;
    this.loadClients(1);
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  onPageChange(page: number): void {
    if (page !== this.currentPage) {
      this.loadClients(page, this.getFilterParams());
    }
  }

  onPageSizeChange(size: number): void {
    if (size === this.pageSize) return;
    this.pageSize = size;
    this.loadClients(1, this.getFilterParams());
  }

  //اجمع الفلاتر من الـ form
  getFilterParams(): HttpParams {
    let params = new HttpParams();
    const value = this.filterForm.value;

    if (value.name?.trim()) params = params.set('name', value.name.trim());
    if (value.phone?.trim()) params = params.set('phone', value.phone.trim());
    if (value.governmentId) params = params.set('governmentId', value.governmentId);
    if (value.isActive !== '' && value.isActive !== null) {
      params = params.set('IsActive', value.isActive);
    }

    return params;
  }

  async deactivatedClient(id: number) {
    const ok = await this.confirm.ask({
      title: 'حظر العميل',
      message: 'هل أنت متأكد من حظر هذا العميل؟ لن يتمكن من استخدام التطبيق.',
      variant: 'danger',
      icon: 'fa-ban',
      confirmText: 'نعم، حظر',
    });
    if (!ok) return;

    this.loading = true;
    this.api.deactivateClients(id).subscribe({
      next: () => {
        this.toast.success('تم حظر العميل بنجاح', 'نجاح');
        const params = this.getFilterParams();
        this.loadClients(this.currentPage, params);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(`خطأ في حظر العميل ${id}:`, error);
        this.toast.error('فشل حظر العميل', 'خطأ');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  async activatedClient(id: number) {
    const ok = await this.confirm.ask({
      title: 'تفعيل العميل',
      message: 'هل أنت متأكد من تفعيل هذا العميل؟',
      variant: 'success',
      icon: 'fa-user-check',
      confirmText: 'نعم، تفعيل',
    });
    if (!ok) return;

    this.loading = true;
    this.api.activateClients(id).subscribe({
      next: () => {
        this.toast.success('تم تفعيل العميل بنجاح', 'نجاح');
        const params = this.getFilterParams();
        this.loadClients(this.currentPage, params);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(`خطأ في تفعيل العميل ${id}:`, error);
        this.toast.error('فشل تفعيل العميل', 'خطأ');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  async deleteClient(id: number) {
    const ok = await this.confirm.ask({
      title: 'حذف العميل',
      message: 'هل أنت متأكد من حذف هذا العميل نهائيًا؟ هذا الإجراء لا يمكن التراجع عنه.',
      variant: 'danger',
      icon: 'fa-trash',
      confirmText: 'نعم، حذف',
    });
    if (!ok) return;

    this.loading = true;
    this.api.deletedClient(id).subscribe({
      next: () => {
        this.toast.success('تم حذف العميل بنجاح', 'نجاح');
        const params = this.getFilterParams();
        this.loadClients(this.currentPage, params);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(`خطأ في حذف العميل ${id}:`, error);
        this.toast.error('فشل حذف العميل', 'خطأ');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /******************************************************تصدير CSV************************************************************/

  private readonly clientExcelColumns: ExcelColumn<allClient>[] = [
    { header: '#', value: (_c, i) => i + 1 },
    { header: 'الاسم', value: (c) => c.name },
    { header: 'رقم التليفون', value: (c) => c.phone },
    { header: 'المحافظة', value: (c) => c.government || 'غير محدد' },
    { header: 'تاريخ الانضمام', value: (c) => formatDateForExport(c.createdAt) },
    { header: 'الحالة', value: (c) => (c.isActive ? 'نشط' : 'محظور') },
  ];

  /** تصدير العملاء المعروضين في الصفحة الحالية فقط. */
  exportExcel(): void {
    if (!this.clients.length) {
      this.toast.error('لا يوجد عملاء لتصديرهم', 'تنبيه');
      return;
    }

    exportToExcel(this.clients, this.clientExcelColumns, buildExportFileName('عملاء_ZeGo'));
  }

  /**
   * تصدير كل العملاء المطابقين للفلتر الحالي، بالمرور على كل الصفحات بنفس حجم الصفحة
   * المستخدم في العرض العادي (this.pageSize) بدل تخمين حجم صفحة كبير قد يقيّده الباك اند بصمت.
   * التوقف يتم فقط لما نجمع كل العناصر أو تيجي صفحة فاضية (حماية من infinite loop).
   */
  exportAllExcel(): void {
    this.loading = true;

    const filterParams = this.getFilterParams();
    const requestedPageSize = this.pageSize;
    let currentPage = 1;
    let allClients: allClient[] = [];

    const fetchPage = () => {
      const requestParams = filterParams
        .set('pageIndex', currentPage.toString())
        .set('pageSize', requestedPageSize.toString());

      this.api.getAllClients(requestParams).subscribe({
        next: (res) => {
          const clients = res.data || [];
          const totalCount = res.count || 0;

          allClients = [...allClients, ...clients];

          const reachedTotal = allClients.length >= totalCount;
          const emptyPage = clients.length === 0;

          if (!reachedTotal && !emptyPage) {
            currentPage++;
            fetchPage();
            return;
          }

          this.loading = false;
          if (!allClients.length) {
            this.toast.error('لا يوجد عملاء مطابقين لهذا الفلتر', 'تنبيه');
            return;
          }

          if (allClients.length < totalCount) {
            console.warn(`تصدير جزئي: تم جلب ${allClients.length} من أصل ${totalCount} عميل.`);
          }

          exportToExcel(allClients, this.clientExcelColumns, buildExportFileName('كل_العملاء_ZeGo'));
        },
        error: (err) => {
          console.error(err);
          this.toast.error('فشل تصدير بيانات العملاء', 'خطأ');
          this.loading = false;
        },
      });
    };

    fetchPage();
  }

  formatDate(date?: string): string {
    return formatDateForExport(date);
  }

  /******************************************************المحفظة************************************************************/

  openWallet(client: allClient) {
    this.walletUserId = client.id;
    this.walletUserName = client.name;
    this.walletModalVisible = true;
    this.cdr.detectChanges();
  }

  openWalletBrowse() {
    this.walletUserId = null;
    this.walletUserName = null;
    this.walletModalVisible = true;
    this.cdr.detectChanges();
  }

  closeWallet() {
    this.walletModalVisible = false;
    this.walletUserId = null;
    this.walletUserName = null;
    this.cdr.detectChanges();
  }
}
