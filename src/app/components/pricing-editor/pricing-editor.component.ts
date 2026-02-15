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
import { AddPricingResponse, allPricing } from '../../types/pricing.type';

interface StatsCard {
  title: string;
  value: number | string;
  icon: string;
}

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
  PricingData: allPricing | null = null;
  statsCards: StatsCard[] = [];

  pricing: {
    carNormalPricePerKm: number | null;
    carPeakPricePerKm: number | null;
    carMinimumFare: number | null;
    motorcycleNormalPricePerKm: number | null;
    motorcyclePeakPricePerKm: number | null;
    motorcycleMinimumFare: number | null;
    deliveryNormalPricePerKm: number | null;
    deliveryPeakPricePerKm: number | null;
    deliveryMinimumFare: number | null;
    peakStart: string;
    peakEnd: string;
  } = {
    carNormalPricePerKm: null,
    carPeakPricePerKm: null,
    carMinimumFare: null,
    motorcycleNormalPricePerKm: null,
    motorcyclePeakPricePerKm: null,
    motorcycleMinimumFare: null,
    deliveryNormalPricePerKm: null,
    deliveryPeakPricePerKm: null,
    deliveryMinimumFare: null,
    peakStart: '',
    peakEnd: '',
  };

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.fetchAllPricing();
  }

  async handleSubmit(): Promise<void> {
    const formElement = this.formElement.nativeElement;

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.formElement) {
      this.formElement.nativeElement.classList.add('was-validated');
    }
    if (!this.form.valid) {
      Object.keys(this.form.controls).forEach((key) => {
        this.form.controls[key].markAsTouched();
      });
      this.isLoading = false;
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

    const start = this.pricing.peakStart;
    const end = this.pricing.peakEnd;

    if (start && end) {
      // نحولهم لدقايق
      const startMinutes =
        parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1]);

      const endMinutes =
        parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1]);

      if (startMinutes >= endMinutes) {
        this.errorMessage =
          'توقيت بداية الذروة يجب أن يكون قبل توقيت نهاية الذروة';
        this.isLoading = false;
        this.cdr.detectChanges();
        return;
      }
    }

    const body = {
      carNormalPricePerKm: this.pricing.carNormalPricePerKm,
      carPeakPricePerKm: this.pricing.carPeakPricePerKm,
      carMinimumFare: this.pricing.carMinimumFare,
      motorcycleNormalPricePerKm: this.pricing.motorcycleNormalPricePerKm,
      motorcyclePeakPricePerKm: this.pricing.motorcyclePeakPricePerKm,
      motorcycleMinimumFare: this.pricing.motorcycleMinimumFare,
      deliveryNormalPricePerKm: this.pricing.deliveryNormalPricePerKm,
      deliveryPeakPricePerKm: this.pricing.deliveryPeakPricePerKm,
      deliveryMinimumFare: this.pricing.deliveryMinimumFare,
      peakStart: formatTime(this.pricing.peakStart),
      peakEnd: formatTime(this.pricing.peakEnd),
    };

    console.log('الـ body اللي هيترسل:', body);

    try {
      const response: AddPricingResponse = await firstValueFrom(
        this.apiService.addPricing(body),
      );
      console.log('Response from addPricing API:', response);
      if (response.success) {
        this.successMessage = 'تم تحديث الاسعار بنجاح';
        this.fetchAllPricing();
        this.isLoading = false;
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
        this.form.resetForm();
        this.pricing = {
          carNormalPricePerKm: 0,
          carPeakPricePerKm: 0,
          carMinimumFare: 0,
          motorcycleNormalPricePerKm: 0,
          motorcyclePeakPricePerKm: 0,
          motorcycleMinimumFare: 0,
          deliveryNormalPricePerKm: 0,
          deliveryPeakPricePerKm: 0,
          deliveryMinimumFare: 0,
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

  // دالة لجلب كل الاحصائيات (مع استدعاء getVisiblePages)
  fetchAllPricing() {
    this.loading = true;
    this.errorMessage = null;

    this.apiService.getPricing().subscribe({
      next: (data: allPricing) => {
        console.log('API Data:', data);

        this.PricingData = data;
        // بنبني الكروت ديناميكيًا من الداتا
        this.statsCards = [
          {
            title: 'سعر السيارة الأساسي لكل (كيلو متر)',
            value: this.PricingData.carNormalPricePerKm,
            icon: 'fa-solid fa-road',
          },
          {
            title: 'سعر السيارة في وقت الذروة لكل (كيلو متر)',
            value: this.PricingData.carPeakPricePerKm.toFixed(2),
            icon: 'fa-solid fa-bolt',
          },
          {
            title: 'الحد الادني الأدنى للسيارة',
            value: this.PricingData.carMinimumFare,
            icon: 'fa-solid fa-bolt',
          },
          {
            title: 'سعر الموتسكيل الأساسي لكل (كيلو متر)',
            value: this.PricingData.motorcycleNormalPricePerKm,
            icon: 'fa-solid fa-road',
          },
          {
            title: 'سعر الموتسكيل في وقت الذروة لكل (كيلو متر)',
            value: this.PricingData.motorcyclePeakPricePerKm.toFixed(2),
            icon: 'fa-solid fa-bolt',
          },
          {
            title: 'الحد الادني الأدنى للموتسكيل',
            value: this.PricingData.motorcycleMinimumFare,
            icon: 'fa-solid fa-bolt',
          },
          {
            title: 'سعر الدليفري الأساسي لكل (كيلو متر)',
            value: this.PricingData.deliveryNormalPricePerKm,
            icon: 'fa-solid fa-road',
          },
          {
            title: 'سعر الدليفري في وقت الذروة لكل (كيلو متر)',
            value: this.PricingData.deliveryPeakPricePerKm.toFixed(2),
            icon: 'fa-solid fa-bolt',
          },
          {
            title: 'الحد الادني الأدنى للدليفري',
            value: this.PricingData.deliveryMinimumFare,
            icon: 'fa-solid fa-bolt',
          },
          {
            title: 'توقيت بداية الذروة',
            value: this.PricingData.peakStart,
            icon: 'fa-solid fa-clock',
          },
          {
            title: 'توقيت نهاية الذروة',
            value: this.PricingData.peakEnd,
            icon: 'fa-solid fa-clock',
          },
        ];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('خطأ في جلب الاسعار:', err);
        this.errorMessage = 'فشل جلب الاسعار، تأكد من الاتصال';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
