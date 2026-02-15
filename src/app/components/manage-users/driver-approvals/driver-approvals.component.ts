import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { FormsModule } from '@angular/forms';
import { DriverDetail } from '../../../types/driver.type';

interface Document {
  title: string;
  url: string;
  expiryDate?: string;
  Number?: string;
  numberTitle?: string;
}

@Component({
  selector: 'app-driver-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './driver-approvals.component.html',
  styleUrl: './driver-approvals.component.scss',
})
export class DriverApprovalsComponent implements OnInit {
  selectedImage: string = '';
  noDriverMessage: string | null = null;
  DriverMessage: string | null = null;

  newProfitPercentage: number | null = null;
  loadingPercentage = false;
  percentageSuccessMsg: string | null = null;
  percentageErrorMsg: string | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private api: ApiService,
  ) {}

  // دالة لعرض الصورة في الـ modal
  openImageModal(src: string) {
    this.selectedImage = src;
    this.cdr.detectChanges();
  }

  driver: DriverDetail | null = null;
  documents: Document[] = [];

  loading = true;

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const driverId = params.get('id');
      if (driverId) {
        this.loadDriverDetails(+driverId);
      }
    });
  }

  loadDriverDetails(id: number): void {
    this.loading = true;
    this.api.getDriverById(id).subscribe({
      next: (res) => {
        this.driver = res.data;

        // نعبي المستندات
        this.documents = [
          {
            title: 'رخصة القيادة',
            url: this.driver?.licenseImageUrl || '/assets/img/no-image.png',
            expiryDate: this.driver?.expiryDate,
            Number: this.driver?.licenseNumber,
            numberTitle: 'رقم الرخصة',
          },
          {
            title: 'البطاقة الشخصية',
            url: this.driver?.nationalIdImageUrl || '/assets/img/no-image.png',
            Number: this.driver?.nationalId,
            numberTitle: 'رقم البطاقة',
          },
          {
            title: 'صورة السيارة',
            url: this.driver?.carImgUrl || '/assets/img/no-image.png',
            Number: this.driver?.carNumber,
            numberTitle: 'رقم السيارة',
          },
        ];

        this.loading = false;
      },
      error: (err) => {
        console.error('فشل جلب بيانات السائق', err);
        this.loading = false;
      },
    });
  }

  get driverId(): number | null {
    return this.driver?.id || null;
  }

  deactivatedDriver(id: number) {
    if (confirm('هل أنت متأكد من حظر هذه السائق')) {
      this.loading = true;
      this.api.deactivateDriver(id).subscribe({
        next: () => {
          this.DriverMessage = 'تم حظر السائق بنجاح';
          setTimeout(() => {
            this.DriverMessage = null;
            this.loadDriverDetails(id);
          }, 2000);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`خطأ في حظر السائق ${id}:`, error);
          this.noDriverMessage = 'فشل حظر السائق';
          this.loading = false;
          setTimeout(() => {
            this.noDriverMessage = null;
          }, 2000);
          this.cdr.detectChanges();
        },
      });
    }
  }

  activatedDriver(id: number) {
    if (confirm('هل أنت متأكد من قبول هذه السائق')) {
      this.loading = true;
      this.api.activateDriver(id).subscribe({
        next: () => {
          this.DriverMessage = 'تم قبول السائق بنجاح';
          setTimeout(() => {
            this.DriverMessage = null;
            this.loadDriverDetails(id);
          }, 2000);
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error(`خطأ في قبول السائق ${id}:`, error);
          this.noDriverMessage = 'فشل قبول السائق';
          this.loading = false;
          setTimeout(() => {
            this.noDriverMessage = null;
          }, 2000);
          this.cdr.detectChanges();
        },
      });
    }
  }

  // ------------------- داخل الكلاس -------------------

  prepareEditPercentage() {
    this.newProfitPercentage = this.driver?.profitPercentage
      ? parseFloat(this.driver.profitPercentage)
      : null;
    this.percentageSuccessMsg = null;
    this.percentageErrorMsg = null;
  }

  updateDriverPercentage() {
    if (!this.driver?.id || this.newProfitPercentage === null) return;

    this.loadingPercentage = true;
    this.percentageSuccessMsg = null;
    this.percentageErrorMsg = null;

    this.api
      .updatePercentage(this.driver.id, this.newProfitPercentage)
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.percentageSuccessMsg =
              res.message || 'تم تحديث نسبة الربح بنجاح';

            // تحديث العرض مباشرة
            if (this.driver) {
              this.driver.profitPercentage =
                this.newProfitPercentage!.toFixed(2);
            }

            // إغلاق المودال بعد 1.8 ثانية تقريباً
            setTimeout(() => {
              const modal = document.getElementById('editPercentageModal');
              if (modal) {
                // @ts-ignore
                bootstrap.Modal.getInstance(modal)?.hide();
              }
              this.loadingPercentage = false;
              this.newProfitPercentage = null;
              this.percentageSuccessMsg = null;
            }, 1800);
          }
        },
        error: (err) => {
          this.percentageErrorMsg = err.message || 'حدث خطأ أثناء تحديث النسبة';
          this.loadingPercentage = false;
        },
      });
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'غير متوفر';
    return date.split('T')[0];
  }
}
