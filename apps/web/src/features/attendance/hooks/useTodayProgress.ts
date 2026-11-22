import { useEffect, useState } from "react";
import { minutesSince, workMinutes } from "@features/attendance/utils/format";
import type { AttendanceRecord } from "@features/attendance/@types";

// Status sesi hari ini plus jam berjalan, dipakai HomePage dan AttendancePage.
export const useTodayProgress = (
  today: AttendanceRecord | null,
  targetMinutes: number,
) => {
  const hasCheckIn = !!today?.checkIn?.time;
  const hasCheckOut = !!today?.checkOut?.time;
  const isWorking = hasCheckIn && !hasCheckOut;

  // Selama sesi berjalan cukup refresh tiap 30 detik (durasi dalam menit);
  // di luar itu tiap detik supaya jam di layar tidak tertinggal.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), isWorking ? 30_000 : 1_000);
    return () => clearInterval(id);
  }, [isWorking]);

  const workedMinutes =
    today && hasCheckOut
      ? workMinutes(today)
      : hasCheckIn
        ? minutesSince(today?.checkIn?.time)
        : 0;

  return {
    now,
    hasCheckIn,
    hasCheckOut,
    done: hasCheckIn && hasCheckOut,
    workedMinutes,
    progressH: Math.floor(workedMinutes / 60),
    progressM: workedMinutes % 60,
    progressPct: Math.min(100, (workedMinutes / targetMinutes) * 100),
    liveTime: now.toLocaleTimeString("en-GB", {
      timeZone: "Asia/Jakarta",
      hour: "2-digit",
      minute: "2-digit",
    }),
  };
};
