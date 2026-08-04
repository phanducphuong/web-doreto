export enum ERole {
  ADMIN = "admin",
  CUSTOMER = "customer",
}

export type TAddress = {
  _id?: string;
  isDefault?: boolean;
  name: string;
  phoneNumber: string;
  address: string;
};

export type TUser = {
  id: number | string;
  _id?: string;
  name: string;
  email: string;
  role: ERole;
  avatarUrl?: string;
  /** Khi API trả về */
  phoneNumber?: string;
  addresses: TAddress[];
};

export type TUserManagementQueryParams = {
  keyword?: string;
  page?: number;
  limit?: number;
  sortBy?: "name" | "email" | "phoneNumber" | "createdAt";
  sortOrder?: "asc" | "desc";
};

export type TUserManagementItem = {
  _id: string | number;
  name?: string;
  email?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role?: ERole;
  createdAt?: string;
  updatedAt?: string | null;
};

export type TUserManagementResponse = {
  data: TUserManagementItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};
