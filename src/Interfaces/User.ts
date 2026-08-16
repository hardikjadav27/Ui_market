export interface User {
  id: number;
  superAdminId?: number;
  adminId?: number;
  subAdminId?: number;
  masterId?: number;
  roleId: number;
  fullName: string;
  email: string;
  mobile: string;
  ipAddress: string;
  username: string;
  role: string;
  createdBy: string;
  sharingRate?: number;
  availableBalance?: number;
  superAdminName?: string;
  adminName?: string;
  subAdminName?: string;
  masterName?: string;
  partnershipType?: string;
  rentalAmount?: number;
  rentalCycleDays?: number;
}

export interface CreateUserRequest {
  roleId: number;
  fullName: string;
  email: string;
  password: string;
  mobile: string;
  username: string;
  sharingRate?: number;
  partnershipType?: string;
  rentalAmount?: number;
  rentalCycleDays?: number;
}

export interface UserResponse {
  success: boolean;
  message: string;
  data: User[];
}
