import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import {
  DashboardSummaryResponse,
  DashboardSummaryData,
  DashboardlastTripsData,
  DashboardTripsStatusData,
} from '../../types/dashboard.type';

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
  imports: [CommonModule, RouterModule],
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
  lastTrips: DashboardlastTripsData[] = []; // دي بترجع اري جواه اوبجكت
  TripsStatus: DashboardTripsStatusData[] = []; // دي بترجع اري جواه اوبجكت
  // الكروت اللي هتتعرض في الـ HTML
  statsCards: StatsCard[] = [];
  TripsStatusCards: tripsStatusCards[] = [];

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

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
        console.log('API Data:', data);

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

    this.apiService.getLastTrips().subscribe({
      next: (data: DashboardlastTripsData[]) => {
        console.log('API Data:', data);

        this.lastTrips = data;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('خطأ في جلب اخر رحلات:', err);
        this.nolastTripsMessage = 'فشل جلب اخر رحلات، تأكد من الاتصال';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  // استدعاء حالة رحلات
  fetchTripsStatus() {
    this.loading = true;
    this.nolastTripsMessage = null;

    this.apiService.getTripsStatus().subscribe({
      next: (data: DashboardTripsStatusData[]) => {
        console.log('API Data:', data);
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
}
