import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { ApiService } from '../../../services/api.service';
import {
  ReportsApiResponse,
  DriverReport,
  DriverTripReport,
} from '../../../types/reports.type';
// في نفس الملف أو في ملف pipes

@Component({
  selector: 'app-price-performance',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './price-performance.component.html',
  styleUrl: './price-performance.component.scss',
})
export class PricePerformanceComponent implements OnInit {
  driver: DriverReport | null = null;
  trips: DriverTripReport[] = [];
  loading = true;
  nationalId: string = '';

  constructor(
    private route: ActivatedRoute,
    private apiService: ApiService,
  ) {}

  ngOnInit(): void {
    this.nationalId = this.route.snapshot.paramMap.get('nationalId') || '';
    if (this.nationalId) {
      this.loadDriverDetails();
    } else {
      this.loading = false;
    }
  }

  loadDriverDetails() {
    this.loading = true;

    // مش محتاج params هنا إلا لو عايز pagination أكبر
    this.apiService.getAllreports().subscribe({
      next: (res: ReportsApiResponse) => {
        if (res.data?.data?.length > 0) {
          // فلترة السائق بناءً على nationalId من الـ route
          const matchingDriver = res.data.data.find(
            (d) => d.driverNationalId === this.nationalId,
          );

          if (matchingDriver) {
            this.driver = matchingDriver;
            this.trips = matchingDriver.trips || [];
          } else {
            console.warn(`ما فيش سائق بالرقم القومي: ${this.nationalId}`);
            // ممكن تعرض رسالة: "لا توجد بيانات لهذا السائق"
            this.driver = null;
            this.trips = [];
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('خطأ في جلب التقارير:', err);
        this.loading = false;
      },
    });
  }

  getAddressWithoutCode(location: string | null | undefined): string {
    if (!location) return '-';

    // نقسم بالفاصلة
    const parts = location.split(',').map((part) => part.trim());

    // لو فيه أقل من جزئين → نرجّع كله بعد trim
    if (parts.length <= 1) {
      return location.trim();
    }

    // نشيل الجزء الأول (الكود زي X5R3+CF7) ونجمع الباقي
    const meaningfulParts = parts.slice(1); // نبدأ من الجزء الثاني

    // نرجّع الأجزاء مجمعة بفواصل
    return meaningfulParts.join(', ') || '-';
  }


  formatDate(date: string): string {
    return date.split('T')[0]; // استخراج YYYY-MM-DD فقط
  }
}
