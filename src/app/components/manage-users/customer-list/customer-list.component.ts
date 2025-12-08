import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
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

  loading = false;
  showFilter = false;
  currentPage = 1;
  pageSize = 10;
  totalPages = 0;
  totalCount = 0;

  filterForm: FormGroup;

  constructor(private api: ApiService, private fb: FormBuilder) {
    this.filterForm = this.fb.group({
      name: [''],
      phone: [''],
    });
  }

  ngOnInit(): void {
    this.loadClients(1);
  }

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

  exportCSV(): void {
    if (!this.clients.length) return;

    const headers = ['الرقم', 'الاسم', 'التليفون', 'البريد الإلكتروني'];
    const rows = this.clients.map((c, i) => [
      ((this.currentPage - 1) * this.pageSize + i + 1).toString(),
      c.name,
      c.phone,
      c.email || '',
    ]);

    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `العملاء_${new Date().toLocaleDateString('ar-EG')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
