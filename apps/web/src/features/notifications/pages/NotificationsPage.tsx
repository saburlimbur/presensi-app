import { Bell, CheckCheck } from "lucide-react";
import { useListNotification } from "@hooks/notifications/useListNotification";
import { useUnreadCountNotification } from "@hooks/notifications/useUnreadCountNotification";
import { useMarkReadNotification } from "@hooks/notifications/useMarkReadNotification";
import { useMarkAllReadNotification } from "@hooks/notifications/useMarkAllReadNotification";
import { timeAgo } from "@shared/utils/date";
import { getNotificationIcon } from "@shared/utils/notification-icon";

const NotificationsPage = () => {
  const { notificationList, isLoading } = useListNotification({ limit: 50 });
  const { unreadCount = 0 } = useUnreadCountNotification();
  const { markReadNotif } = useMarkReadNotification();
  const { markAllRead, isPending: markingAll } = useMarkAllReadNotification();

  const notifs = notificationList?.data ?? [];

  return (
    <div className="mt-2 mb-10">
      <div className="mb-3 flex items-center justify-between px-1">
        <div className="min-w-0">
          <h1 className="text-[18px] font-semibold tracking-tight text-slate-900">
            Notifikasi
          </h1>
          <p className="mt-0.5 text-[12px] text-slate-500">
            {unreadCount > 0
              ? `${unreadCount} belum dibaca`
              : "Semua sudah dibaca"}
          </p>
        </div>
        <button
          onClick={() => markAllRead()}
          disabled={markingAll || unreadCount === 0}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11.5px] font-medium text-brand transition-colors hover:bg-slate-50 disabled:opacity-40"
        >
          <CheckCheck size={14} />
          Tandai semua
        </button>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-12 text-center text-[12.5px] text-slate-400">
          Memuat notifikasi…
        </div>
      ) : notifs.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-16 text-center">
          <Bell size={26} className="text-slate-300" strokeWidth={1.8} />
          <p className="text-[13px] text-slate-500">Belum ada notifikasi.</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {notifs.map((n) => {
            const unread = n.readAt === null;
            return (
              <li key={n.id}>
                <button
                  onClick={() => {
                    if (unread) markReadNotif(n.id);
                  }}
                  className={`flex w-full items-start gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50 ${
                    unread ? "bg-brand/[0.03]" : ""
                  }`}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100">
                    {getNotificationIcon(n.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p
                        className={`text-[13.5px] tracking-tight ${
                          unread
                            ? "font-semibold text-slate-900"
                            : "font-medium text-slate-600"
                        }`}
                      >
                        {n.title}
                      </p>
                      <span className="shrink-0 text-[10.5px] tabular-nums text-slate-400">
                        {timeAgo(n.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] leading-snug text-slate-500">
                      {n.body}
                    </p>
                  </div>
                  {unread && (
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand"
                      aria-hidden
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPage;
