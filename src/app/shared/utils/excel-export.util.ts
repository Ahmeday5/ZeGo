import * as XLSX from 'xlsx';

/**
 * أداة تصدير Excel مشتركة (.xlsx حقيقي).
 * نستخدم ملف Excel حقيقي بدل نص CSV لأن فتح CSV يعتمد على الفاصلة (locale) الخاصة
 * بالبرنامج الذي يفتحه، وقد يضع كل الأعمدة في خلية واحدة إذا لم يتطابق التوطين.
 * ملف .xlsx يفتح بأعمدة منفصلة دائمًا بشكل مضمون بغض النظر عن البرنامج أو اللغة.
 */

export interface ExcelColumn<T> {
  header: string;
  value: (row: T, index: number) => string | number | null | undefined;
  /** عرض العمود بوحدة "عدد الحروف" التقريبية المستخدمة في Excel. */
  width?: number;
}

export function exportToExcel<T>(
  rows: T[],
  columns: ExcelColumn<T>[],
  fileName: string,
  sheetName = 'Sheet1',
): void {
  const headerRow = columns.map((c) => c.header);
  const dataRows = rows.map((row, i) =>
    columns.map((c) => c.value(row, i) ?? ''),
  );

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  worksheet['!cols'] = columns.map((c) => ({ wch: c.width ?? 18 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  XLSX.writeFile(workbook, fileName);
}

/** يبني اسم ملف بصيغة: البادئة_YYYY-MM-DD_HH-mm.xlsx (وقت التصدير نفسه، وليس تاريخ بيانات الصف). */
export function buildExportFileName(prefix: string): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const datePart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  const timePart = `${pad(now.getHours())}-${pad(now.getMinutes())}`;
  return `${prefix}_${datePart}_${timePart}.xlsx`;
}

/** تنسيق تاريخ ISO القادم من الـ API إلى YYYY-MM-DD قابل للفرز في Excel، أو رسالة واضحة إذا كان غير متاح. */
export function formatDateForExport(isoDate?: string | null): string {
  if (!isoDate) return 'غير متاح';
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return 'غير متاح';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
