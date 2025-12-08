export interface allAdmins {
  id: string;
  email: string;
  userName: string;
  roles: string[];
}

export interface adminsResponse {
  data: allAdmins[];
  statusCode: number; // optional
  message: string;
}

export interface AddAdminResponse {
  success: boolean;
  message: string;
  data?: {
    userId: string;
    email: string;
    role: string;
    userName: string;
  };
}
