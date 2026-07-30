import {
  Component,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  AddPricingResponse,
  allPricing,
  PricingRequest,
} from '../../types/pricing.type';

type PricingForm = {
  [K in keyof Omit<PricingRequest, 'peakStart' | 'peakEnd'>]: number | null;
} & {
  peakStart: string;
  peakEnd: string;
};

const EMPTY_PRICING_FORM: PricingForm = {
  carNormalPricePerKm: null,
  carPeakPricePerKm: null,
  carMinimumFare: null,
  pinkCarNormalPricePerKm: null,
  pinkCarPeakPricePerKm: null,
  pinkCarMinimumFare: null,
  motorcycleNormalPricePerKm: null,
  motorcyclePeakPricePerKm: null,
  motorcycleMinimumFare: null,
  pinkMotorcycleNormalPricePerKm: null,
  pinkMotorcyclePeakPricePerKm: null,
  pinkMotorcycleMinimumFare: null,
  deliveryNormalPricePerKm: null,
  deliveryPeakPricePerKm: null,
  deliveryMinimumFare: null,
  peakStart: '',
  peakEnd: '',
};

/** Strips the trailing :00 that the API returns (HH:mm:ss) so <input type="time"> (HH:mm) can bind to it. */
function toTimeInputValue(time: string): string {
  return time?.length >= 5 ? time.slice(0, 5) : time;
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

  isLoading = false;
  loading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  pricing: PricingForm = { ...EMPTY_PRICING_FORM };

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.fetchAllPricing();
  }

  fetchAllPricing(): void {
    this.loading = true;
    this.errorMessage = null;

    this.apiService.getPricing().subscribe({
      next: (data: allPricing) => {
        this.pricing = {
          ...data,
          peakStart: toTimeInputValue(data.peakStart),
          peakEnd: toTimeInputValue(data.peakEnd),
        };
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMessage = 'فشل جلب الأسعار، تأكد من الاتصال';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  async handleSubmit(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;

    this.formElement.nativeElement.classList.add('was-validated');
    if (!this.form.valid) {
      Object.keys(this.form.controls).forEach((key) =>
        this.form.controls[key].markAsTouched(),
      );
      this.isLoading = false;
      return;
    }

    if (!this.isPeakRangeValid(this.pricing.peakStart, this.pricing.peakEnd)) {
      this.errorMessage = 'توقيت بداية الذروة يجب أن يكون قبل توقيت نهاية الذروة';
      this.isLoading = false;
      this.cdr.detectChanges();
      return;
    }

    const body: PricingRequest = {
      ...this.pricing,
      peakStart: withSeconds(this.pricing.peakStart),
      peakEnd: withSeconds(this.pricing.peakEnd),
    };

    try {
      const response: AddPricingResponse = await firstValueFrom(
        this.apiService.addPricing(body),
      );

      if (response.success) {
        this.successMessage = 'تم تحديث الأسعار بنجاح';
        setTimeout(() => (this.successMessage = null), 3000);
        this.fetchAllPricing();
      } else {
        this.errorMessage = response.message || 'فشل في تحديث الأسعار';
      }
    } catch (error: unknown) {
      this.errorMessage = this.resolveErrorMessage(error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  private isPeakRangeValid(start: string, end: string): boolean {
    if (!start || !end) return true;
    const toMinutes = (t: string) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    return toMinutes(start) < toMinutes(end);
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      return typeof error.error?.message === 'string'
        ? error.error.message
        : 'حدث خطأ أثناء الإضافة';
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return 'حدث خطأ أثناء الإضافة';
  }
}

/** Adds the :00 seconds segment the API expects (HH:mm -> HH:mm:00). */
function withSeconds(time: string): string {
  if (!time) return '';
  return time.split(':').length === 2 ? `${time}:00` : time;
}
