import { useQuery } from "@tanstack/react-query";
import { ShiftsApi } from "@features/schedule/api/shifts.api";

export const useActiveShift = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["shifts", "active", "me"],
    queryFn: ShiftsApi.getActiveMe,
    retry: false,
  });

  return {
    shift: data?.data ?? null,
    isLoading,
    isError,
  };
};
