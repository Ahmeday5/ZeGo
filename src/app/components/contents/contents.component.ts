import {
  Component,
  ElementRef,
  ViewChild,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import {
  AddContentResponse,
  allContent,
  ContactField,
  EMPTY_CONTACTS,
} from '../../types/content.type';

interface ContactFieldConfig {
  key: ContactField;
  label: string;
  placeholder: string;
  icon: string;
}

interface BranchConfig {
  id: string;
  name: string;
  fields: ContactFieldConfig[];
}

@Component({
  selector: 'app-contents',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './contents.component.html',
  styleUrl: './contents.component.scss'
})
export class ContentsComponent implements OnInit {
  @ViewChild('form') form!: NgForm;
  @ViewChild('form', { static: false, read: ElementRef })
  formElement!: ElementRef<HTMLFormElement>;

  /** رقم موبايل مصري: 01 + (0|1|2|5) + 8 أرقام — الحقل اختياري لكن لو اتكتب لازم يطابق */
  readonly phonePattern = '^01[0125][0-9]{8}$';

  /** مصدر واحد للفروع والحقول — الفورم والكروت الاتنين بيتبنوا منه */
  readonly branches: BranchConfig[] = [
    {
      id: 'sohag',
      name: 'فرع سوهاج',
      fields: [
        { key: 'sohagPhone', label: 'رقم الهاتف', placeholder: 'ادخل رقم الهاتف', icon: 'fa-solid fa-phone' },
        { key: 'sohagWhatsAppPhone', label: 'رقم واتساب', placeholder: 'ادخل رقم واتساب', icon: 'fa-brands fa-whatsapp' },
      ],
    },
    {
      id: 'alexandria',
      name: 'فرع الإسكندرية',
      fields: [
        { key: 'alexandriaPhone', label: 'رقم الهاتف', placeholder: 'ادخل رقم الهاتف', icon: 'fa-solid fa-phone' },
        { key: 'alexandriaWhatsAppPhone', label: 'رقم واتساب', placeholder: 'ادخل رقم واتساب', icon: 'fa-brands fa-whatsapp' },
      ],
    },
  ];

  isLoading = false;
  loading = true;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  /** آخر نسخة محفوظة على السيرفر (بتتعرض في الكروت) */
  contentsData: allContent | null = null;
  /** نسخة الفورم — بتتملى من الداتا الحالية عشان الـ PUT بيستبدل الأربع أرقام مع بعض */
  contents: allContent = { ...EMPTY_CONTACTS };

  private successTimer?: ReturnType<typeof setTimeout>;

  constructor(
    private apiService: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.fetchAllContents();
  }

  /** فيه تعديل فعلي عن اللي على السيرفر؟ */
  get isDirty(): boolean {
    if (!this.contentsData) return true;
    return (Object.keys(EMPTY_CONTACTS) as ContactField[]).some(
      (key) => this.normalize(this.contents[key]) !== this.contentsData![key]
    );
  }

  async handleSubmit(): Promise<void> {
    if (this.isLoading) return;

    this.formElement?.nativeElement.classList.add('was-validated');
    if (!this.form.valid) {
      Object.values(this.form.controls).forEach((control) => control.markAsTouched());
      return;
    }

    this.errorMessage = null;
    this.successMessage = null;
    this.isLoading = true;

    const body: allContent = {
      sohagPhone: this.normalize(this.contents.sohagPhone),
      sohagWhatsAppPhone: this.normalize(this.contents.sohagWhatsAppPhone),
      alexandriaPhone: this.normalize(this.contents.alexandriaPhone),
      alexandriaWhatsAppPhone: this.normalize(this.contents.alexandriaWhatsAppPhone),
    };

    try {
      const response: AddContentResponse = await firstValueFrom(
        this.apiService.addContent(body)
      );
      if (response.success) {
        this.showSuccess('تم تحديث الارقام بنجاح');
        this.formElement?.nativeElement.classList.remove('was-validated');
        this.fetchAllContents();
      } else {
        this.errorMessage = response.message || 'فشل في تحديث الارقام';
      }
    } catch (error: any) {
      let errorMessage = 'حدث خطأ أثناء التحديث';
      if (error instanceof HttpErrorResponse && error.error) {
        errorMessage = typeof error.error === 'string' ? error.error : 'خطأ غير معروف';
      } else if (error && 'message' in error) {
        errorMessage = error.message;
      }
      this.errorMessage = errorMessage;
      console.error('خطأ في تحديث الارقام:', error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /** يرجّع الفورم للقيم المحفوظة */
  resetToSaved(): void {
    this.contents = { ...(this.contentsData ?? EMPTY_CONTACTS) };
    this.formElement?.nativeElement.classList.remove('was-validated');
  }

  fetchAllContents(): void {
    this.loading = true;
    this.errorMessage = null;

    this.apiService.getContent().subscribe({
      next: (data: allContent) => {
        this.contentsData = data;
        this.contents = { ...data };
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

  private normalize(value: string | null | undefined): string {
    return (value ?? '').replace(/\s+/g, '');
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    clearTimeout(this.successTimer);
    this.successTimer = setTimeout(() => {
      this.successMessage = null;
      this.cdr.detectChanges();
    }, 2500);
  }
}
