import { useQuery } from "@tanstack/react-query";
import { AttendancesApi } from "@features/attendance/api/attendance.api";

export const useGetAttendance = () => {
  const {
    data: myAttendance,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["attendance", "today"],
    queryFn: AttendancesApi.getToday,
  });

  return { myAttendance, isLoading, isError };
};
