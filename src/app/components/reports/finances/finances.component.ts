// src/app/pages/finances/finances.component.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../services/api.service';
import {
  ReportsApiResponse,
  DriverReport,
  ReportTotals,
} from '../../../types/reports.type';
import { PaginationComponent } from '../../../layout/pagination/pagination.component';
import { Router, RouterModule } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

@Component({
  selector: 'app-finances',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaginationComponent,
    FormsModule,
    RouterModule,
  ],
  templateUrl: './finances.component.html',
  styleUrl: './finances.component.scss',
})
export class FinancesComponent implements OnInit {
  drivers: DriverReport[] = [];
  totals: ReportTotals = {
    totalEarnings: 0,
    totalDeps: 0,
    totalTrips: 0,
    totalClients: 0,
    totalDriversInResult: 0,
    totalActiveDriversInCurrentPage: 0,
  };

  loading = true;
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalItems = 0;
  showFilter = false;

  private driverNameSearchSubject = new Subject<string>();

  // سنوات من 2020 لـ 2026
  years = Array.from({ length: 30 }, (_, i) => 2024 + i);
  months = [
    { value: 1, name: 'يناير' },
    { value: 2, name: 'فبراير' },
    { value: 3, name: 'مارس' },
    { value: 4, name: 'أبريل' },
    { value: 5, name: 'مايو' },
    { value: 6, name: 'يونيو' },
    { value: 7, name: 'يوليو' },
    { value: 8, name: 'أغسطس' },
    { value: 9, name: 'سبتمبر' },
    { value: 10, name: 'أكتوبر' },
    { value: 11, name: 'نوفمبر' },
    { value: 12, name: 'ديسمبر' },
  ];

  filterForm: FormGroup;

  constructor(
    private reportsService: ApiService,
    private fb: FormBuilder,
    private router: Router,
  ) {
    this.filterForm = this.fb.group({
      filterType: ['yearly'],
      year: [new Date().getFullYear()],
      month: [new Date().getMonth() + 1],
      driverName: [''],
    });

    // إعداد البحث الفوري مع تأخير (debounce)
    this.driverNameSearchSubject
      .pipe(
        debounceTime(400), // انتظر 400 مللي ثانية بعد آخر كتابة
        distinctUntilChanged(), // لا تبعت نفس القيمة مرتين
      )
      .subscribe((searchTerm) => {
        this.applyDriverNameFilter(searchTerm);
      });
  }

  // دالة تُستدعى عند كل input
  onDriverNameInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.trim();
    this.driverNameSearchSubject.next(value);
  }

  // دالة تقوم بالفلترة الفعلية
  applyDriverNameFilter(searchTerm: string): void {
    // إعادة تعيين الصفحة للأولى عند البحث
    this.currentPage = 1;

    // تحديث قيمة الحقل في الفورم (اختياري - عشان يظل متزامن)
    this.filterForm.patchValue(
      { driverName: searchTerm },
      { emitEvent: false },
    );

    // تنفيذ البحث
    this.loadReports(1);
  }

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports(page: number = 1): void {
    this.loading = true;
    this.currentPage = page;

    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', this.pageSize.toString());

    const f = this.filterForm.value;

    params = params.set('filterType', f.filterType);

    if (['monthly', 'yearly'].includes(f.filterType)) {
      params = params.set('year', f.year.toString());
    }
    if (f.filterType === 'monthly') {
      params = params.set('month', f.month.toString());
    }
    if (f.driverName?.trim())
      params = params.set('driverName', f.driverName.trim());

    this.reportsService.getAllreports(params).subscribe({
      next: (res: ReportsApiResponse) => {
        this.drivers = res.data.data;
        this.totals = res.data.totals;
        this.currentPage = res.data.page;
        this.totalPages = res.data.totalPages;
        this.totalItems = res.data.totalItems;
        this.loading = false;
      },
      error: (err) => {
        console.error('API Error:', err);
        this.drivers = [];
        this.loading = false;
      },
    });
  }

  viewDriverDetails(nationalId: string): void {
    this.router.navigate(['finances-driver', nationalId]);
  }

  toggleFilter(): void {
    this.showFilter = !this.showFilter;
  }

  applyFilter(): void {
    this.currentPage = 1;
    this.loadReports(1);
    //this.showFilter = false;
  }

  clearFilter(): void {
    this.filterForm.reset({
      filterType: 'monthly',
      year: new Date().getFullYear(),
      month: new Date().getMonth() + 1,
      driverName: '',
      nationalId: '',
    });
    this.currentPage = 1;
    this.loadReports(1);
  }

  onPageChange(page: number): void {
    this.loadReports(page);
  }

  exportCSV(): void {
    if (!this.drivers.length) return;

    const headers = [
      '#',
      'اسم السائق',
      'رقم البطاقة',
      'عدد الرحلات',
      'إجمالي الأرباح',
      'المستحقات',
    ];
    const rows = this.drivers.map((d, i) => [
      ((this.currentPage - 1) * this.pageSize + i + 1).toString(),
      d.driverName,
      d.driverNationalId,
      d.totalTrips.toString(),
      d.totalEarning.toFixed(2),
      d.totalAppDebt.toFixed(2),
    ]);

    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `تقرير_أرباح_السائقين_${new Date().toLocaleDateString(
      'ar-EG',
    )}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
