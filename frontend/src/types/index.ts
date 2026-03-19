export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
  instanceName: string | null;
  isActive?: boolean;
  createdAt?: string;
  posMapping?: {
    appkey: string;
    authkey: string;
    instanceId: string;
    accessToken: string;
  } | null;
}

export interface Instance {
  instanceName: string;
  ownerUsername: string;
  ownerId: number;
  status: string;
  phoneNumber: string | null;
}

export interface LoginResponse {
  token: string;
  user: User;
}
