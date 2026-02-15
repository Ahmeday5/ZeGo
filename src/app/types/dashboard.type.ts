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

// آخر الرحلات (الـ last trips) → دلوقتي في items + pagination
export interface ClientInfo {
  id: number;
  name: string;
}

export interface DriverCar {
  type: string;
  model: string;
  year: string;
  color: string;
  plate: string;
  image: string;
}

export interface DriverInfo {
  id: number;
  name: string;
  phone: string;
  rating: number;
  profilePic: string;
  car: DriverCar;
}

export interface LastTripItem {
  tripId: number;
  client: ClientInfo;
  status: string;
  createdAt: string;
  timeAgo: string;
  carType: string;
  proposedPrice: number;
  driver: DriverInfo | null;
  hasDriver: boolean;
  offerCount: number;
}

export interface PaginationInfo {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface DashboardLastTripsData {
  items: LastTripItem[];
  pagination: PaginationInfo;
}

export interface DashboardLastTripsResponse {
  statusCode: number;
  message: string;
  data: DashboardLastTripsData;
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
