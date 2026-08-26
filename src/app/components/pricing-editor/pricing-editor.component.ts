import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../shared/toast/toast.service';
import { Government } from '../../types/government.type';
import { PricingRow, PricingUpsertRequest } from '../../types/pricing.type';

/** Strips the trailing :00 that the API returns (HH:mm:ss) so <input type="time"> (HH:mm) can bind to it. */
function toTimeInputValue(time: string): string {
  return time?.length >= 5 ? time.slice(0, 5) : time;
}

/** Adds the :00 seconds segment the API expects (HH:mm -> HH:mm:00). */
function withSeconds(time: string): string {
  if (!time) return '';
  return time.split(':').length === 2 ? `${time}:00` : time;
}

/** بيرفض قيمة placeholder "اختر محافظة" كإجابة صحيحة، رغم إنها موجودة كـ option حقيقي في الـ select. */
function notUnselectedValidator(control: AbstractControl): ValidationErrors | null {
  return control.value === UNSELECTED_GOVERNMENT_VALUE ? { required: true } : null;
}

/** بيتأكد إن بداية الذروة قبل نهايتها، بيتحط على الجروب مش على كنترول واحد عشان يقارن الاتنين. */
const peakRangeValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
  const start = group.get('peakStart')?.value;
  const end = group.get('peakEnd')?.value;
  if (!start || !end) return null;

  const toMinutes = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  return toMinutes(start) < toMinutes(end) ? null : { peakRangeInvalid: true };
};

const DEFAULT_GOVERNMENT_LABEL = 'الافتراضي (سوهاج وكل المحافظات الأخرى)';
const DEFAULT_GOVERNMENT_VALUE = 'default';
/** قيمة وهمية للخيار الأول "اختر محافظة" — مختلفة عن '' عشان متتضاربش مع القيمة الفاضية اللي Angular بيحقنها تلقائيًا لأي select value accessor. */
const UNSELECTED_GOVERNMENT_VALUE = '__unselected__';

const PRICE_FIELDS = [
  'carNormalPricePerKm', 'carPeakPricePerKm', 'carMinimumFare',
  'pinkCarNormalPricePerKm', 'pinkCarPeakPricePerKm', 'pinkCarMinimumFare',
  'motorcycleNormalPricePerKm', 'motorcyclePeakPricePerKm', 'motorcycleMinimumFare',
  'pinkMotorcycleNormalPricePerKm', 'pinkMotorcyclePeakPricePerKm', 'pinkMotorcycleMinimumFare',
  'deliveryNormalPricePerKm', 'deliveryPeakPricePerKm', 'deliveryMinimumFare',
] as const;

@Component({
  selector: 'app-pricing-editor',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './pricing-editor.component.html',
  styleUrl: './pricing-editor.component.scss',
})
export class PricingEditorComponent implements OnInit {
  readonly defaultGovernmentLabel = DEFAULT_GOVERNMENT_LABEL;
  readonly defaultGovernmentValue = DEFAULT_GOVERNMENT_VALUE;
  readonly unselectedGovernmentValue = UNSELECTED_GOVERNMENT_VALUE;

  rows: PricingRow[] = [];
  loading = false;

  governments: Government[] = [];

  showModal = false;
  modalLoading = false;
  isEditingExisting = false;
  submitted = false;
  pricingForm: FormGroup;

  constructor(
    private api: ApiService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private toast: ToastService,
  ) {
    const priceControls = PRICE_FIELDS.reduce<Record<string, unknown>>((acc, field) => {
      acc[field] = [null, [Validators.required, Validators.min(0)]];
      return acc;
    }, {});

    this.pricingForm = this.fb.group(
      {
        governmentId: [UNSELECTED_GOVERNMENT_VALUE, [Validators.required, notUnselectedValidator]],
        peakStart: ['', Validators.required],
        peakEnd: ['', Validators.required],
        ...priceControls,
      },
      { validators: peakRangeValidator },
    );
  }

  ngOnInit(): void {
    this.loadAll();
    this.api.getGovernments().subscribe((governments) => {
      this.governments = governments;
      this.cdr.detectChanges();
    });
  }

