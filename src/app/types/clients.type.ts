export interface allClient {
  id: number;
  name: string;
  phone: string;
  email: string;
  isActive: boolean;
  profileImageUrl: string;
  createdAt:string;
}

export interface ClientsResponse {
  data: allClient[];
  pageIndex: number;
  pageSize: number;
  count: number;
  totalPages?: number; // ← خليناه اختياري
  errorMessage?: string;
}
