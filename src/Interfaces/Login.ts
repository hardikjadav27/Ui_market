export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginData {
  id: number;
  fullName: string;
  email: string;
  mobile: string;
  username: string;
  roleId: number;
  role: string;
  token: string;
  expiresAtUtc: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: LoginData;
}
