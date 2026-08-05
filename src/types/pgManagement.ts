// ==========================================
// ENUMS (Backend se sync)
// ==========================================
export enum RoleType {
  SuperAdmin = 1,
  Admin = 2,
  Staff = 3,
  Tenant = 4,
}

export enum ZoneType {
  NonAC = 1,
  AC = 2,
}

export enum BedStatus {
  Vacant = 1,
  Occupied = 2,
  Reserved = 3,
  Maintenance = 4,
}

// ==========================================
// AUTH & USER INTERFACES
// ==========================================
export interface CreateUserDto {
  name: string;
  email: string;
  mobile: string;
  password?: string;
  roleId: RoleType;
}

export interface UserResponseDto {
  userId: string;
  name: string;
  email: string;
  mobile: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
  createdAt: string;
}

export interface LoginDto {
  email: string;
  password?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
}

// ==========================================
// FLAT, ZONE & BED INTERFACES
// ==========================================
export interface CreateBedDto {
  bedNumber: string;
  status: BedStatus;
  tenantName?: string;
}

export interface CreateZoneDto {
  zoneName: string;
  type: ZoneType;
  capacity: number;
  rentPerBed: number;
  beds: CreateBedDto[];
}

export interface CreateFlatDto {
  flatNumber: string;
  apartmentName: string;
  userId: string; // PG Owner Guid
  zones: CreateZoneDto[];
}
