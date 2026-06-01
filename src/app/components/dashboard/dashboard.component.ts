import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import {
  DashboardSummaryResponse,
  DashboardSummaryData,
  DashboardTripsStatusData,
  LastTripItem,
  PaginationInfo,
} from '../../types/dashboard.type';
import { PaginationComponent } from '../../layout/pagination/pagination.component';
import { HttpParams } from '@angular/common/http';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { TripCacheService } from '../../services/trip-cache.service';

interface StatsCard {
  title: string;
  value: number | string;
  unit: string;
  icon: string;
}

interface tripsStatusCards {
  status: string;
  percentage: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, PaginationComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent {
  loading = true;
  nosummaryMessage: string | null = null;
  summaryMessage: string | null = null;
  nolastTripsMessage: string | null = null;
  lastTripsMessage: string | null = null;

  // الداتا اللي جاية من الـ API
  summaryData: DashboardSummaryData | null = null; // دي برتجع اوبجكت واحد
  lastTrips: LastTripItem[] = [];
  // متغيرات الـ pagination (نفس طريقة ListDrivers)
  totalCount = 0;
  totalPages = 0;
  currentPage = 1;
  pageSize = 5;

  TripsStatus: DashboardTripsStatusData[] = []; // دي بترجع اري جواه اوبجكت
  // الكروت اللي هتتعرض في الـ HTML
  statsCards: StatsCard[] = [];
  TripsStatusCards: tripsStatusCards[] = [];

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private router: Router, // ← أضف ده
    private location: Location,
    private tripCacheService: TripCacheService
  ) {}

  ngOnInit(): void {
    this.fetchSummary();
    this.fetchLastTrips();
    this.fetchTripsStatus();
  }

  // تحويل حالة الرحلة من الإنجليزي للعربي
  getStatusInArabic(status: string): string {
    const statusMap: { [key: string]: string } = {
      Pending: 'في الانتظار',
      Completed: 'اكتملت',
      OfferAccepted: 'تم قبول العرض من العميل',
      InProgress: 'جاري التوصيل', // اخترت لك واحدة احترافية
      Cancelled: 'ملغاة',
      DriverArrived: 'السائق وصل',
      Started: 'بدأت الرحلة',
      // لو فيه حالات تانية ضيفها هنا بسهولة
    };

    return statusMap[status] || status; // لو الـ status مش موجودة، ارجعها زي ما هي
  }

  // دالة إضافية حلوة: لون الحالة (اختياري لو عايز تضيف لون لكل حالة)
  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      Pending: '#FFA500', // برتقالي
      Completed: '#28a745', // أخضر
      OfferAccepted: '#007bff', // أزرق
      InProgress: '#17a2b8', // سماوي
      Cancelled: '#dc3545', // أحمر
    };
    return colors[status] || '#6c757d';
  }

  // دالة لجلب كل الاحصائيات (مع استدعاء getVisiblePages)
  fetchSummary() {
    this.loading = true;
    this.nosummaryMessage = null;

    this.apiService.getTotalSummary().subscribe({
      next: (data: DashboardSummaryData) => {

        this.summaryData = data;
        // بنبني الكروت ديناميكيًا من الداتا
        this.statsCards = [
          {
            title: 'الرحلات المكتملة',
            value: this.summaryData.completedTrips,
            unit: 'رحلة',
            icon: 'fa-solid fa-car',
          },
          {
            title: 'إيرادات اليوم',
            value: this.summaryData.todayRevenue.toFixed(2),
            unit: 'جنية',
            icon: 'fa-solid fa-money-bill',
          },
          {
            title: 'السائقين النشطين',
            value: this.summaryData.activeDrivers,
            unit: 'سائق',
            icon: 'fa-solid fa-user-tie',
          },
          {
            title: 'عدد المستخدمين الفعليين',
            value: this.summaryData.totalClients,
            unit: 'مستخدم',
            icon: 'fa-solid fa-users',
          },
        ];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('خطأ في جلب الإحصائيات:', err);
        this.nosummaryMessage = 'فشل جلب الإحصائيات، تأكد من الاتصال';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // استدعاء اخر رحلات
  fetchLastTrips() {
    this.loading = true;
    this.nolastTripsMessage = null;

    this.apiService.getLastTrips(this.pageSize, this.currentPage).subscribe({
      next: (data) => {
        this.lastTrips = data.items || [];

        this.totalCount = data.pagination?.totalCount || 0;
        this.totalPages = data.pagination?.totalPages || 1;
        this.currentPage = data.pagination?.pageIndex || 1;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('خطأ في جلب الرحلات', err);
        this.nolastTripsMessage = 'فشل جلب آخر الرحلات';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  onPageChange(page: number) {
    if (page === this.currentPage) return;
    this.currentPage = page;
    this.fetchLastTrips();
  }

  // استدعاء حالة رحلات
  fetchTripsStatus() {
    this.loading = true;
    this.nolastTripsMessage = null;

    this.apiService.getTripsStatus().subscribe({
      next: (data: DashboardTripsStatusData[]) => {
        this.TripsStatus = data;

        this.TripsStatusCards = data.map((item) => ({
          status: item.status,
          percentage: item.percentage,
        }));

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('خطأ في جلب حالة رحلات:', err);
        this.nolastTripsMessage = 'فشل جلب اخر رحلات، تأكد من الاتصال';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  viewTripDetails(trip: LastTripItem) {
    // ← غيّر الـ param من tripId إلى full trip
    this.tripCacheService.set(trip.tripId, trip);
    this.router.navigate(['/last-trip', trip.tripId]);
  }

  goBack() {
    this.location.back();
  }
}
