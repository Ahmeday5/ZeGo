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
