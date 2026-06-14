import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router'; // أضف Router لو عايز
import { Location } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { TripCacheService } from '../../services/trip-cache.service'; // ← أضف
import { LastTripItem } from '../../types/dashboard.type';

@Component({
  selector: 'app-last-trips-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './last-trips-details.component.html',
  styleUrl: './last-trips-details.component.scss',
})
export class LastTripsDetailsComponent implements OnInit {
  trip: LastTripItem | null = null;
  loading = true;
  errorMessage: string | null = null;
  tripId!: number;

  cancelLoading = false;
  cancelMessage: string | null = null;
  cancelIsSuccess = false;

  get isCancellable(): boolean {
    return this.trip?.status !== 'Completed' && this.trip?.status !== 'Cancelled';
  }

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private location: Location,
    private tripCacheService: TripCacheService,
  ) {}

  ngOnInit(): void {
    this.tripId = Number(this.route.snapshot.paramMap.get('tripId'));

    if (!this.tripId) {
      this.errorMessage = 'رقم الرحلة غير موجود';
      this.loading = false;
      return;
    }

    // 1. أول حاجة: الكاش (الأسرع والأهم)
    const cachedTrip = this.tripCacheService.get(this.tripId);
    if (cachedTrip) {
      this.trip = cachedTrip;
      this.loading = false;
      return;
    }

    // 2. لو مش موجود → fallback (رحلات آخر 24 ساعة بـ pageSize كبير)
    this.loadTripFromAPI();
  }

  private loadTripFromAPI() {
    this.loading = true;
    this.errorMessage = null;

    // 500 أو 1000 حسب ما الـ backend يسمح (جرب 500 الأول)
    this.apiService.getLastTrips(1, 500).subscribe({
      next: (res) => {
        const found = res.items.find((t) => t.tripId === this.tripId);
        if (found) {
          this.trip = found;
          this.tripCacheService.set(this.tripId, found); // احفظه في الكاش للمرة الجاية
        } else {
          this.errorMessage = `لم يتم العثور على الرحلة رقم ${this.tripId}`;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'فشل تحميل تفاصيل الرحلة، حاول مرة أخرى';
        this.loading = false;
      },
    });
  }

  goBack() {
    this.location.back();
  }

  cancelTrip(): void {
    if (!this.trip || !this.isCancellable || this.cancelLoading) return;
    if (!confirm('هل أنت متأكد من إلغاء هذه الرحلة؟')) return;

    this.cancelLoading = true;
    this.cancelMessage = null;

    this.apiService.cancelTrip(this.tripId).subscribe({
      next: (res) => {
        this.cancelLoading = false;
        this.cancelIsSuccess = true;
        this.cancelMessage = res.message || 'تم إلغاء الرحلة بنجاح';
        if (this.trip) {
          this.trip = { ...this.trip, status: 'Cancelled' };
          this.tripCacheService.set(this.tripId, this.trip);
        }
      },
      error: (err) => {
        this.cancelLoading = false;
        this.cancelIsSuccess = false;
        this.cancelMessage = err.message || 'فشل إلغاء الرحلة';
      },
    });
  }

  getStatusInArabic(status: string): string {
    const map: Record<string, string> = {
      Pending: 'في الانتظار',
      Completed: 'اكتملت',
      OfferAccepted: 'تم قبول العرض',
      InProgress: 'جاري التوصيل',
      Cancelled: 'ملغاة',
      DriverArrived: 'السائق وصل',
      Started: 'بدأت الرحلة',
    };
    return map[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      Pending: '#FFA500',
      Completed: '#28a745',
      OfferAccepted: '#007bff',
      InProgress: '#17a2b8',
      Cancelled: '#dc3545',
    };
    return colors[status] || '#6c757d';
  }

  formatPhone(phone: string): string {
    if (!phone) return '';

    // يشيل أي حاجة مش رقم
    let cleaned = phone.replace(/\D/g, '');

    // لو الرقم مصري وبيبدأ بـ 01 → نحوله لـ 201
    if (cleaned.startsWith('01')) {
      cleaned = '2' + cleaned;
    }

    return cleaned;
  }

  /** يبني رابط الصورة الكامل من المسار النسبي الراجع من الـ API */
  imageUrl(path: string | null | undefined): string {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return `${this.imageBaseUrl}${path}`;
  }

  /** بديل عند فشل تحميل الصورة */
  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = this.fallbackImage;
  }

  /** طريقة الدفع بالعربي */
  getPaymentMethodInArabic(method: string): string {
    const map: Record<string, string> = {
      Cash: 'نقدي',
      Wallet: 'المحفظة',
      Card: 'بطاقة بنكية',
      Visa: 'فيزا',
    };
    return map[method] || method;
  }

  getPaymentIcon(method: string): string {
    const map: Record<string, string> = {
      Cash: 'fa-solid fa-money-bill-wave',
      Wallet: 'fa-solid fa-wallet',
      Card: 'fa-solid fa-credit-card',
      Visa: 'fa-brands fa-cc-visa',
    };
    return map[method] || 'fa-solid fa-circle-dollar-to-slot';
  }

  /** نوع المركبة بالعربي */
  getCarTypeInArabic(type: string): string {
    const map: Record<string, string> = {
      Car: 'سيارة',
      Motorcycle: 'دراجة نارية',
      Bike: 'دراجة',
      Truck: 'شاحنة',
    };
    return map[type] || type;
  }

  getCarTypeIcon(type: string): string {
    const map: Record<string, string> = {
      Car: 'fa-solid fa-car',
      Motorcycle: 'fa-solid fa-motorcycle',
      Bike: 'fa-solid fa-bicycle',
      Truck: 'fa-solid fa-truck',
    };
    return map[type] || 'fa-solid fa-car-side';
  }

  /** يحوّل لون فلاتر (0xFFRRGGBB) إلى لون CSS (#RRGGBB) */
  parseCarColor(color: string | null | undefined): string {
    if (!color) return '#6c757d';
    const match = color.match(/^0x[fF]{2}([0-9a-fA-F]{6})$/);
    if (match) return `#${match[1]}`;
    if (/^#?[0-9a-fA-F]{6}$/.test(color)) return color.startsWith('#') ? color : `#${color}`;
    return color;
  }

  private readonly imageBaseUrl = 'https://zego.premiumasp.net';
  private readonly fallbackImage =
    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="%23e9ecef"/><text x="50%" y="50%" font-size="48" fill="%23adb5bd" text-anchor="middle" dy=".35em">?</text></svg>';
}
