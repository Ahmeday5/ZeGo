import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../services/api.service';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { adminsResponse, allAdmins } from '../../../types/admins.type';

@Component({
  selector: 'app-all-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './all-admin.component.html',
  styleUrl: './all-admin.component.scss',
})
export class AllAdminComponent implements OnInit {
  admins: allAdmins[] = [];
  loading: boolean = true;
  noadminsMessage: string | null = null;
  adminsMessage: string | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchAllAdmins();
  }

  // دالة لجلب كل الادمن (مع استدعاء getVisiblePages)
  fetchAllAdmins() {
    this.loading = true;
    this.noadminsMessage = null;
    this.apiService.getAllAdmins().subscribe({
      next: (response: adminsResponse) => {
        console.log('Response from API:', response);
        this.admins = response.data || [];

        console.log('Extracted admins:', this.admins);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('خطأ في جلب كل الادمن:', error);
        this.admins = [];
        this.noadminsMessage = 'حدث خطأ في جلب الادمن';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  deletedAdmin(id: string) {
    if (confirm('هل أنت متأكد من حذف هذه الادمن')) {
      this.loading = true;
      this.apiService.deleteAdmin(id).subscribe({
        next: () => {
          this.adminsMessage = 'تم حذف الادمن بنجاح';
          setTimeout(() => {
            this.adminsMessage = null;
            this.fetchAllAdmins(); // نفس الصفحة
          }, 2000);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`خطأ في حذف الادمن ${id}:`, error);
          this.noadminsMessage = 'فشل حذف الادمن';
          this.loading = false;
          setTimeout(() => {
            this.noadminsMessage = null;
          }, 2000);
          this.cdr.detectChanges();
        },
      });
    }
  }

  // دالة للذهاب لصفحة التعديل
  editAdmin(id: string) {
    this.router.navigate(['/edit-admin', id]);
  }

  addAdmin() {
    this.router.navigate(['/add-admin']);
  }
}
