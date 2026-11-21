import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AttendancesApi } from "@features/attendance/api/attendance.api";
import type { CheckInPayload } from "@features/attendance/@types";

export const useCheckIn = () => {
  const qc = useQueryClient();

  const { mutateAsync: checkIn, isPending } = useMutation({
    mutationFn: (payload: CheckInPayload) => AttendancesApi.checkIn(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance", "today"] });
      qc.invalidateQueries({ queryKey: ["attendance", "history"] });
    },
  });

  return { checkIn, isPending };
};
