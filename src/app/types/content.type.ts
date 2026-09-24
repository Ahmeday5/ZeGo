export interface AddContentResponse {
  success: boolean;
  message: string;
}

/** أرقام التواصل لكل فرع — نفس الشكل بيتبعت في PUT addEditContact وبيرجع من GET contact */
export interface allContent {
  sohagPhone: string;
  alexandriaPhone: string;
  sohagWhatsAppPhone: string;
  alexandriaWhatsAppPhone: string;
}

export type ContactField = keyof allContent;

export interface allContentResponse {
  statusCode: number;
  message: string;
  data: allContent; // دي برتجع اوبجكت واحد
}

export const EMPTY_CONTACTS: allContent = {
  sohagPhone: '',
  alexandriaPhone: '',
  sohagWhatsAppPhone: '',
  alexandriaWhatsAppPhone: '',
};
