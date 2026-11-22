export type AttendanceStatus =
  | "present"
  | "late"
  | "absent"
  | "sick"
  | "permit"
  | "on_leave"
  | "holiday"
  | "work_from_home"
  | "pending";

export type WorkType = "WFO" | "WFA";

export interface Location {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  address?: string;
}

export interface CheckEntry {
  time: string;
  photoUrl?: string;
  lat: number | null;
  lng: number | null;
  locationId: string;
  locationName?: string;
  note?: string;
  gpsAccuracy?: number;
  deviceInfo?: string;
}

export interface Department {
  id: string;
  name: string;
  code?: string;
}

export interface UserInfo {
  id: string;
  email: string;
  fullName: string;
  employeeId?: string;
  position?: string;
  department?: Department;
}

export interface AttendanceRecord {
  id: string;
  date: string;
  status: AttendanceStatus;
  workType?: WorkType;
  checkIn?: CheckEntry;
  checkOut?: CheckEntry;
  user?: UserInfo;
  isLocationValid?: boolean | null;
}

export interface Shift {
  id?: string;
  name?: string;
  startTime?: string;
  endTime?: string;
}

export interface ActivePermission {
  id: string;
  type?: string;
  reason?: string;
  startDate?: string;
  endDate?: string;
}

export type TodayState =
  | "WORKING"
  | "DONE"
  | "PENDING_CHECKOUT_PREV_DAY"
  | "ON_LEAVE"
  | "WFH_PENDING_CHECKIN"
  | "NOT_CHECKED_IN";

export interface UnresolvedSession {
  id: string;
  date: string;
  checkIn: string;
  workMode?: WorkType;
  expired: boolean;
}

export interface TodayResponse {
  success: boolean;
  data: AttendanceRecord | null;
  state?: TodayState;
  unresolvedSession?: UnresolvedSession | null;
  shift?: Shift | null;
  activePermission?: ActivePermission | null;
}

export interface HistoryResponse {
  success: boolean;
  data: AttendanceRecord[];
}

export interface LocationsResponse {
  success: boolean;
  data: Location[];
}

export interface CheckInPayload {
  workMode: WorkType;
  latitude: number;
  longitude: number;
  gpsAccuracy: number;
  deviceInfo: string;
  note?: string;
  faceToken: string;
}

export interface CheckOutPayload {
  latitude: number;
  longitude: number;
  gpsAccuracy: number;
  faceToken: string;
}

export interface FaceRecognizeResponse {
  success: boolean;
  message?: string;
  data?: {
    userId: string;
    distance: number;
    confidence: number;
    verificationToken?: string;
  };
}