  loadAll(): void {
    this.loading = true;
    this.api.getAllPricing().subscribe({
      next: (rows) => {
        this.rows = rows;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.toast.error(err.message || 'فشل جلب الأسعار', 'خطأ');
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /** اسم المحافظة اللي هتظهر في المودال لصف موجود بالفعل (بيستخدم قيمة الصف نفسه بدل الاعتماد على قايمة governments). */
  governmentLabelFor(row: PricingRow): string {
    return row.governmentId === null ? this.defaultGovernmentLabel : row.governmentName;
  }

  /** ملخص مضغوط لأسعار الخمس مركبات (عادي/ذروة لكل كم)، بيتعرض كشرائح صغيرة في جدول الـ overview. */
  vehicleSummary(row: PricingRow): { icon: string; label: string; normal: number; peak: number }[] {
    return [
      { icon: 'fa-car-side', label: 'السيارة', normal: row.carNormalPricePerKm, peak: row.carPeakPricePerKm },
      { icon: 'fa-car-side text-pink', label: 'السيارة الوردي', normal: row.pinkCarNormalPricePerKm, peak: row.pinkCarPeakPricePerKm },
      { icon: 'fa-motorcycle', label: 'الموتوسيكل', normal: row.motorcycleNormalPricePerKm, peak: row.motorcyclePeakPricePerKm },
      { icon: 'fa-motorcycle text-pink', label: 'الموتوسيكل الوردي', normal: row.pinkMotorcycleNormalPricePerKm, peak: row.pinkMotorcyclePeakPricePerKm },
      { icon: 'fa-box', label: 'الدليفري', normal: row.deliveryNormalPricePerKm, peak: row.deliveryPeakPricePerKm },
    ];
  }

  /** بيرجع رسالة الخطأ المناسبة لكنترول معين، أو null لو مفيش خطأ يستاهل يتعرض دلوقتي. */
  fieldError(controlName: string): string | null {
    const control = this.pricingForm.get(controlName);
    if (!control || (!control.touched && !this.submitted)) return null;

    if (control.hasError('required')) return 'الحقل مطلوب';
    if (control.hasError('min')) return 'القيمة يجب أن تكون صفر أو أكبر';
    return null;
  }

  get peakRangeError(): string | null {
    const start = this.pricingForm.get('peakStart');
    const end = this.pricingForm.get('peakEnd');
    const touched = (start?.touched || end?.touched || this.submitted);
    if (!touched) return null;
    return this.pricingForm.hasError('peakRangeInvalid')
      ? 'توقيت بداية الذروة يجب أن يكون قبل توقيت نهاية الذروة'
      : null;
  }

  openAddModal(): void {
    this.isEditingExisting = false;
    this.submitted = false;
    this.pricingForm.reset({ governmentId: UNSELECTED_GOVERNMENT_VALUE });
    this.pricingForm.get('governmentId')?.enable();
    this.showModal = true;
  }

  openEditModal(row: PricingRow): void {
    this.isEditingExisting = true;
    this.submitted = false;
    this.pricingForm.patchValue({
      governmentId: row.governmentId === null ? this.defaultGovernmentValue : row.governmentId,
      peakStart: toTimeInputValue(row.peakStart),
      peakEnd: toTimeInputValue(row.peakEnd),
      carNormalPricePerKm: row.carNormalPricePerKm,
      carPeakPricePerKm: row.carPeakPricePerKm,
      carMinimumFare: row.carMinimumFare,
      pinkCarNormalPricePerKm: row.pinkCarNormalPricePerKm,
      pinkCarPeakPricePerKm: row.pinkCarPeakPricePerKm,
      pinkCarMinimumFare: row.pinkCarMinimumFare,
      motorcycleNormalPricePerKm: row.motorcycleNormalPricePerKm,
      motorcyclePeakPricePerKm: row.motorcyclePeakPricePerKm,
      motorcycleMinimumFare: row.motorcycleMinimumFare,
      pinkMotorcycleNormalPricePerKm: row.pinkMotorcycleNormalPricePerKm,
      pinkMotorcyclePeakPricePerKm: row.pinkMotorcyclePeakPricePerKm,
      pinkMotorcycleMinimumFare: row.pinkMotorcycleMinimumFare,
      deliveryNormalPricePerKm: row.deliveryNormalPricePerKm,
      deliveryPeakPricePerKm: row.deliveryPeakPricePerKm,
      deliveryMinimumFare: row.deliveryMinimumFare,
    });
    this.pricingForm.get('governmentId')?.disable();
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.isEditingExisting = false;
    this.submitted = false;
    this.pricingForm.reset({ governmentId: UNSELECTED_GOVERNMENT_VALUE });
    this.pricingForm.get('governmentId')?.enable();
    this.modalLoading = false;
  }

  submit(): void {
    this.submitted = true;

    if (this.pricingForm.invalid) {
      this.pricingForm.markAllAsTouched();
      return;
    }

    const value = this.pricingForm.getRawValue();

    const body: PricingUpsertRequest = {
      governmentId: value.governmentId === this.defaultGovernmentValue ? null : Number(value.governmentId),
      peakStart: withSeconds(value.peakStart),
      peakEnd: withSeconds(value.peakEnd),
      carNormalPricePerKm: value.carNormalPricePerKm,
      carPeakPricePerKm: value.carPeakPricePerKm,
      carMinimumFare: value.carMinimumFare,
      pinkCarNormalPricePerKm: value.pinkCarNormalPricePerKm,
      pinkCarPeakPricePerKm: value.pinkCarPeakPricePerKm,
      pinkCarMinimumFare: value.pinkCarMinimumFare,
      motorcycleNormalPricePerKm: value.motorcycleNormalPricePerKm,
      motorcyclePeakPricePerKm: value.motorcyclePeakPricePerKm,
      motorcycleMinimumFare: value.motorcycleMinimumFare,
      pinkMotorcycleNormalPricePerKm: value.pinkMotorcycleNormalPricePerKm,
      pinkMotorcyclePeakPricePerKm: value.pinkMotorcyclePeakPricePerKm,
      pinkMotorcycleMinimumFare: value.pinkMotorcycleMinimumFare,
      deliveryNormalPricePerKm: value.deliveryNormalPricePerKm,
      deliveryPeakPricePerKm: value.deliveryPeakPricePerKm,
      deliveryMinimumFare: value.deliveryMinimumFare,
    };

    this.modalLoading = true;
    this.api.upsertPricing(body).subscribe({
      next: (res) => {
        this.modalLoading = false;
        if (res.success) {
          this.toast.success('تم حفظ الأسعار بنجاح', 'نجاح');
          this.closeModal();
          this.loadAll();
        } else {
          this.toast.error(res.message || 'فشل حفظ الأسعار', 'خطأ');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.modalLoading = false;
        this.toast.error(err.message || 'فشل حفظ الأسعار', 'خطأ');
        this.cdr.detectChanges();
      },
    });
  }
}
