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
}
