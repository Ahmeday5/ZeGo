import { Injectable } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';

/** قيم الفلاتر كما تخرج من الـ FormGroup (بتبقى null بعد form.reset()). */
export type ListFilters = Record<string, string | null | undefined>;

export interface ListViewState<F extends ListFilters = ListFilters> {
  page: number;
  pageSize: number;
  filters: F;
}

export interface ListStateConfig<F extends ListFilters = ListFilters> {
  /** مفتاح فريد لكل قائمة، يُستخدم لتخزين الحالة في الجلسة. */
  key: string;
  /** الحالة الافتراضية؛ مفاتيح filters هي نفسها أسماء الـ query params المسموحة. */
  defaults: ListViewState<F>;
  /** أحجام الصفحات المسموحة؛ أي قيمة غيرها في الرابط يتم تجاهلها. */
  allowedPageSizes?: readonly number[];
}

const PAGE_PARAM = 'page';
const PAGE_SIZE_PARAM = 'pageSize';
const STORAGE_PREFIX = 'zego:list-state:';

/**
 * يحافظ على حالة القوائم (الصفحة، حجم الصفحة، الفلاتر) عند التنقل بين الصفحات.
 *
 * - المصدر الأساسي هو الـ query params: زر الرجوع في المتصفح، الـ refresh، ونسخ الرابط
 *   كلهم بيرجعوا نفس النتيجة بالظبط.
 * - sessionStorage هو fallback لما المستخدم يرجع للقائمة برابط من غير params
 *   (من القائمة الجانبية أو التابات)، فيلاقي آخر فلتر كان شغال عليه في نفس الجلسة.
 *
 * التحديث بيتم بـ replaceUrl عشان تغيير الصفحة أو الفلتر ما يملاش الـ history،
 * وزر الرجوع من صفحة التفاصيل يرجع للقائمة بآخر حالة مباشرة.
 */
@Injectable({ providedIn: 'root' })
export class ListStateService {
  constructor(private router: Router) {}

  /** يقرأ الحالة من الرابط، أو من الجلسة لو الرابط مفيهوش حالة، أو يرجّع الافتراضي. */
  restore<F extends ListFilters>(route: ActivatedRoute, config: ListStateConfig<F>): ListViewState<F> {
    const queryParams = route.snapshot.queryParamMap;
    const hasUrlState = this.managedKeys(config).some((key) => queryParams.has(key));
    const source = hasUrlState ? route.snapshot.queryParams : this.readStorage(config.key);

    return this.parse(source, config);
  }

  /** يكتب الحالة في الرابط (بدون إضافة خطوة في الـ history) وفي الجلسة. */
  persist<F extends ListFilters>(
    route: ActivatedRoute,
    config: ListStateConfig<F>,
    state: ListViewState<F>,
  ): void {
    const queryParams = this.serialize(state, config);
    this.writeStorage(config.key, queryParams);

    if (this.isUrlInSync(route, queryParams)) return;

    this.router.navigate([], {
      relativeTo: route,
      queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  /** هل فيه أي فلتر مختلف عن القيمة الافتراضية؟ (مفيد لفتح لوحة الفلترة تلقائيًا). */
  hasActiveFilters<F extends ListFilters>(state: ListViewState<F>, config: ListStateConfig<F>): boolean {
    return Object.keys(config.defaults.filters).some(
      (key) => this.normalize(state.filters[key]) !== this.normalize(config.defaults.filters[key]),
    );
  }

  private parse<F extends ListFilters>(source: Params, config: ListStateConfig<F>): ListViewState<F> {
    const { defaults, allowedPageSizes } = config;

    const page = this.toPositiveInt(source[PAGE_PARAM]) ?? defaults.page;

    const requestedSize = this.toPositiveInt(source[PAGE_SIZE_PARAM]);
    const pageSize =
      requestedSize !== null && (!allowedPageSizes || allowedPageSizes.includes(requestedSize))
        ? requestedSize
        : defaults.pageSize;

    const filters: ListFilters = { ...defaults.filters };
    for (const key of Object.keys(defaults.filters)) {
      const value = source[key];
      if (typeof value === 'string') filters[key] = value;
    }

    return { page, pageSize, filters: filters as F };
  }

  /** القيم الافتراضية بتتكتب null عشان تتشال من الرابط ويفضل نضيف. */
  private serialize<F extends ListFilters>(state: ListViewState<F>, config: ListStateConfig<F>): Params {
    const { defaults } = config;
    const params: Params = {
      [PAGE_PARAM]: state.page !== defaults.page ? state.page : null,
      [PAGE_SIZE_PARAM]: state.pageSize !== defaults.pageSize ? state.pageSize : null,
    };

    for (const key of Object.keys(defaults.filters)) {
      const value = this.normalize(state.filters[key]);
      params[key] = value && value !== this.normalize(defaults.filters[key]) ? value : null;
    }

    return params;
  }

  private isUrlInSync(route: ActivatedRoute, params: Params): boolean {
    const current = route.snapshot.queryParamMap;
    return Object.entries(params).every(([key, value]) =>
      value === null ? !current.has(key) : current.get(key) === String(value),
    );
  }

  private managedKeys(config: ListStateConfig<ListFilters>): string[] {
    return [PAGE_PARAM, PAGE_SIZE_PARAM, ...Object.keys(config.defaults.filters)];
  }

  private normalize(value: string | null | undefined): string {
    return (value ?? '').toString().trim();
  }

  private toPositiveInt(value: unknown): number | null {
    const parsed = Number(value);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }

  private readStorage(key: string): Params {
    try {
      const raw = sessionStorage.getItem(STORAGE_PREFIX + key);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private writeStorage(key: string, params: Params): void {
    const meaningful = Object.fromEntries(Object.entries(params).filter(([, value]) => value !== null));
    try {
      sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(meaningful));
    } catch {
      // التخزين ممكن يكون مقفول (private mode / quota) — الرابط لسه شايل الحالة.
    }
  }
}
