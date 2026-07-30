/* ===============================
   1️⃣ Trip (تفاصيل الرحلة)
================================ */

export interface DriverTripReport {
  reportId: number;
  tripRequestId: number;
  tripAmount: number;
  driverEarning: number;
  appDebt: number;

  createdAt: string; // ISO Date

  pickupLocation: string;
  dropoffLocation: string;

  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;

  proposedPrice: number;
  status: string;

  clientId: number;
  carType: 'Car' | 'Delivery' | 'Motorcycle' | 'PinkCar' | 'PinkMotorcycle';

  comment: string;

  totalDistanceKm: number | null;
  estimatedDurationMinutes: number | null;
}

/* ===============================
   2️⃣ Driver Summary + Trips
================================ */

export interface DriverReport {
  driverId: number;
  driverName: string;
  driverNationalId: string;

  totalTrips: number;
  totalEarning: number;
  totalAppDebt: number;

  trips: DriverTripReport[];
}

/* ===============================
   3️⃣ Totals (إجماليات الصفحة)
================================ */

export interface ReportTotals {
  totalEarnings: number;
  totalDeps: number;
  totalTrips: number;
  totalClients: number;
  totalDriversInResult: number;
  totalActiveDriversInCurrentPage: number;
}

/* ===============================
   4️⃣ Data Wrapper
================================ */

export interface ReportDataWrapper {
  filterType: 'daily' | 'weekly' | 'monthly' | 'yearly'; // أضفت weekly

  year: number | null;
  month: number | null;
  driverNameSearch: string | null;

  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;

  totals: ReportTotals;
  data: DriverReport[];
}

/* ===============================
   5️⃣ API Response
================================ */

export interface ReportsApiResponse {
  statusCode: number;
  message: string;
  data: ReportDataWrapper;
}
