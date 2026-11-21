import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@features/auth/store/auth.store";
import { NotificationsApi } from "@shared/api/notification.api";
import { SSE_EVENTS } from "@shared/@types/notification";
import { playNotificationSound } from "@shared/utils/notification-sound";

export const useNotificationStream = (enabled: boolean) => {
  const qc = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  useEffect(() => {
    if (!enabled || !accessToken) return;

    const refresh = () => {
      qc.invalidateQueries({
        queryKey: ["notifications-all"],
      });
      qc.invalidateQueries({
        queryKey: ["notification-unread-count"],
      });
      qc.invalidateQueries({
        queryKey: ["my-permission-request"],
      });
      qc.invalidateQueries({
        queryKey: ["my-leave-balance"],
      });
    };

    const stream = NotificationsApi.openStream(accessToken, {
      onEvent: (eventName) => {
        if (eventName === SSE_EVENTS.CONNECTED) return;
        playNotificationSound();
        if (eventName === SSE_EVENTS.PERMISSION_DECIDED) refresh();
      },
      onReconnect: refresh,
    });

    return () => stream.close();
  }, [enabled, accessToken, qc]);
};
