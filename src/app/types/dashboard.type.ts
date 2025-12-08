export interface DashboardSummaryData {
  totalClients: number;
  activeDrivers: number;
  todayRevenue: number;
  completedTrips: number;
}

export interface DashboardSummaryResponse {
  statusCode: number;
  message: string;
  data: DashboardSummaryData; // دي برتجع اوبجكت واحد
}

export interface DashboardlastTripsData {
  id: number;
  clientId: number;
  clientName: string;
  pickupLocation: string;
  dropoffLocation: string;
  proposedPrice: number;
  status: string;
  createdAt: string;
  timeAgo: string;
  carType: string;
}

export interface DashboardlastTripsResponse {
  statusCode: number;
  message: string;
  data: DashboardlastTripsData[]; // دي بترجع اري جواه اوبجكت
}

export interface DashboardTripsStatusData {
  status: string;
  count: number;
  percentage: number;
}

export interface DashboardTripsStatusResponse {
  statusCode: number;
  message: string;
  data: DashboardTripsStatusData[]; // دي بترجع اري جواه اوبجكت
}
