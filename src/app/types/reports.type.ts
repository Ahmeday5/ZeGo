export interface DriverReport {
  driverId: number;
  driverName: string;
  driverNationalId: string;
  totalTrips: number;
  totalEarning: number;
  totalAppDebt: number;
}

// 2. الإجماليات العامة لكل الصفحة
export interface ReportTotals {
  totalEarnings: number;
  totalTrips: number;
  totalDrivers: number;
  totalClients: number;
}

// 3. الـ data الداخلية (اللي جوا الـ data الكبيرة)
export interface ReportDataWrapper {
  filterType: string;        // "monthly" | "daily" | "yearly" ...
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  totals: ReportTotals;
  data: DriverReport[];      // ← المصفوفة الحقيقية للسائقين
}

// 4. الـ Response الكلي من الـ API
export interface ReportsApiResponse {
  statusCode: number;
  message: string;
  data: ReportDataWrapper;
}


