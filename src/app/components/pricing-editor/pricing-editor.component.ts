import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AddPricingResponse } from '../../types/pricing.type';

@Component({
  selector: 'app-pricing-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pricing-editor.component.html',
  styleUrl: './pricing-editor.component.scss',
})
export class PricingEditorComponent {
  @ViewChild('form') form!: NgForm;
  @ViewChild('form', { static: false, read: ElementRef })
  formElement!: ElementRef<HTMLFormElement>;

  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  loading: boolean = true;

  pricing: {
    normalPricePerKm: number | null;
    peakPricePerKm: number | null;
    peakStart: string;
    peakEnd: string;
  } = {
    normalPricePerKm: null,
    peakPricePerKm: null,
    peakStart: '',
    peakEnd: '',
  };

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async handleSubmit(): Promise<void> {
    const formElement = this.formElement.nativeElement;

    if (this.formElement) {
      this.formElement.nativeElement.classList.add('was-validated');
    }
    if (!this.form.valid) {
      Object.keys(this.form.controls).forEach((key) => {
        this.form.controls[key].markAsTouched();
      });
      return;
    }

    // هنا السحر: نضيف :00 للثواني لو مش موجودة
    const formatTime = (time: string | null): string => {
      if (!time) return '';
      // لو الوقت بالفعل فيه ثواني (مثل 07:00:00) → سيبه زي ما هو
      if (time.includes(':')) {
        const parts = time.split(':');
        if (parts.length === 2) {
          return `${time}:00`; // نضيف الثواني
        }
      }
      return time; // لو فيه ثواني خلاص
    };

    this.errorMessage = '';
    this.successMessage = '';

    const body = {
      normalPricePerKm: this.pricing.normalPricePerKm,
      peakPricePerKm: this.pricing.peakPricePerKm,
      peakStart: formatTime(this.pricing.peakStart),
      peakEnd: formatTime(this.pricing.peakEnd),
    };

    console.log('الـ body اللي هيترسل:', body);

    try {
      const response: AddPricingResponse = await firstValueFrom(
        this.apiService.addPricing(body)
      );
      console.log('Response from addPricing API:', response);
      if (response.success) {
        this.successMessage = 'تم إضافة الاسعار بنجاح';
        this.isLoading = false;
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
        this.form.resetForm();
        this.pricing = {
          normalPricePerKm: 0,
          peakPricePerKm: 0,
          peakStart: '',
          peakEnd: '',
        };
        formElement.classList.remove('was-validated');
      } else {
        this.errorMessage = response.message || 'فشل في إضافة الاسعار';
        this.cdr.detectChanges();
      }
    } catch (error: any) {
      let errorMessage = 'حدث خطأ أثناء الإضافة';
      if (error && 'message' in error) {
        errorMessage = error.message;
      } else if (error instanceof HttpErrorResponse && error.error) {
        errorMessage =
          typeof error.error === 'string' ? error.error : 'خطأ غير معروف';
      }
      this.errorMessage = errorMessage;
      console.error('خطأ في إضافة الاسعار:', error);
      this.cdr.detectChanges();
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }
}
