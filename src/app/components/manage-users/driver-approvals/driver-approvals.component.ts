import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { FormsModule } from '@angular/forms';
import { DriverDetail } from '../../../types/driver.type';
import { ToastService } from '../../../shared/toast/toast.service';
import { ConfirmService } from '../../../shared/confirm-dialog/confirm.service';

declare var bootstrap: any;

interface Document {
  title: string;
  url?: string;
  images?: string[];
  expiryDate?: string;
  number?: string;
  numberTitle?: string;
  icon: string;
}

@Component({
  selector: 'app-driver-approvals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './driver-approvals.component.html',
  styleUrl: './driver-approvals.component.scss',
})
export class DriverApprovalsComponent implements OnInit {
  selectedImage = '';
  noDriverMessage: string | null = null;
  DriverMessage: string | null = null;

  newProfitPercentage: number | null = null;
  loadingPercentage = false;
  percentageSuccessMsg: string | null = null;
  percentageErrorMsg: string | null = null;

  loading = true;

  driver: DriverDetail | null = null;
  documents: Document[] = [];

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private api: ApiService,
    private toast: ToastService,
    private confirm: ConfirmService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const driverId = params.get('id');
      if (driverId) {
        this.loadDriverDetails(+driverId);
      }
    });
  }

  openImageModal(src: string) {
    this.selectedImage = src;
    this.cdr.detectChanges();
  }

  loadDriverDetails(id: number): void {
    this.loading = true;

    this.api.getDriverById(id).subscribe({
      next: (res) => {
        this.driver = res.data;

        this.documents = [
          {
            title: 'رخصة السائق',
            url: this.driver?.licenseImageUrl || '/assets/img/no-image.png',
            expiryDate: this.driver?.licenseExpiryDate,
            icon: 'fa-id-card',
          },

          {
            title: 'البطاقة الشخصية',
            images: [
              this.driver?.nationalIdImageUrlFront,
              this.driver?.nationalIdImageUrlBehind,
            ].filter((x): x is string => !!x),
            number: this.driver?.nationalId,
            numberTitle: 'الرقم القومي',
            icon: 'fa-address-card',
          },

          {
            title: 'رخصة المركبة',
            url: this.driver?.carLicenseUrl || '/assets/img/no-image.png',
            icon: 'fa-car-side',
          },

          {
            title: 'صورة السيارة',
            url: this.driver?.carImgUrl || '/assets/img/no-image.png',
            number: this.driver?.carNumber,
            numberTitle: 'رقم السيارة',
            icon: 'fa-car',
          },

          {
            title: 'صورة البروفايل',
            url: this.driver?.driverProfile || '/assets/img/no-image.png',
            icon: 'fa-user',
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

  async deactivatedDriver(id: number) {
    const ok = await this.confirm.ask({
      title: 'حظر السائق',
      message: 'هل أنت متأكد من حظر هذا السائق؟',
      variant: 'danger',
      icon: 'fa-ban',
      confirmText: 'نعم، حظر',
    });
    if (!ok) return;

    this.loading = true;
    this.api.deactivateDriver(id).subscribe({
      next: () => {
        this.toast.success('تم حظر السائق بنجاح', 'نجاح');
        this.loadDriverDetails(id);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(`خطأ في حظر السائق ${id}:`, error);
        this.toast.error('فشل حظر السائق', 'خطأ');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  async activatedDriver(id: number) {
    const ok = await this.confirm.ask({
      title: 'قبول السائق',
      message: 'هل أنت متأكد من قبول هذا السائق؟',
      variant: 'success',
      icon: 'fa-user-check',
      confirmText: 'نعم، قبول',
    });
    if (!ok) return;

    this.loading = true;
    this.api.activateDriver(id).subscribe({
      next: () => {
        this.toast.success('تم قبول السائق بنجاح', 'نجاح');
        this.loadDriverDetails(id);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error(`خطأ في قبول السائق ${id}:`, error);
        this.toast.error('فشل قبول السائق', 'خطأ');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  prepareEditPercentage() {
    this.newProfitPercentage = this.driver?.profitPercentage ?? null;

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
            this.toast.success(res.message || 'تم تحديث نسبة الربح بنجاح', 'نجاح');
            if (this.driver) {
              this.driver.profitPercentage = this.newProfitPercentage!;
            }
            const modal = document.getElementById('editPercentageModal');
            bootstrap.Modal.getInstance(modal)?.hide();
            this.loadingPercentage = false;
            this.newProfitPercentage = null;
          }
        },
        error: (err) => {
          this.toast.error(err.message || 'حدث خطأ أثناء تحديث النسبة', 'خطأ');
          this.loadingPercentage = false;
        },
      });
  }

  formatDate(date?: string): string {
    if (!date) return 'غير متوفر';
    return date.split('T')[0];
  }
}
