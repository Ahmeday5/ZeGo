export interface AddContentResponse {
  success: boolean;
  message: string;
}

export interface allContent {
  contactPhone: number;
  whatsAppPhone: number;
}

export interface allContentResponse {
  statusCode: number;
  message: string;
  data: allContent; // دي برتجع اوبجكت واحد
}
