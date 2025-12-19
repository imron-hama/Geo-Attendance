export enum AttendanceType {
  CHECK_IN = 'CHECK_IN',
  CHECK_OUT = 'CHECK_OUT'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  avatarColor?: string;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface WorkplaceConfig {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  type: AttendanceType;
  timestamp: number; 
  location: GeoLocation | null;
  note?: string;
  synced: boolean;
}

export interface WorkSummary {
  totalHours: string;
  status: string;
  aiFeedback: string;
}