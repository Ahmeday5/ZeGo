export interface AddPricingResponse {
  success: boolean;
  message: string;
}

export interface allPricing {
  carNormalPricePerKm: number;
  carPeakPricePerKm: number;
  carMinimumFare: number;
  motorcycleNormalPricePerKm: number;
  motorcyclePeakPricePerKm: number;
  motorcycleMinimumFare: number;
  deliveryNormalPricePerKm: number;
  deliveryPeakPricePerKm: number;
  deliveryMinimumFare: number;
  peakStart: string;
  peakEnd: string;
}

export interface allPricingResponse {
  statusCode: number;
  message: string;
  data: allPricing; // دي برتجع اوبجكت واحد
}

export interface ApiResponse<T = null> {
  statusCode: number;
  message: string;
  data: T;
}
