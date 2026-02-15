export interface allDriver {
  id: number;
  name: string;
  email: string;
  phone: string;
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
  email: string;
  phone: string;
  address: string;
  carImgUrl: string;
  carModel: string;
  carNumber: string;
  carYear: string;
  carColor: string;
  carType: string;
  profitPercentage: string;
  debt: string;
  averageRating: string;
  isActive: boolean;
  licenseImageUrl: string;
  expiryDate: string;
  licenseNumber: string;
  nationalIdImageUrl: string;
  nationalId: string;
  driverProfile: string;
  createdAt?: string;
}
