import { NotificationsApi } from "@shared/api/notification.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useMarkReadNotification = () => {
  const qc = useQueryClient();

  const {
    mutateAsync: markReadNotif,
    isSuccess,
    isPending,
    isError,
    error,
  } = useMutation({
    mutationKey: ["mark-read"],
    mutationFn: async (id: string) => {
      return await NotificationsApi.markRead(id);
    },

    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["notifications-all"],
      });

      qc.invalidateQueries({
        queryKey: ["notification-unread-count"],
      });
    },
  });

  return {
    markReadNotif,
    isSuccess,
    isPending,
    isError,
    error,
  };
};
