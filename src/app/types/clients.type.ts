import { Gender } from './lookup.type';

export interface allClient {
  id: number;
  name: string;
  phone: string;
  government?: string;
  email?: string;
  isActive: boolean;
  profileImageUrl: string;
  createdAt: string;
  gender?: Gender | string;
  wallet?: number;
  isPhoneVerified?: boolean;
}

export interface ClientsResponse {
  data: allClient[];
  pageIndex: number;
  pageSize: number;
  count: number;
  totalPages?: number; // ← خليناه اختياري
  errorMessage?: string;
}
