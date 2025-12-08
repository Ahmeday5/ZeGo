import { CommonModule } from '@angular/common';
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { allAdmins } from '../../../types/admins.type';

@Component({
  selector: 'app-update-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './update-admin.component.html',
  styleUrl: './update-admin.component.scss',
})
export class UpdateAdminComponent implements OnInit {
  @ViewChild('form') form!: NgForm;
  @ViewChild('form', { static: false, read: ElementRef })
  formElement!: ElementRef<HTMLFormElement>;

  isLoading: boolean = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Object بسيط للـ admin للتعديل (role كـ string للـ update)
  admin: {
    id: string;
    email: string;
    role: string;
    userName: string;
    newPassword?: string;
  } = {
    id: '',
    email: '',
    role: '',
    userName: '',
    newPassword: '',
  };

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAdminDetails();
  }

  async loadAdminDetails() {
    this.isLoading = true;
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      try {
        // أضفت pageSize=1000 عشان نضمن جلب كل الـ admins (لو أكتر من 10)
        const data = await firstValueFrom(this.apiService.getAllAdmins());
        console.log('استجابة API للـ admins:', data);
        // فلترة الـ admin بناءً على ID
        const adminFromAPI = data.data.find((ad: allAdmins) => ad.id === id);
        if (adminFromAPI) {
          this.admin = {
            id: adminFromAPI.id,
            email: adminFromAPI.email,
            userName: adminFromAPI.userName,
            role: adminFromAPI.roles[0] || 'Admin', // افترض أول role هو الرئيسي
          };
        } else {
          this.errorMessage = 'لم يتم العثور على الادمن';
        }
      } catch (error) {
        this.errorMessage = 'فشل في جلب بيانات الادمن';
        console.error('خطأ في جلب بيانات الادمن:', error);
      } finally {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    } else {
      this.errorMessage = 'معرف الادمن غير موجود';
      this.isLoading = false;
    }
  }

  async handleSubmit(): Promise<void> {
    // إضافة was-validated للـ Bootstrap feedback
    if (this.formElement) {
      this.formElement.nativeElement.classList.add('was-validated');
    }
    if (!this.form.valid) {
      // تصحيح: استخدم form.form للـ template-driven form
      Object.keys(this.form.controls).forEach((key) => {
        this.form.controls[key].markAsTouched();
      });
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true; // بداية التحميل

    const body = {
      email: this.admin.email,
      userName: this.admin.userName,
      newPassword: this.admin.newPassword,
      role: this.admin.role,
    };

    try {
      const response = await firstValueFrom(
        this.apiService.updateAdmin(this.admin.id, body)
      );
      console.log('Response from Update API:', response);
      if (response.success) {
        this.successMessage = 'تم تحديث بيانات الادمن بنجاح';
        this.isLoading = false;
        this.cdr.detectChanges();
        setTimeout(() => {
          this.successMessage = null;
        }, 2000);
      } else {
        this.errorMessage = 'فشل في تحديث بيانات الادمن';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    } catch (error: any) {
      this.isLoading = false; // إيقاف التحميل في حالة الخطأ
      this.cdr.detectChanges();
      let errorMessage = 'حدث خطأ أثناء التحديث';
      if (error && 'message' in error) {
        errorMessage = error.message; // استخدام الـ message من ApiService مباشرة
      } else if (error instanceof HttpErrorResponse) {
        // للـ redundancy، لو حصل خطأ مباشر من HttpClient
        if (error.status === 400 && error.error && Array.isArray(error.error)) {
          const duplicateError = error.error.find(
            (err: any) => err.code === 'DuplicateUserName'
          );
          if (duplicateError) {
            errorMessage =
              'البريد الإلكتروني مستخدم بالفعل. يرجى إدخال بريد إلكتروني آخر.';
          } else {
            errorMessage =
              error.error.map((err: any) => err.description).join(', ') ||
              `خطأ ${error.status}: ${error.statusText}`;
          }
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        } else {
          errorMessage = `خطأ ${error.status}: ${error.statusText}`;
        }
      }
      this.errorMessage = errorMessage;
      console.error('خطأ في تحديث الإداري:', error);
    }
  }
}
