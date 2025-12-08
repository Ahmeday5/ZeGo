import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';

interface DriverDetail {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  carImgUrl: string;
  carModel: string;
  carNumber: string;
  carYear: string;
  carColor: string;
  carType: string;
  profitPercentage: string;
  debt: string;
  averageRating: string;
  isActive: boolean;
  licenseImageUrl: string;
  expiryDate: string;
  licenseNumber: string;
  nationalIdImageUrl: string;
  nationalId: string;
}

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
  imports: [CommonModule],
  templateUrl: './driver-approvals.component.html',
  styleUrl: './driver-approvals.component.scss',
})
export class DriverApprovalsComponent implements OnInit {
  selectedImage: string = '';
  noDriverMessage: string | null = null;
  DriverMessage: string | null = null;

  constructor(
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private api: ApiService
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
}
