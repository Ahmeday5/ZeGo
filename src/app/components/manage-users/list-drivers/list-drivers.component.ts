import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../services/api.service';
import { PaginationComponent } from '../../../layout/pagination/pagination.component';
import { allDriver, DriversResponse } from '../../../types/driver.type';
import { RouterLink, Router } from '@angular/router';
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

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      name: [''],
      carType: [''],
      isActive: [''],
    });
  }

  ngOnInit(): void {
    this.loadDrivers(1);
  }

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
