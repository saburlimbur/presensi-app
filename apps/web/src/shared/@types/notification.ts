export type NotificationType =
  | "ATTENDANCE_REMINDER"
  | "ATTENDANCE_CHECK_IN"
  | "ATTENDANCE_CHECK_OUT"
  | "PERMISSION_SUBMITTED"
  | "PERMISSION_APPROVED"
  | "PERMISSION_REJECTED"
  | "ANNOUNCEMENT"
  | "SYSTEM";

export interface NotificationItem {
  id: string;
  userId: string;
  type: NotificationType;

  title: string;
  body: string;

  data: Record<string, unknown> | null;

  readAt: string | null;
  createdAt: string;
}

export interface NotificationListPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationListResponse {
  success: boolean;
  message?: string;
  data: NotificationItem[];
  pagination: NotificationListPagination;
}

export interface UnreadCountResponse {
  success: boolean;
  data: {
    unread: number;
  };
}

export interface NotificationListQuery {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  type?: NotificationType;
}

export const SSE_EVENTS = {
  CONNECTED: "connected",
  PERMISSION_DECIDED: "permission:decided",
  PERMISSION_SUBMITTED: "permission:submitted",
  ATTENDANCE_CHECKED_IN: "attendance:checked_in",
  ATTENDANCE_CHECKED_OUT: "attendance:checked_out",
} as const;
