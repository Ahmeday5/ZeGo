export interface allDriver {
  id: number;
  name: string;
  email: string;
  phone: string;
  government?: string;
  carType: string;
  carModel: string;
  carNumber: string;
  licenseNumber: string;
  isActive: boolean;
  address?: string;
  carImgUrl?: string;
  carYear?: string;
  carColor?: string;
  profitPercentage?: string;
  debt?: string;
  averageRating?: string;
  licenseImageUrl?: string;
  expiryDate?: string;
  nationalIdImageUrl?: string;
  nationalId?: string;
  driverProfile?: string;
  createdAt?: string;
}

export interface DriversResponse {
  statusCode?: number;
  message?: string;
  data: {
    data: allDriver[];
    pageIndex: number;
    pageSize: number;
    totalCount: number;
  };
}

export interface DriverDetail {
  id: number;
  name: string;
  phone: string;
  government?: string | null;
  address: string;

  // License
  licenseExpiryDate?: string;
  driverLicenseExpiryDate?: string;
  licenseImageUrl: string;
  driverLicenseImageUrl?: string;

  // National ID
  nationalId: string;
  nationalIdImageUrlFront: string;
  nationalIdImageUrlBehind: string;

  // Car
  carModel: string;
  carNumber: string;
  carYear: string;
  carColor: string;
  carType: string;
  carImgUrl: string;
  carLicenseUrl?: string;

  // Profile
  driverProfile: string;

  // Meta
  createdAt?: string;
  isActive: boolean;
  profitPercentage: number;
  debt: number;
  averageRating: number;
}

interface Document {
  title: string;
  url?: string;
  images?: string[];
  expiryDate?: string;
  number?: string;
  numberTitle?: string;
  icon: string;
}
