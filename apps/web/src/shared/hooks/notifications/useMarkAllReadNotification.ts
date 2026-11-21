import { NotificationsApi } from "@shared/api/notification.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useMarkAllReadNotification = () => {
  const qc = useQueryClient();

  const {
    mutate: markAllRead,
    isPending,
    isSuccess,
    isError,
    error,
  } = useMutation({
    mutationKey: ["mark-all-read"],
    mutationFn: () => NotificationsApi.markAllRead(),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications-all"] });
      qc.invalidateQueries({ queryKey: ["notification-unread-count"] });
    },
  });

  return { markAllRead, isPending, isSuccess, isError, error };
};
