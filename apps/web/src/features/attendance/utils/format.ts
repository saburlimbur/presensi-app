import type { AttendanceRecord } from "@features/attendance/@types";

export const fmtTime = (iso?: string): string => {
  if (!iso) return "--:--";
  return new Date(iso).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const fmtDateShort = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
  });
};

export const workMinutes = (r: AttendanceRecord): number => {
  if (!r.checkIn?.time || !r.checkOut?.time) return 0;
  const ms =
    new Date(r.checkOut.time).getTime() - new Date(r.checkIn.time).getTime();
  return ms > 0 ? Math.round(ms / 60000) : 0;
};

export const minutesSince = (iso?: string): number => {
  if (!iso) return 0;
  const ms = Date.now() - new Date(iso).getTime();
  return ms > 0 ? Math.round(ms / 60000) : 0;
};

export const locationLabel = (r: AttendanceRecord): string => {
  const name = r.checkIn?.locationName ?? r.checkOut?.locationName;
  if (name) return name;
  return r.workType === "WFA" ? "Work From Anywhere" : "—";
};

export const startOfWeek = (d: Date): Date => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return date;
};
