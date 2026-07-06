export interface Government {
  id: number;
  name: string;
}

export interface GovernmentResponse {
  statusCode: number;
  message: string;
  data: Government[];
}
