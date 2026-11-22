import type { AttendanceStatus } from "@features/attendance/@types";

type StatusTone = "success" | "warning" | "danger" | "info" | "muted";

interface StatusMeta {
  label: string;
  tone: StatusTone;
}

// Satu-satunya sumber label status absensi. Key mengikuti enum
// AttendanceStatus di API (huruf kecil), ditambah "pending" untuk hari yang
// belum punya record.
export const ATTENDANCE_STATUS_META: Record<AttendanceStatus, StatusMeta> = {
  present: { label: "Tepat Waktu", tone: "success" },
  late: { label: "Terlambat", tone: "warning" },
  absent: { label: "Tidak Hadir", tone: "danger" },
  sick: { label: "Sakit", tone: "info" },
  permit: { label: "Izin", tone: "info" },
  on_leave: { label: "Cuti", tone: "info" },
  work_from_home: { label: "WFH", tone: "info" },
  holiday: { label: "Libur", tone: "muted" },
  pending: { label: "Belum Absen", tone: "muted" },
};

export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  success: "bg-success-soft text-success-foreground",
  warning: "bg-warning-soft text-warning-foreground",
  danger: "bg-danger-soft text-danger-foreground",
  info: "bg-info-soft text-info-foreground",
  muted: "bg-muted text-ink-muted",
};

export const isAttendanceStatus = (value: string): value is AttendanceStatus =>
  value in ATTENDANCE_STATUS_META;
