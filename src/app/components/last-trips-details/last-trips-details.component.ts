import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { LastTripItem } from '../../types/dashboard.type';

@Component({
  selector: 'app-last-trips-details',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './last-trips-details.component.html',
  styleUrl: './last-trips-details.component.scss'
})
export class LastTripsDetailsComponent implements OnInit {
  trip: LastTripItem | null = null;
  loading = true;
  errorMessage: string | null = null;
  tripId!: number;
  
  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.tripId = Number(this.route.snapshot.paramMap.get('tripId'));
    if (this.tripId) {
      this.loadTripDetails();
    } else {
      this.errorMessage = 'رقم الرحلة غير موجود';
      this.loading = false;
    }
  }

  loadTripDetails() {
    this.loading = true;
    this.errorMessage = null;

    // مؤقتًا: نجيب كل الرحلات ونفلتر (غير مثالي لكن يشتغل)
    // الأفضل: اعمل endpoint جديد /api/Dashboard/trips/:id
    this.apiService.getLastTrips(1, 100).subscribe({
      next: (res) => {
        const found = res.items.find(t => t.tripId === this.tripId);
        if (found) {
          this.trip = found;
        } else {
          this.errorMessage = 'لم يتم العثور على الرحلة رقم ' + this.tripId;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'فشل تحميل تفاصيل الرحلة';
        this.loading = false;
      }
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
}
