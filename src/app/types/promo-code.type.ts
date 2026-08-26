export interface PromoCode {
  id: number;
  code: string;
  discountPercentage: number;
  maxDiscountAmount: number | null;
  maxTotalUsage: number | null;
  maxUsagePerClient: number | null;
  totalUsedCount: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
}

export interface PromoCodeCreateRequest {
  code: string;
  discountPercentage: number;
  maxDiscountAmount: number | null;
  maxTotalUsage: number | null;
  maxUsagePerClient: number | null;
}

export interface PromoCodeUpdateRequest {
  discountPercentage: number | null;
  maxDiscountAmount: number | null;
  maxTotalUsage: number | null;
  maxUsagePerClient: number | null;
}

export interface PromoCodesPage {
  pageIndex: number;
  pageSize: number;
  count: number;
  data: PromoCode[];
}

export interface PromoCodesListResponse {
  statusCode: number;
  message: string;
  data: PromoCodesPage;
}

export type PromoCodeRedemptionStatus = 'Applied' | 'Reversed';

export interface PromoCodeRedemption {
  id: number;
  promoCode: string;
  clientId: number;
  clientName: string;
  tripRequestId: number;
  driverId: number;
  driverName: string;
  originalPrice: number;
  discountAmount: number;
  discountedPrice: number;
  status: PromoCodeRedemptionStatus;
  createdAt: string;
  reversedAt: string | null;
}

export interface PromoCodeRedemptionsPage {
  pageIndex: number;
  pageSize: number;
  count: number;
  data: PromoCodeRedemption[];
}

export interface PromoCodeRedemptionsResponse {
  statusCode: number;
  message: string;
  data: PromoCodeRedemptionsPage;
}
