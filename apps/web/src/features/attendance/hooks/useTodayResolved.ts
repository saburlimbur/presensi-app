import { useMemo } from "react";
import { useGetAttendance } from "@features/attendance/hooks/useGetAttendance";
import { useMyHistory } from "@features/attendance/hooks/useMyHistory";
import {
  isHalfDayPermission,
  isLeaveLikePermission,
  isWfhPermission,
} from "@features/attendance/utils/permission";
import type { AttendanceRecord, UnresolvedSession } from "@features/attendance/@types";


export const useTodayResolved = () => {
  const { myAttendance, isLoading } = useGetAttendance();
  const { data: historyData, isLoading: historyLoading } = useMyHistory();

  const today: AttendanceRecord | null = myAttendance?.data ?? null;

  const unresolvedSession = useMemo<UnresolvedSession | null>(() => {
    if (!myAttendance) return null;
    if (myAttendance.unresolvedSession !== undefined) {
      return myAttendance.unresolvedSession;
    }
    const open = (historyData?.data ?? []).find(
      (r) => r.checkIn && !r.checkOut && r.id !== today?.id,
    );
    if (!open?.checkIn) return null;
    return {
      id: open.id,
      date: open.date,
      checkIn: open.checkIn.time,
      workMode: open.workType,
      expired: true,
    };
  }, [myAttendance, historyData, today]);

  const activePermission = myAttendance?.activePermission ?? null;

  const isOnLeave =
    !today?.checkIn &&
    (myAttendance?.state === "ON_LEAVE" ||
      isLeaveLikePermission(activePermission?.type));

  const isWfhDay =
    myAttendance?.state === "WFH_PENDING_CHECKIN" ||
    isWfhPermission(activePermission?.type);

  const targetMinutes = isHalfDayPermission(activePermission?.type)
    ? 240
    : 480;

  return {
    today,
    todayResponse: myAttendance,
    activePermission,
    isOnLeave,
    isWfhDay,
    targetMinutes,
    unresolvedSession,
    historyData,
    isLoading,
    historyLoading,
  };
};
