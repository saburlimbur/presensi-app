import { fetchEventSource } from "@microsoft/fetch-event-source";
import type { ApiResponse } from "@shared/@types";
import type {
  NotificationItem,
  NotificationListQuery,
  NotificationListResponse,
  UnreadCountResponse,
} from "@shared/@types/notification";
import AxiosApiService, { API_BASE_URL } from "@shared/api/api-service";

export type SseHandle = { close: () => void };

export interface SseHandlers {
  onEvent?: (eventName: string, data: string) => void;
  onReconnect?: () => void;
}

export const NotificationsApi = {
  async list(
    query: NotificationListQuery = {},
  ): Promise<NotificationListResponse> {
    const res = await AxiosApiService.get<NotificationListResponse>(
      "/notifications",
      {
        params: query,
      },
    );

    return res.data;
  },

  async getUnreadCount(): Promise<UnreadCountResponse> {
    const res = await AxiosApiService.get<UnreadCountResponse>(
      "/notifications/unread-count",
    );

    return res.data;
  },

  async markRead(id: string): Promise<ApiResponse<NotificationItem>> {
    const res = await AxiosApiService.patch<ApiResponse<NotificationItem>>(
      `/notifications/${id}/read`,
    );

    return res.data;
  },

  async markAllRead(): Promise<ApiResponse<{ updated: number }>> {
    const res = await AxiosApiService.patch<ApiResponse<{ updated: number }>>(
      "/notifications/read-all",
    );

    return res.data;
  },

  openStream(accessToken: string, handlers: SseHandlers = {}): SseHandle {
    const ctrl = new AbortController();
    let closed = false;

    const RECONNECT_DELAY = 3000;

    const connect = () => {
      if (closed) return;

      fetchEventSource(`${API_BASE_URL}/events/stream`, {
        signal: ctrl.signal,
        headers: { Authorization: `Bearer ${accessToken}` },
        openWhenHidden: true,
        onopen: async (res) => {
          const contentType = res.headers.get("content-type") ?? "";
          if (res.ok && contentType.includes("text/event-stream")) {
            handlers.onReconnect?.();
            return;
          }
          if (res.status === 401) {
            closed = true;
            NotificationsApi.getUnreadCount().catch(() => {});
          }
          throw new Error(
            `SSE gagal konek (status ${res.status}, type "${contentType}")`,
          );
        },
        onmessage: (ev) => {
          if (ev.event) handlers.onEvent?.(ev.event, ev.data);
        },
        onerror: (err) => {
          throw err;
        },
      })
        .then(() => {
          if (!closed) setTimeout(connect, RECONNECT_DELAY);
        })
        .catch(() => {
          if (!closed) setTimeout(connect, RECONNECT_DELAY);
        });
    };

    connect();

    return {
      close: () => {
        closed = true;
        ctrl.abort();
      },
    };
  },
};
