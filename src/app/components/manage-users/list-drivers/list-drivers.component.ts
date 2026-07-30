import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../services/api.service';
import { PaginationComponent } from '../../../layout/pagination/pagination.component';
import {
  allDriver,
  DriverDetail,
  DriversResponse,
} from '../../../types/driver.type';
import { Government } from '../../../types/government.type';
import { CAR_TYPES, carTypeLabel, GENDERS, genderLabel } from '../../../types/lookup.type';
import { RouterLink, Router } from '@angular/router';
import { WalletModalComponent } from '../../wallet-modal/wallet-modal.component';
import { ToastService } from '../../../shared/toast/toast.service';
import { ConfirmService } from '../../../shared/confirm-dialog/confirm.service';
import {
  buildExportFileName,
  ExcelColumn,
  exportToExcel,
  formatDateForExport,
} from '../../../shared/utils/excel-export.util';

interface DriverEditVM {
  name: string;
  phone: string;
  address: string;
  expiryDate: string;
  nationalId: string;
  carModel: string;
  carType: string;
  carYear: string;
  carNumber: string;
  carColor: string;
  gender: string;
}

@Component({
  selector: 'app-list-drivers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginationComponent, WalletModalComponent],
  templateUrl: './list-drivers.component.html',
  styleUrl: './list-drivers.component.scss',
})
export class ListDriversComponent implements OnInit {
  drivers: allDriver[] = [];
  totalCount = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 10;
  noDriverMessage: string | null = null;
  DriverMessage: string | null = null;

  loading = false;
  showFilter = false;

  filterForm: FormGroup;
  governments: Government[] = [];
  readonly carTypes = CAR_TYPES;
  readonly genders = GENDERS;
  readonly carTypeLabel = carTypeLabel;
  readonly genderLabel = genderLabel;

  // في أعلى الكلاس (مع المتغيرات)
  private readonly BASE_URL = 'https://zego.premiumasp.net';

  //اعادة تعيين كلمة المرور
  showResetPasswordModal = false;
  selectedDriverId: number | null = null;
  selectedDriverName: string | null = null;
  resetPasswordForm: FormGroup;
  resetLoading = false;
  resetErrorMessage: string | null = null;

  // محفظة السائق
  walletModalVisible = false;
  walletUserId: number | null = null;
  walletUserName: string | null = null;

  //تعديل
  showEditDriverModal = false;
  editDriverForm: FormGroup;
  editDriverLoading = false;
  editDriverErrorMessage: string | null = null;
  selectedEditDriverId: number | null = null;

  // لتخزين الملفات قبل الإرسال
  driverFiles: {
    ProfileImage?: File;
    LicenseImage?: File;
    NationalIdImage?: File;
    CarImage?: File;
  } = {};

  // معاينة الصور: الصورة الحالية من السيرفر أو الصورة الجديدة المختارة (تفضل الجديدة لو موجودة)
  driverFilePreviews: {
    ProfileImage?: string;
    LicenseImage?: string;
    NationalIdImage?: string;
    CarImage?: string;
  } = {};

