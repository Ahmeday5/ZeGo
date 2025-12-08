import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-add-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './add-admin.component.html',
  styleUrl: './add-admin.component.scss',
})
export class AddAdminComponent {
  @ViewChild('form') form!: NgForm;
  @ViewChild('form', { static: false, read: ElementRef })
  formElement!: ElementRef<HTMLFormElement>;

  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showPassword: boolean = false;

  admin: { email: string; password: string; userName: string; role: string } = {
    email: '',
    password: '',
    role: '',
    userName: '',
  };

  constructor(private apiService: ApiService, private router: Router) {}

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  async handleSubmit(): Promise<void> {
    if (this.formElement) {
      this.formElement.nativeElement.classList.add('was-validated');
    }
    if (!this.form.valid) {
      Object.keys(this.form.controls).forEach((key) => {
        this.form.controls[key].markAsTouched();
      });
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const body = {
      email: this.admin.email,
      password: this.admin.password,
      role: this.admin.role,
      userName: this.admin.userName,
    };

    try {
      const response = await firstValueFrom(this.apiService.addAdmin(body));
      console.log('Response from Add Admin API:', response);
      if (response.success) {
        this.successMessage = response.message;
        this.isLoading = false;
        setTimeout(() => {
          this.successMessage = '';
          location.reload();
        }, 3000);
      } else {
        this.errorMessage = 'فشل في إضافة الادمن';
        this.isLoading = false;
      }
    } catch (error: any) {
      this.isLoading = false;
      let errorMessage = 'حدث خطأ أثناء الإضافة';
      if (error && 'message' in error) {
        errorMessage = error.message;
      } else if (error instanceof HttpErrorResponse) {
        if (error.status === 400 && error.error && Array.isArray(error.error)) {
          const passwordErrors = error.error.filter(
            (err: any) =>
              err.code === 'PasswordRequiresNonAlphanumeric' ||
              err.code === 'PasswordRequiresLower' ||
              err.code === 'PasswordRequiresUpper'
          );
          if (passwordErrors.length > 0) {
            errorMessage =
              'كلمة المرور يجب أن تحتوي على حرف صغير، حرف كبير، ورمز غير أبجدي واحد على الأقل.';
          } else {
            errorMessage =
              error.error.map((err: any) => err.description).join(', ') ||
              `خطأ ${error.status}: ${error.statusText}`;
          }
        } else if (typeof error.error === 'string') {
          if (
            error.error.toLowerCase().includes('email is already registered')
          ) {
            errorMessage =
              'البريد الإلكتروني مستخدم بالفعل. يرجى إدخال بريد إلكتروني آخر.';
          } else {
            errorMessage = error.error;
          }
        } else {
          errorMessage = `خطأ ${error.status}: ${error.statusText}`;
        }
      }
      this.errorMessage = errorMessage;
      console.error('خطأ في إضافة الإداري:', error);
    }
  }
}
