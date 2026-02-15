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
import { RouterLink, Router } from '@angular/router';

interface DriverEditVM {
  name: string;
  phone: string;
  address: string;
  licenseNumber: string;
  expiryDate: string;
  nationalId: string;
  carModel: string;
  carType: string;
  carYear: string;
  carNumber: string;
  carColor: string;
}

@Component({
  selector: 'app-list-drivers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PaginationComponent],
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

  // في أعلى الكلاس (مع المتغيرات)
  private readonly BASE_URL = 'https://zego.premiumasp.net';

  //اعادة تعيين كلمة المرور
  showResetPasswordModal = false;
  selectedDriverId: number | null = null;
  selectedDriverName: string | null = null;
  resetPasswordForm: FormGroup;
  resetLoading = false;
  resetErrorMessage: string | null = null;

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

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    this.filterForm = this.fb.group({
      name: [''],
      carType: [''],
      isActive: [''],
    });

    this.editDriverForm = this.fb.group({
      name: [''],
      phone: [''],
      address: [''],
      licenseNumber: [''],
      expiryDate: [''],
      nationalId: [''],
      carType: [''],
      carModel: [''],
      carYear: [''],
      carNumber: [''],
      carColor: [''],
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
        this.DriverMessage = 'تم إعادة تعيين كلمة المرور بنجاح';
        this.closeResetPasswordModal();
        setTimeout(() => (this.DriverMessage = null), 4000);
        // اختياري: refresh الجدول
        // this.loadDrivers(this.currentPage, this.getFilterParams());
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
          licenseNumber: d.licenseNumber,
          expiryDate: d.expiryDate,
          nationalId: d.nationalId,
          carType: d.carType,
          carModel: d.carModel,
          carYear: d.carYear,
          carNumber: d.carNumber,
          carColor: d.carColor,
        });

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
    }
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
      next: (res) => {
        this.DriverMessage = 'تم تحديث بيانات السائق بنجاح';
        this.closeEditDriverModal();
        setTimeout(() => (this.DriverMessage = null), 3000);

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
    let params = new HttpParams();

    const value = this.filterForm.value;

    if (value.name?.trim()) params = params.set('Name', value.name.trim());
    if (value.carType) params = params.set('CarType', value.carType);
    if (value.isActive !== '' && value.isActive !== null) {
      params = params.set('IsActive', value.isActive);
    }

    this.loadDrivers(1, params);
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

    let params = new HttpParams();
    const value = this.filterForm.value;

    if (value.name?.trim()) params = params.set('Name', value.name.trim());
    if (value.carType) params = params.set('CarType', value.carType);
    if (value.isActive !== '' && value.isActive !== null) {
      params = params.set('IsActive', value.isActive);
    }

    this.loadDrivers(page, params);
  }

  //اجمع الفلاتر من الـ form
  getFilterParams(): HttpParams {
    let params = new HttpParams();
    const value = this.filterForm.value;

    if (value.name?.trim()) params = params.set('Name', value.name.trim());
    if (value.carType) params = params.set('CarType', value.carType);
    if (value.isActive !== '' && value.isActive !== null) {
      params = params.set('IsActive', value.isActive);
    }

    return params;
  }

  deactivatedDriver(id: number) {
    if (confirm('هل أنت متأكد من حظر هذه السائق')) {
      this.loading = true;
      this.api.deactivateDriver(id).subscribe({
        next: () => {
          this.DriverMessage = 'تم حظر السائق بنجاح';
          setTimeout(() => {
            this.DriverMessage = null;
            const params = this.getFilterParams(); // نفس الفلاتر
            this.loadDrivers(this.currentPage, params); // نفس الصفحة
          }, 2000);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`خطأ في حظر السائق ${id}:`, error);
          this.noDriverMessage = 'فشل حظر السائق';
          this.loading = false;
          setTimeout(() => {
            this.noDriverMessage = null;
          }, 2000);
          this.cdr.detectChanges();
        },
      });
    }
  }

  activatedDriver(id: number) {
    if (confirm('هل أنت متأكد من تفعيل هذه السائق')) {
      this.loading = true;
      this.api.activateDriver(id).subscribe({
        next: () => {
          this.DriverMessage = 'تم تفعيل السائق بنجاح';
          setTimeout(() => {
            this.DriverMessage = null;
            const params = this.getFilterParams(); // نفس الفلاتر
            this.loadDrivers(this.currentPage, params); // نفس الصفحة
          }, 2000);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`خطأ في تفعيل السائق ${id}:`, error);
          this.noDriverMessage = 'فشل تفعيل السائق';
          this.loading = false;
          setTimeout(() => {
            this.noDriverMessage = null;
          }, 2000);
          this.cdr.detectChanges();
        },
      });
    }
  }

  deleteDriver(id: number) {
    if (confirm('هل أنت متأكد من حذف هذه السائق')) {
      this.loading = true;
      this.api.deletedDriver(id).subscribe({
        next: () => {
          this.DriverMessage = 'تم حذف السائق بنجاح';
          setTimeout(() => {
            this.DriverMessage = null;
            const params = this.getFilterParams(); // نفس الفلاتر
            this.loadDrivers(this.currentPage, params); // نفس الصفحة
          }, 2000);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`خطأ في حذف السائق ${id}:`, error);
          this.noDriverMessage = 'فشل حذف السائق';
          this.loading = false;
          setTimeout(() => {
            this.noDriverMessage = null;
          }, 2000);
          this.cdr.detectChanges();
        },
      });
    }
  }

  exportCSV(): void {
    if (!this.drivers.length) return;

    const headers = [
      '#',
      'الاسم',
      'التليفون',
      'نوع السيارة',
      'الموديل',
      'رقم السيارة',
      'رقم الرخصة',
      'الحالة',
      'تاريخ الانضمام',
    ];
    const rows = this.drivers.map((d, i) => [
      ((this.currentPage - 1) * this.pageSize + i + 1).toString(),
      d.name,
      d.phone,
      d.carType,
      d.carModel,
      d.carNumber,
      d.licenseNumber,
      d.isActive ? 'نشط' : 'غير نشط',
      new Date().toLocaleDateString('ar-EG'), // لو فيه تاريخ حقيقي، ضيفه هنا
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `السائقين_${new Date().toLocaleDateString('ar-EG')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  viewDriverDetails(id: number) {
    this.router.navigate(['/driver-details', id]);
  }
}
