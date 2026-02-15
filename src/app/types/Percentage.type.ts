export interface AddPricingResponse {
  success: boolean;
  message: string;
}

export interface ApiResponse<T = null> {
  statusCode: number;
  message: string;
  data: T;
}
