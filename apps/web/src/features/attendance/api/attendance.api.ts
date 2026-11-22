import { toLocalDateIso } from "@shared/utils/date";
import AxiosApiService from "@shared/api/api-service";
import { isAttendanceStatus } from "@features/attendance/utils/status";
import type {
  AttendanceRecord,
  CheckInPayload,
  CheckOutPayload,
  HistoryResponse,
  TodayResponse,
  UserInfo,
  WorkType,
} from "@features/attendance/@types";

export interface RawAttendance {
  id: string;
  date?: string;
  status?: string;
  workMode?: string;
  checkIn?: string | null;
  checkOut?: string | null;
  latitudeIn?: number | null;
  longitudeIn?: number | null;
  gpsAccuracyIn?: number | null;
  latitudeOut?: number | null;
  longitudeOut?: number | null;
  gpsAccuracyOut?: number | null;
  deviceInfo?: string | null;
  note?: string | null;
  photoIn_url?: string | null;
  photoOut_url?: string | null;
  isLocationValid?: boolean | null;
  createdAt?: string;
  updatedAt?: string;
  metadata?: {
    checkInGeo?: { locationName?: string };
    checkOutGeo?: { locationName?: string };
  } | null;
  user?: {
    id: string;
    email: string;
    fullName: string;
    employeeId?: string;
    position?: string;
    department?: { id: string; name: string; code?: string };
  };
}

export const normalizeAttendance = (raw: RawAttendance): AttendanceRecord => {
  const checkInTime = raw.checkIn ?? undefined;
  const checkOutTime = raw.checkOut ?? undefined;
  const statusLower = raw.status?.toLowerCase();
  const status =
    statusLower && isAttendanceStatus(statusLower) ? statusLower : undefined;

  const user: UserInfo | undefined = raw.user
    ? {
        id: raw.user.id,
        email: raw.user.email,
        fullName: raw.user.fullName,
        employeeId: raw.user.employeeId,
        position: raw.user.position,
        department: raw.user.department
          ? {
              id: raw.user.department.id,
              name: raw.user.department.name,
              code: raw.user.department.code,
            }
          : undefined,
      }
    : undefined;

  return {
    id: raw.id,
    date:
      raw.date ??
      toLocalDateIso(raw.createdAt ? new Date(raw.createdAt) : new Date()),
    status: status ?? (checkInTime ? "present" : "pending"),
    workType: raw.workMode as WorkType | undefined,
    user,
    isLocationValid: raw.isLocationValid ?? null,
    checkIn: checkInTime
      ? {
          time: checkInTime,
          photoUrl: raw.photoIn_url ?? undefined,
          lat: raw.latitudeIn ?? null,
          lng: raw.longitudeIn ?? null,
          locationId: "",
          locationName: raw.metadata?.checkInGeo?.locationName,
          note: raw.note ?? undefined,
          gpsAccuracy: raw.gpsAccuracyIn ?? undefined,
          deviceInfo: raw.deviceInfo ?? undefined,
        }
      : undefined,
    checkOut: checkOutTime
      ? {
          time: checkOutTime,
          photoUrl: raw.photoOut_url ?? undefined,
          lat: raw.latitudeOut ?? null,
          lng: raw.longitudeOut ?? null,
          locationId: "",
          locationName: raw.metadata?.checkOutGeo?.locationName,
          note: undefined,
          gpsAccuracy: raw.gpsAccuracyOut ?? undefined,
          deviceInfo: raw.deviceInfo ?? undefined,
        }
      : undefined,
  };
};

// `/attendance/today` membungkus record di `data.attendance`, sedangkan
// check-in dan check-out mengembalikan record langsung di `data`.
const extractAttendance = (
  data: Record<string, unknown> | null | undefined,
): RawAttendance | null => {
  if (!data) return null;
  const candidate = (data as { attendance?: RawAttendance }).attendance;
  if (candidate && typeof candidate === "object" && "id" in candidate) {
    return candidate;
  }
  if ("id" in data) return data as unknown as RawAttendance;
  return null;
};

export const AttendancesApi = {
  getToday: async (): Promise<TodayResponse> => {
    const res = await AxiosApiService.get("/attendance/today");
    const body = res.data as {
      success: boolean;
      message?: string;
      data: Record<string, unknown> | null;
    };
    const raw = extractAttendance(body.data);
    const extra = (body.data ?? {}) as Pick<
      TodayResponse,
      "state" | "shift" | "activePermission" | "unresolvedSession"
    >;
    return {
      success: body.success,
      data: raw ? normalizeAttendance(raw) : null,
      state: extra.state,
      shift: extra.shift ?? null,
      activePermission: extra.activePermission ?? null,
      unresolvedSession: extra.unresolvedSession,
    };
  },

  listMe: async (): Promise<HistoryResponse> => {
    const res = await AxiosApiService.get("/attendance/my/history");
    const body = res.data as {
      success: boolean;
      message?: string;
      data: RawAttendance[];
    };
    return {
      success: body.success,
      data: Array.isArray(body.data) ? body.data.map(normalizeAttendance) : [],
    };
  },

  checkIn: async (payload: CheckInPayload): Promise<TodayResponse> => {
    const res = await AxiosApiService.post("/attendance/check-in", payload);
    const body = res.data as {
      success: boolean;
      message?: string;
      data: Record<string, unknown> | null;
    };
    const raw = extractAttendance(body.data);
    return {
      success: body.success,
      data: raw ? normalizeAttendance(raw) : null,
    };
  },

  checkOut: async (payload: CheckOutPayload): Promise<TodayResponse> => {
    const res = await AxiosApiService.post("/attendance/check-out", payload);
    const body = res.data as {
      success: boolean;
      message?: string;
      data: Record<string, unknown> | null;
    };
    const raw = extractAttendance(body.data);
    return {
      success: body.success,
      data: raw ? normalizeAttendance(raw) : null,
    };
  },
};
