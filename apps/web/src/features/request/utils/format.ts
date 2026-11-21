import type { PermissionType } from "@features/request/@types";

export const permissionTypeLabel: Record<PermissionType, string> = {
  SICK: "Sakit",
  PERMIT: "Izin",
  ANNUAL_LEAVE: "Cuti Tahunan",
  MATERNITY_LEAVE: "Cuti Melahirkan",
  PATERNITY_LEAVE: "Cuti Suami Mendampingi",
  MARRIAGE_LEAVE: "Cuti Menikah",
  BEREAVEMENT: "Cuti Duka Cita",
  HALF_DAY: "Setengah Hari",
  WORK_FROM_HOME: "Work From Home",
  OTHER: "Lainnya",
};

export const PERMISSION_TYPE_OPTIONS: PermissionType[] = [
  "SICK",
  "PERMIT",
  "ANNUAL_LEAVE",
  "WORK_FROM_HOME",
  "HALF_DAY",
  "MATERNITY_LEAVE",
  "PATERNITY_LEAVE",
  "MARRIAGE_LEAVE",
  "BEREAVEMENT",
  "OTHER",
];

export const permissionTypeHint: Partial<Record<PermissionType, string>> = {
  SICK: "Lampirkan surat dokter bila ada.",
  ANNUAL_LEAVE: "Memotong saldo cuti tahunan.",
  WORK_FROM_HOME: "Bekerja dari rumah, tidak memotong saldo cuti.",
  HALF_DAY: "Hanya untuk setengah hari kerja.",
  MATERNITY_LEAVE: "Cuti melahirkan, sertakan surat dokter bila ada.",
  PATERNITY_LEAVE: "Cuti pendampingan istri melahirkan.",
  MARRIAGE_LEAVE: "Cuti pernikahan, sertakan undangan bila perlu.",
  BEREAVEMENT: "Cuti karena berduka, lampirkan dokumen pendukung bila ada.",
  PERMIT: "Izin kepentingan personal.",
  OTHER: "Pilih bila tidak tersedia kategori yang sesuai.",
};

const indonesianMonth = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

const fullMonth = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const fmtDateShort = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getDate()} ${indonesianMonth[d.getMonth()]} ${d.getFullYear()}`;
};

export const fmtDateLong = (iso: string): string => {
  const d = new Date(iso);
  return `${d.getDate()} ${fullMonth[d.getMonth()]} ${d.getFullYear()}`;
};

export const fmtDateRange = (startIso: string, endIso: string): string => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate()
  ) {
    return fmtDateShort(startIso);
  }
  if (
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth()
  ) {
    return `${start.getDate()} – ${end.getDate()} ${indonesianMonth[start.getMonth()]} ${start.getFullYear()}`;
  }
  return `${fmtDateShort(startIso)} – ${fmtDateShort(endIso)}`;
};

export const calcDays = (startIso: string, endIso: string): number => {
  const start = new Date(startIso);
  const end = new Date(endIso);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  const diff = end.getTime() - start.getTime();
  return Math.max(1, Math.round(diff / 86400000) + 1);
};

export const fmtRelativeShort = (iso: string): string => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "baru saja";
  if (diffMin < 60) return `${diffMin}m lalu`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}j lalu`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}h lalu`;
  return fmtDateShort(iso);
};
