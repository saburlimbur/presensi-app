export const PERMISSION_LABEL: Record<string, string> = {
  HALF_DAY: "Setengah Hari",
  WORK_FROM_HOME: "Work From Home",
  ANNUAL_LEAVE: "Cuti Tahunan",
  SICK: "Sakit",
  PERMIT: "Izin",
  MATERNITY_LEAVE: "Cuti Melahirkan",
  PATERNITY_LEAVE: "Cuti Mendampingi",
  MARRIAGE_LEAVE: "Cuti Menikah",
  BEREAVEMENT: "Cuti Duka",
  OTHER: "Izin",
};

const LEAVE_LIKE_TYPES = new Set([
  "SICK",
  "PERMIT",
  "ANNUAL_LEAVE",
  "MATERNITY_LEAVE",
  "PATERNITY_LEAVE",
  "MARRIAGE_LEAVE",
  "BEREAVEMENT",
  "OTHER",
]);

export const isLeaveLikePermission = (type?: string) =>
  !!type && LEAVE_LIKE_TYPES.has(type);

export const isHalfDayPermission = (type?: string) => type === "HALF_DAY";

export const isWfhPermission = (type?: string) => type === "WORK_FROM_HOME";

export const permissionLabel = (type?: string) =>
  (type && PERMISSION_LABEL[type]) || "Izin";