  private existingDriverImages: {
    ProfileImage?: string;
    LicenseImage?: string;
    NationalIdImage?: string;
    CarImage?: string;
  } = {};

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
    private confirm: ConfirmService,
  ) {
    this.filterForm = this.fb.group({
      name: [''],
      phone: [''],
      carType: [''],
      isActive: [''],
      governmentId: [''],
    });

    this.editDriverForm = this.fb.group({
      name: [''],
      phone: [''],
      address: [''],
      expiryDate: [''],
      nationalId: [''],
      carType: [''],
      carModel: [''],
      carYear: [''],
      carNumber: [''],
      carColor: [''],
      gender: [''],
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
    this.loadDrivers(1);
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
    this.selectedDriverId = id;
    this.selectedDriverName = name;
    this.resetPasswordForm.reset();
    this.resetErrorMessage = null;
    this.showResetPasswordModal = true;
    this.cdr.detectChanges();
  }

  closeResetPasswordModal() {
    this.showResetPasswordModal = false;
    this.selectedDriverId = null;
    this.selectedDriverName = null;
    this.resetPasswordForm.reset();
    this.resetErrorMessage = null;
    this.resetLoading = false;
    this.cdr.detectChanges();
  }

  resetDriverPasswordSubmit() {
    if (this.resetPasswordForm.invalid || !this.selectedDriverId) {
      return;
    }

    this.resetLoading = true;
    this.resetErrorMessage = null;

    const payload = {
      newPassword: this.resetPasswordForm.get('newPassword')?.value.trim(),
    };

    this.api.resetDriverPassword(this.selectedDriverId, payload).subscribe({
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

  openEditDriverModal(id: number) {
    this.selectedEditDriverId = id;
    this.editDriverLoading = true;
    this.editDriverErrorMessage = null;

    // جلب بيانات السائق
    this.api.getDriverById(id).subscribe({
      next: (res) => {
        const d = res.data;
        this.editDriverForm.patchValue({
          name: d.name,
          phone: d.phone,
          address: d.address,
          expiryDate: this.toDateInputValue(d.licenseExpiryDate || d.driverLicenseExpiryDate || d.expiryDate),
          nationalId: d.nationalId,
          carType: d.carType,
          carModel: d.carModel,
          carYear: d.carYear,
          carNumber: d.carNumber,
          carColor: d.carColor,
          gender: d.gender,
        });

        this.existingDriverImages = {
          ProfileImage: d.driverProfile || d.profileImageUrl,
          LicenseImage: d.driverLicenseImageUrl || d.licenseImageUrl,
          NationalIdImage: d.nationalIdImageUrlFront || d.nationalIdImageUrl,
          CarImage: d.carImgUrl,
        };
        this.driverFilePreviews = { ...this.existingDriverImages };

        this.showEditDriverModal = true;
        this.editDriverLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.editDriverErrorMessage = 'فشل تحميل بيانات السائق';
        console.error(err);
        this.editDriverLoading = false;
      },
    });
  }

  closeEditDriverModal() {
    this.showEditDriverModal = false;
    this.editDriverForm.reset();
    this.selectedEditDriverId = null;
    this.driverFiles = {};
    this.driverFilePreviews = {};
    this.existingDriverImages = {};
    this.editDriverErrorMessage = null;
    this.editDriverLoading = false;
  }

  onFileChange(
    event: any,
    fileType: 'ProfileImage' | 'LicenseImage' | 'NationalIdImage' | 'CarImage',
  ) {
    const file = event.target.files[0];
    if (file) {
      this.driverFiles[fileType] = file;
      this.driverFilePreviews[fileType] = URL.createObjectURL(file);
    }
  }

  /** يرجّع مسار الصورة كامل لو كانت نسبية (بتبدأ بـ /) من السيرفر. */
  resolveImageUrl(url?: string): string | null {
    if (!url) return null;
    if (url.startsWith('blob:') || url.startsWith('http')) return url;
    return this.BASE_URL + (url.startsWith('/') ? '' : '/') + url;
  }

  private toDateInputValue(date?: string): string {
    if (!date) return '';
    return date.split('T')[0];
  }

  submitEditDriver() {
    if (!this.editDriverForm.valid || !this.selectedEditDriverId) return;

    this.editDriverLoading = true;
    this.editDriverErrorMessage = null;

    const formData = new FormData();
    const values = this.editDriverForm.value;

    // حط القيم
    Object.keys(values).forEach((key) => {
      if (values[key] !== null && values[key] !== undefined) {
        formData.append(key, values[key]);
      }
    });

    // الملفات
    Object.keys(this.driverFiles).forEach((key) => {
      const file = this.driverFiles[key as keyof typeof this.driverFiles];
      if (file) formData.append(key, file);
    });

    this.api.updateDriver(this.selectedEditDriverId, formData).subscribe({
      next: () => {
        this.toast.success('تم تحديث بيانات السائق بنجاح', 'نجاح');
        this.closeEditDriverModal();
        const params = this.getFilterParams();
        this.loadDrivers(this.currentPage, params);
        this.editDriverLoading = false;
      },
      error: (err) => {
        this.editDriverErrorMessage = err.message || 'فشل تحديث بيانات السائق';
        console.error(err);
        this.editDriverLoading = false;
      },
    });
  }

  /******************************************************تحميل العميل************************************************************/

  loadDrivers(page: number, params: HttpParams = new HttpParams()): void {
    this.loading = true;
    this.currentPage = page;

    // نضيف الـ pagination دايمًا
    params = params.set('PageIndex', page.toString());
    params = params.set('PageSize', this.pageSize.toString());

    this.api.getAllDrivers(params).subscribe({
      next: (res) => {
        const data = res.data;
        this.drivers = data.data || [];
        this.totalCount = data.totalCount || 0;
        this.totalPages = Math.ceil(this.totalCount / this.pageSize);
        this.currentPage = data.pageIndex || 1;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading drivers:', err);
        this.drivers = [];
        this.totalCount = 0;
        this.totalPages = 0;
        this.loading = false;
      },
    });
  }

  onFilter(): void {
    this.currentPage = 1;
    this.loadDrivers(1, this.getFilterParams());
  }

  onClear(): void {
    this.filterForm.reset();
    this.currentPage = 1;
    this.loadDrivers(1);
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  onPageChange(page: number): void {
    if (page === this.currentPage) return;
    this.loadDrivers(page, this.getFilterParams());
  }

  onPageSizeChange(size: number): void {
    if (size === this.pageSize) return;
    this.pageSize = size;
    this.loadDrivers(1, this.getFilterParams());
  }

  //اجمع الفلاتر من الـ form
  getFilterParams(): HttpParams {
    let params = new HttpParams();
    const value = this.filterForm.value;

    if (value.name?.trim()) params = params.set('Name', value.name.trim());
    if (value.phone?.trim()) params = params.set('Phone', value.phone.trim());
    if (value.carType) params = params.set('CarType', value.carType);
    if (value.governmentId) params = params.set('GovernmentId', value.governmentId);
    if (value.isActive !== '' && value.isActive !== null) {
      params = params.set('IsActive', value.isActive);
    }

    return params;
  }

  async deactivatedDriver(id: number) {
    const ok = await this.confirm.ask({
      title: 'حظر السائق',
      message: 'هل أنت متأكد من حظر هذا السائق؟ لن يتمكن من استقبال طلبات جديدة.',
      variant: 'danger',
      icon: 'fa-ban',
      confirmText: 'نعم، حظر',
    });
    if (!ok) return;

    this.loading = true;
    this.api.deactivateDriver(id).subscribe({
      next: () => {
        this.toast.success('تم حظر السائق بنجاح', 'نجاح');
        const params = this.getFilterParams();
        this.loadDrivers(this.currentPage, params);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(`خطأ في حظر السائق ${id}:`, error);
        this.toast.error('فشل حظر السائق', 'خطأ');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  async activatedDriver(id: number) {
    const ok = await this.confirm.ask({
      title: 'تفعيل السائق',
      message: 'هل أنت متأكد من تفعيل هذا السائق؟',
      variant: 'success',
      icon: 'fa-user-check',
      confirmText: 'نعم، تفعيل',
    });
    if (!ok) return;

    this.loading = true;
    this.api.activateDriver(id).subscribe({
      next: () => {
        this.toast.success('تم تفعيل السائق بنجاح', 'نجاح');
        const params = this.getFilterParams();
        this.loadDrivers(this.currentPage, params);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(`خطأ في تفعيل السائق ${id}:`, error);
        this.toast.error('فشل تفعيل السائق', 'خطأ');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  async deleteDriver(id: number) {
    const ok = await this.confirm.ask({
      title: 'حذف السائق',
      message: 'هل أنت متأكد من حذف هذا السائق نهائيًا؟ هذا الإجراء لا يمكن التراجع عنه.',
      variant: 'danger',
      icon: 'fa-trash',
      confirmText: 'نعم، حذف',
    });
    if (!ok) return;

    this.loading = true;
    this.api.deletedDriver(id).subscribe({
      next: () => {
        this.toast.success('تم حذف السائق بنجاح', 'نجاح');
        const params = this.getFilterParams();
        this.loadDrivers(this.currentPage, params);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(`خطأ في حذف السائق ${id}:`, error);
        this.toast.error('فشل حذف السائق', 'خطأ');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /******************************************************تصدير Excel************************************************************/

  private readonly driverExcelColumns: ExcelColumn<allDriver>[] = [
    { header: '#', value: (_d, i) => i + 1 },
    { header: 'الاسم', value: (d) => d.name },
    { header: 'رقم التليفون', value: (d) => d.phone },
    { header: 'المحافظة', value: (d) => d.government || 'غير محدد' },
    { header: 'نوع السيارة', value: (d) => carTypeLabel(d.carType) },
    { header: 'النوع', value: (d) => genderLabel(d.gender) },
    { header: 'الموديل', value: (d) => d.carModel },
    { header: 'رقم السيارة', value: (d) => d.carNumber },
    { header: 'رقم الرخصة', value: (d) => d.licenseNumber || 'غير متاح' },
    { header: 'الحالة', value: (d) => (d.isActive ? 'نشط' : 'محظور') },
    { header: 'تاريخ الانضمام', value: (d) => formatDateForExport(d.createdAt) },
  ];

  /** تصدير السائقين المعروضين في الصفحة الحالية فقط. */
  exportExcel(): void {
    if (!this.drivers.length) {
      this.toast.error('لا يوجد سائقين لتصديرهم', 'تنبيه');
      return;
    }

    exportToExcel(this.drivers, this.driverExcelColumns, buildExportFileName('سائقين_ZeGo'));
  }

  /**
   * تصدير كل السائقين المطابقين للفلتر الحالي، بالمرور على كل الصفحات بنفس حجم الصفحة
   * المستخدم في العرض العادي (this.pageSize) بدل تخمين حجم صفحة كبير قد يقيّده الباك اند بصمت.
   * التوقف يتم فقط لما نجمع totalCount بيانات أو تيجي صفحة فاضية (حماية من infinite loop).
   */
  exportAllExcel(): void {
    this.loading = true;

    const filterParams = this.getFilterParams();
    const requestedPageSize = this.pageSize;
    let currentPage = 1;
    let allDrivers: allDriver[] = [];

    const fetchPage = () => {
      const requestParams = filterParams
        .set('PageIndex', currentPage.toString())
        .set('PageSize', requestedPageSize.toString());

      this.api.getAllDrivers(requestParams).subscribe({
        next: (res) => {
          const data = res.data;
          const drivers = data.data || [];
          const totalCount = data.totalCount || 0;

          allDrivers = [...allDrivers, ...drivers];

          const reachedTotal = allDrivers.length >= totalCount;
          const emptyPage = drivers.length === 0;

          if (!reachedTotal && !emptyPage) {
            currentPage++;
            fetchPage();
            return;
          }

          this.loading = false;
          if (!allDrivers.length) {
            this.toast.error('لا يوجد سائقين مطابقين لهذا الفلتر', 'تنبيه');
            return;
          }

          if (allDrivers.length < totalCount) {
            console.warn(
              `تصدير جزئي: تم جلب ${allDrivers.length} من أصل ${totalCount} سائق.`,
            );
          }

          exportToExcel(allDrivers, this.driverExcelColumns, buildExportFileName('كل_السائقين_ZeGo'));
        },
        error: (err) => {
          console.error(err);
          this.toast.error('فشل تصدير بيانات السائقين', 'خطأ');
          this.loading = false;
        },
      });
    };

    fetchPage();
  }

  viewDriverDetails(id: number) {
    this.router.navigate(['/driver-details', id]);
  }

  /******************************************************المحفظة************************************************************/

  openWallet(driver: allDriver) {
    this.walletUserId = driver.id;
    this.walletUserName = driver.name;
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
