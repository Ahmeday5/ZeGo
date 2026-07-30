export interface AddPricingResponse {
  success: boolean;
  message: string;
}

export interface allPricing {
  carNormalPricePerKm: number;
  carPeakPricePerKm: number;
  carMinimumFare: number;
  pinkCarNormalPricePerKm: number;
  pinkCarPeakPricePerKm: number;
  pinkCarMinimumFare: number;
  motorcycleNormalPricePerKm: number;
  motorcyclePeakPricePerKm: number;
  motorcycleMinimumFare: number;
  pinkMotorcycleNormalPricePerKm: number;
  pinkMotorcyclePeakPricePerKm: number;
  pinkMotorcycleMinimumFare: number;
  deliveryNormalPricePerKm: number;
  deliveryPeakPricePerKm: number;
  deliveryMinimumFare: number;
  peakStart: string;
  peakEnd: string;
}

export interface PricingRequest {
  peakStart: string;
  peakEnd: string;
  carNormalPricePerKm: number | null;
  carPeakPricePerKm: number | null;
  carMinimumFare: number | null;
  pinkCarNormalPricePerKm: number | null;
  pinkCarPeakPricePerKm: number | null;
  pinkCarMinimumFare: number | null;
  motorcycleNormalPricePerKm: number | null;
  motorcyclePeakPricePerKm: number | null;
  motorcycleMinimumFare: number | null;
  pinkMotorcycleNormalPricePerKm: number | null;
  pinkMotorcyclePeakPricePerKm: number | null;
  pinkMotorcycleMinimumFare: number | null;
  deliveryNormalPricePerKm: number | null;
  deliveryPeakPricePerKm: number | null;
  deliveryMinimumFare: number | null;
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
