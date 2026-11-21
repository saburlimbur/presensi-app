import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AttendancesApi } from "@features/attendance/api/attendance.api";
import type { CheckOutPayload } from "@features/attendance/@types";

export const useCheckOut = () => {
  const qc = useQueryClient();

  const { mutateAsync: checkOut, isPending } = useMutation({
    mutationFn: (payload: CheckOutPayload) => AttendancesApi.checkOut(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["attendance", "today"] });
      qc.invalidateQueries({ queryKey: ["attendance", "history"] });
    },
  });

  return { checkOut, isPending };
};
