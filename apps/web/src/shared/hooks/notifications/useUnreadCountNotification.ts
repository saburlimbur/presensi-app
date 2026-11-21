import { NotificationsApi } from "@shared/api/notification.api";
import { useQuery } from "@tanstack/react-query";

export const useUnreadCountNotification = () => {
  const {
    data: unreadCount,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["notification-unread-count"],

    queryFn: async () => {
      const res = await NotificationsApi.getUnreadCount();

      return res.data.unread;
    },

    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });

  return { unreadCount, isLoading, isError, error };
};
