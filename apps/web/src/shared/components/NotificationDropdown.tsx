import { Bell } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@ui/dropdown-menu";
import { useListNotification } from "@hooks/notifications/useListNotification";
import { useUnreadCountNotification } from "@hooks/notifications/useUnreadCountNotification";
import { useMarkReadNotification } from "@hooks/notifications/useMarkReadNotification";
import { useMarkAllReadNotification } from "@hooks/notifications/useMarkAllReadNotification";
import { timeAgo } from "@shared/utils/date";
import { getNotificationIcon } from "@shared/utils/notification-icon";
import { useNavigate } from "react-router-dom";

const NotificationDropdown = () => {
  const navigate = useNavigate();
  const { notificationList, isLoading } = useListNotification({ limit: 5 });
  const { unreadCount = 0 } = useUnreadCountNotification();
  const { markReadNotif } = useMarkReadNotification();
  const { markAllRead, isPending: isMarkingAll } = useMarkAllReadNotification();

  const items = notificationList?.data ?? [];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Notifications"
        className="relative flex items-center justify-center w-8 h-8 rounded-full border border-line bg-paper-raised hover:bg-muted active:scale-95 transition"
      >
        <Bell size={15} className="text-ink-muted" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-brand text-white text-[9px] font-semibold flex items-center justify-center border-2 border-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={14}
        alignOffset={-4}
        className="w-[320px] max-w-[92vw] rounded-2xl p-0 overflow-hidden shadow-lg shadow-ink/10"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-line">
          <div className="min-w-0">
            <h4 className="text-[13px] font-semibold text-ink">
              Notifikasi
            </h4>
            <p className="text-[11px] text-ink-muted mt-0.5">
              {unreadCount} belum dibaca
            </p>
          </div>

          <button
            onClick={() => markAllRead()}
            disabled={isMarkingAll || unreadCount === 0}
            className="text-[11px] font-medium text-ink-muted shrink-0 disabled:opacity-40"
          >
            Tandai baca
          </button>
        </div>

        <div className="max-h-[340px] overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <div className="px-4 py-6 text-[12px] text-ink-faint text-center">
              Memuat…
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-6 text-[12px] text-ink-faint text-center">
              Belum ada notifikasi
            </div>
          ) : (
            items.map((notif, index) => {
              const isUnread = notif.readAt === null;
              return (
                <div key={notif.id}>
                  <button
                    onClick={() => {
                      if (isUnread) markReadNotif(notif.id);
                    }}
                    className={`w-full px-4 py-3 flex gap-3 text-left overflow-hidden active:bg-muted transition ${
                      isUnread ? "bg-brand/[0.03]" : ""
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      {getNotificationIcon(notif.type)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-[13px] font-medium text-ink leading-5 truncate">
                          {notif.title}
                        </h5>

                        <span className="text-[10px] text-ink-faint shrink-0">
                          {timeAgo(notif.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11.5px] text-ink-muted leading-5 mt-0.5 line-clamp-2 break-words">
                        {notif.body}
                      </p>
                    </div>
                  </button>

                  {index !== items.length - 1 && (
                    <div className="h-px bg-muted ml-12" />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="border-t border-line p-2">
          <button
            onClick={() => navigate("/notifications")}
            className="w-full h-9 rounded-xl text-[12px] font-medium text-ink-muted active:bg-muted transition"
          >
            Lihat semua
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
