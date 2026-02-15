import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { FormBuilder, FormGroup } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../services/api.service';
import { PaginationComponent } from '../../../layout/pagination/pagination.component';
import { allClient, ClientsResponse } from '../../../types/clients.type';
@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    PaginationComponent,
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
  totalCount = 0;

  filterForm: FormGroup;
  noClientMessage: string | null = null;
  ClientMessage: string | null = null;

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

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    this.filterForm = this.fb.group({
      name: [''],
      phone: [''],
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
        this.ClientMessage = 'تم إعادة تعيين كلمة المرور بنجاح';
        this.closeResetPasswordModal();
        setTimeout(() => (this.ClientMessage = null), 4000);
        // اختياري: refresh الجدول
        // this.loadClients(this.currentPage, this.getFilterParams());
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
          this.ClientMessage = 'تم تعديل بيانات العميل بنجاح';
          this.closeEdit();
          setTimeout(() => {
            this.ClientMessage = null;
            const params = this.getFilterParams();
            this.loadClients(this.currentPage, params);
          }, 1800);
          this.loading = false;
        },
        error: (err) => {
          this.noClientMessage = err?.error?.message || 'فشل تعديل العميل';
          this.loading = false;
          setTimeout(() => (this.noClientMessage = null), 3000);
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
        this.totalPages = Math.ceil((res.count || 0) / this.pageSize);
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
    const value = this.filterForm.value;

    let params = new HttpParams();
    if (value.name?.trim()) params = params.set('name', value.name.trim());
    if (value.phone?.trim()) params = params.set('phone', value.phone.trim());

    this.loadClients(1, params);
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
      const value = this.filterForm.value;
      let params = new HttpParams();
      if (value.name?.trim()) params = params.set('name', value.name.trim());
      if (value.phone?.trim()) params = params.set('phone', value.phone.trim());

      this.loadClients(page, params);
    }
  }

  //اجمع الفلاتر من الـ form
  getFilterParams(): HttpParams {
    let params = new HttpParams();
    const value = this.filterForm.value;

    if (value.name?.trim()) params = params.set('name', value.name.trim());
    if (value.phone) params = params.set('phone', value.phone);
    if (value.isActive !== '' && value.isActive !== null) {
      params = params.set('IsActive', value.isActive);
    }

    return params;
  }

  deactivatedClient(id: number) {
    if (confirm('هل أنت متأكد من حظر هذه العميل')) {
      this.loading = true;
      this.api.deactivateClients(id).subscribe({
        next: () => {
          this.ClientMessage = 'تم حظر العميل بنجاح';
          setTimeout(() => {
            this.ClientMessage = null;
            const params = this.getFilterParams(); // نفس الفلاتر
            this.loadClients(this.currentPage, params); // نفس الصفحة
          }, 2000);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`خطأ في حظر العميل ${id}:`, error);
          this.noClientMessage = 'فشل حظر العميل';
          this.loading = false;
          setTimeout(() => {
            this.noClientMessage = null;
          }, 2000);
          this.cdr.detectChanges();
        },
      });
    }
  }

  activatedClient(id: number) {
    if (confirm('هل أنت متأكد من تفعيل هذه العميل')) {
      this.loading = true;
      this.api.activateClients(id).subscribe({
        next: () => {
          this.ClientMessage = 'تم تفعيل العميل بنجاح';
          setTimeout(() => {
            this.ClientMessage = null;
            const params = this.getFilterParams(); // نفس الفلاتر
            this.loadClients(this.currentPage, params); // نفس الصفحة
          }, 2000);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`خطأ في تفعيل العميل ${id}:`, error);
          this.noClientMessage = 'فشل تفعيل العميل';
          this.loading = false;
          setTimeout(() => {
            this.noClientMessage = null;
          }, 2000);
          this.cdr.detectChanges();
        },
      });
    }
  }

  deleteClient(id: number) {
    if (confirm('هل أنت متأكد من حذف هذه العميل')) {
      this.loading = true;
      this.api.deletedClient(id).subscribe({
        next: () => {
          this.ClientMessage = 'تم حذف العميل بنجاح';
          setTimeout(() => {
            this.ClientMessage = null;
            const params = this.getFilterParams(); // نفس الفلاتر
            this.loadClients(this.currentPage, params); // نفس الصفحة
          }, 2000);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`خطأ في حذف العميل ${id}:`, error);
          this.noClientMessage = 'فشل حذف العميل';
          this.loading = false;
          setTimeout(() => {
            this.noClientMessage = null;
          }, 2000);
          this.cdr.detectChanges();
        },
      });
    }
  }

  exportCSV(): void {
    if (!this.clients.length) return;

    const headers = ['الرقم', 'الاسم', 'التليفون', 'البريد الإلكتروني'];
    const rows = this.clients.map((c, i) => [
      ((this.currentPage - 1) * this.pageSize + i + 1).toString(),
      c.name,
      c.phone,
      c.email || '',
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `العملاء_${new Date().toLocaleDateString('ar-EG')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // دالة لتنسيق التاريخ
  formatDate(date: string): string {
    return date.split('T')[0]; // استخراج YYYY-MM-DD فقط
  }
}
