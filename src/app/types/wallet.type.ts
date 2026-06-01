export type WalletUserType = 'Client' | 'Driver';
export type WalletAdjustType = 'Credit' | 'Debit';

export interface WalletAdjustRequest {
  userType: WalletUserType;
  userId: number;
  amount: number;
  type: WalletAdjustType;
  description: string;
}

export interface WalletTransaction {
  id: number;
  ownerType: WalletUserType;
  ownerId: number;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  tripRequestId?: number | null;
  performedBy: string;
  createdAt: string;
}

export interface WalletAdjustResponse {
  statusCode: number;
  message: string;
  data: WalletTransaction;
}

export interface WalletTransactionsPage {
  pageIndex: number;
  pageSize: number;
  count: number;
  data: WalletTransaction[];
}

export interface WalletTransactionsResponse {
  statusCode: number;
  message: string;
  data: WalletTransactionsPage;
}
