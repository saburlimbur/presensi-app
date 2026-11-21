import { useQuery } from "@tanstack/react-query";
import { AttendancesApi } from "@features/attendance/api/attendance.api";

export const useMyHistory = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["attendance", "history"],
    queryFn: AttendancesApi.listMe,
  });

  return { data, isLoading, isError };
};
