import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AddPricingResponse, allPricing } from '../../types/pricing.type';
import { AddContentResponse, allContent } from '../../types/content.type';

interface StatsCard {
  title: string;
  value: number | string;
}

@Component({
  selector: 'app-contents',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './contents.component.html',
  styleUrl: './contents.component.scss'
})

export class ContentsComponent {
@ViewChild('form') form!: NgForm;
  @ViewChild('form', { static: false, read: ElementRef })
  formElement!: ElementRef<HTMLFormElement>;

  isLoading: boolean = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  loading: boolean = true;
  contentsData: allContent | null = null;
  statsCards: StatsCard[] = [];

  contents: {
    contactPhone: string;
    whatsAppPhone: string;
  } = {
    contactPhone: '',
    whatsAppPhone: '',
  };

  constructor(
    private apiService: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchAllContents();
  }

  async handleSubmit(): Promise<void> {
    const formElement = this.formElement.nativeElement;

    if (this.formElement) {
      this.formElement.nativeElement.classList.add('was-validated');
    }
    if (!this.form.valid) {
      Object.keys(this.form.controls).forEach((key) => {
        this.form.controls[key].markAsTouched();
      });
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';

    const body = {
      contactPhone: this.contents.contactPhone,
      whatsAppPhone: this.contents.whatsAppPhone,
    };

    console.log('الـ body اللي هيترسل:', body);

    try {
      const response: AddContentResponse = await firstValueFrom(
        this.apiService.addContent(body)
      );
      console.log('Response from addContent API:', response);
      if (response.success) {
        this.successMessage = 'تم تحديث الارقام بنجاح';
        this.fetchAllContents();
        this.isLoading = false;
        setTimeout(() => {
          this.successMessage = '';
        }, 2000);
        this.form.resetForm();
        this.contents = {
          contactPhone: '',
          whatsAppPhone: '',
        };
        formElement.classList.remove('was-validated');
      } else {
        this.errorMessage = response.message || 'فشل في إضافة المحتوى';
        this.cdr.detectChanges();
      }
    } catch (error: any) {
      let errorMessage = 'حدث خطأ أثناء الإضافة';
      if (error && 'message' in error) {
        errorMessage = error.message;
      } else if (error instanceof HttpErrorResponse && error.error) {
        errorMessage =
          typeof error.error === 'string' ? error.error : 'خطأ غير معروف';
      }
      this.errorMessage = errorMessage;
      console.error('خطأ في إضافة المحتوى:', error);
      this.cdr.detectChanges();
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // دالة لجلب كل الاحصائيات (مع استدعاء getVisiblePages)
  fetchAllContents() {
    this.loading = true;
    this.errorMessage = null;

    this.apiService.getContent().subscribe({
      next: (data: allContent) => {
        console.log('API Data:', data);

        this.contentsData = data;
        // بنبني الكروت ديناميكيًا من الداتا
        this.statsCards = [
          {
            title: 'رقم الهاتف للتواصل',
            value: this.contentsData.contactPhone,
          },
          {
            title: 'رقم واتساب للتواصل',
            value: this.contentsData.whatsAppPhone,
          },
        ];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('خطأ في جلب المحتوي:', err);
        this.errorMessage = 'فشل جلب المحتوي، تأكد من الاتصال';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
