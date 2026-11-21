import { useQuery } from "@tanstack/react-query";
import { NotificationsApi } from "@shared/api/notification.api";
import type { NotificationListQuery } from "@shared/@types/notification";

export const useListNotification = (query: NotificationListQuery = {}) => {
  const {
    data: notificationList,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["notifications-all", query],
    queryFn: () => NotificationsApi.list(query),
  });

  return {
    notificationList,
    isLoading,
    isError,
    error,
  };
};
