import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  ClipboardList,
  FileEdit,
  MapPin,
} from "lucide-react";
import { Button } from "@ui/button";
import { useTodayResolved } from "@features/attendance/hooks/useTodayResolved";
import { useTodayProgress } from "@features/attendance/hooks/useTodayProgress";
import UnresolvedSessionNotice from "@features/attendance/components/UnresolvedSessionNotice";
import { permissionLabel } from "@features/attendance/utils/permission";
import {
  fmtTime,
  locationLabel,
} from "@features/attendance/utils/format";
import { useListNotification } from "@hooks/notifications/useListNotification";
import { useUnreadCountNotification } from "@hooks/notifications/useUnreadCountNotification";
import { useListMyLeaveBalance } from "@features/request/hooks/useListMyLeaveBalance";
import { useListMyPermission } from "@features/request/hooks/useListMyPermission";
import { useActiveShift } from "@features/schedule/hooks/useActiveShift";
import { timeAgo } from "@shared/utils/date";

const pad = (n: number) => String(n).padStart(2, "0");

const shiftProgressPct = (start: string, end: string): number => {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const s = sh * 60 + sm;
  let e = eh * 60 + em;
  const overnight = e <= s;
  if (overnight) e += 24 * 60;
  const current = overnight && nowMin < s ? nowMin + 24 * 60 : nowMin;
  if (current <= s) return 0;
  if (current >= e) return 100;
  return ((current - s) / (e - s)) * 100;
};

const HomePage = () => {
  const navigate = useNavigate();
  const {
    today,
    unresolvedSession,
    activePermission,
    isOnLeave,
    targetMinutes,
    isLoading: attendanceLoading,
  } = useTodayResolved();
  const { notificationList, isLoading: notifLoading } = useListNotification({
    limit: 4,
  });
  const { unreadCount = 0 } = useUnreadCountNotification();
  const notifs = notificationList?.data ?? [];

  const {
    now,
    hasCheckIn: hasIn,
    hasCheckOut: hasOut,
    done,
    progressH,
    progressM,
    progressPct,
    liveTime,
  } = useTodayProgress(today, targetMinutes);

  const todayDateLabel = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  const checkInDisplay = hasIn ? (fmtTime(today!.checkIn!.time) ?? "—") : "—";
  const checkOutDisplay = hasOut
    ? (fmtTime(today!.checkOut!.time) ?? "—")
    : "—";
  const locationName = today ? locationLabel(today) : "—";

  const ctaLabel =
    attendanceLoading || isOnLeave
    ? null
    : !hasIn
      ? "Check-In Sekarang"
      : !hasOut
        ? "Check-Out Sekarang"
        : null;

  const stateInfo = attendanceLoading
    ? {
        label: "Memuat status",
        sublabel: "Mengambil data absensi hari ini.",
        badge: "Memuat",
        live: false,
      }
    : done
      ? {
          label: "Hari kerja selesai",
          sublabel: `Total ${progressH}j ${progressM}m di ${locationName}.`,
          badge: "Selesai",
          live: false,
        }
      : hasIn
        ? {
            label: "Sedang bekerja",
            sublabel: `Berjalan di ${locationName}.`,
            badge: "Bekerja",
            live: true,
          }
        : isOnLeave
          ? {
              label: "Sedang izin",
              sublabel: `${permissionLabel(activePermission?.type)} aktif hari ini. Tidak perlu check-in.`,
              badge: "Izin",
              live: false,
            }
          : {
            label: "Belum check-in",
            sublabel: "Catat kehadiran untuk memulai hari kerja.",
            badge: "Menunggu",
            live: false,
          };

  return (
    <div className="mt-3 mb-12">
      <section>
        <div className="flex items-center justify-between">
          <p className="eyebrow capitalize">{todayDateLabel}</p>
          <span className="inline-flex items-center gap-2 eyebrow text-ink">
            <span className="relative flex h-1.5 w-1.5">
              {stateInfo.live && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/60" />
              )}
              <span
                className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                  stateInfo.live ? "bg-brand" : "bg-ink-faint"
                }`}
              />
            </span>
            {stateInfo.badge}
          </span>
        </div>

        <h2 className="mt-5 text-[15px] font-medium tracking-tight text-ink-muted">
          {stateInfo.label}
        </h2>

        <div className="mt-1 flex items-end gap-2.5 display">
          {hasIn ? (
            <>
              <span className="text-[68px] font-semibold leading-[0.82] text-ink">
                {pad(progressH)}
              </span>
              <span className="mb-2.5 eyebrow">jam</span>
              <span className="text-[68px] font-semibold leading-[0.82] text-ink">
                {pad(progressM)}
              </span>
              <span className="mb-2.5 eyebrow">menit</span>
            </>
          ) : (
            <>
              <span className="text-[68px] font-semibold leading-[0.82] text-ink">
                {liveTime}
              </span>
              <span className="mb-2.5 eyebrow">WIB</span>
            </>
          )}
        </div>

        <div className="rule mt-6" />

        <p className="mt-4 text-[13px] leading-relaxed text-ink-muted">
          {stateInfo.sublabel}
        </p>

        {unresolvedSession && (
          <UnresolvedSessionNotice
            session={unresolvedSession}
            canCheckIn={!attendanceLoading && !hasIn}
            className="mt-4"
          />
        )}

        {hasIn && (
          <div className="mt-5">
            <div className="flex items-center justify-between eyebrow text-ink-muted">
              <span>Progress {targetMinutes / 60} Jam</span>
              <span className="display text-ink">{Math.round(progressPct)}%</span>
            </div>
            <div className="mt-2.5 h-[3px] w-full overflow-hidden bg-line">
              <div
                className="h-full bg-brand transition-[width] duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        {ctaLabel && (
          <Button
            onClick={() => navigate("/attendance")}
            className="mt-6 h-13 w-full rounded-xl text-[14px] font-semibold tracking-tight"
          >
            {ctaLabel}
            <ArrowRight size={17} className="ml-1.5" strokeWidth={2.4} />
          </Button>
        )}
      </section>

      <div className="mt-7 grid grid-cols-3 divide-x divide-line border-y border-line">
        <StatCell label="Masuk" value={checkInDisplay} active={hasIn} />
        <StatCell
          label="Keluar"
          value={checkOutDisplay}
          active={hasOut}
          live={hasIn && !hasOut}
        />
        <StatCell label="Lokasi" value={locationName} truncate />
      </div>

      <section className="mt-8">
        <p className="eyebrow mb-3">Pintasan</p>
        <div className="grid grid-cols-4 gap-px overflow-hidden rounded-2xl border border-line bg-line">
          <QuickAction
            icon={ClipboardList}
            label="Riwayat"
            onClick={() => navigate("/attendance")}
          />
          <QuickAction
            icon={FileEdit}
            label="Izin"
            onClick={() => navigate("/request")}
          />
          <QuickAction
            icon={CalendarDays}
            label="Jadwal"
            onClick={() => navigate("/schedule")}
          />
          <QuickAction
            icon={MapPin}
            label="Lokasi"
            onClick={() => navigate("/attendance")}
          />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <ShiftCard onClick={() => navigate("/schedule")} />
        <CutiCard onClick={() => navigate("/request")} />
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="eyebrow">Notifikasi</p>
            {unreadCount > 0 && (
              <span className="inline-flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-brand px-1.5 text-[10px] font-bold tabular-nums text-paper">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={() => navigate("/notifications")}
            className="eyebrow text-brand hover:text-brand-bright"
          >
            Lihat semua
          </button>
        </div>

        {notifLoading ? (
          <div className="rounded-2xl border border-line bg-paper-raised px-4 py-10 text-center text-[12.5px] text-ink-faint">
            Memuat notifikasi…
          </div>
        ) : notifs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-line bg-paper-raised px-4 py-12 text-center">
            <Bell size={22} className="text-ink-faint" strokeWidth={1.6} />
            <p className="text-[12.5px] text-ink-muted">Belum ada notifikasi.</p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-line bg-paper-raised divide-y divide-line">
            {notifs.map((n, i) => {
              const unread = n.readAt === null;
              return (
                <li key={n.id}>
                  <button
                    onClick={() => navigate("/notifications")}
                    className="flex w-full items-start gap-3.5 px-4 py-4 text-left transition hover:bg-muted/40"
                  >
                    <span className="mt-0.5 display text-[11px] font-semibold text-ink-faint tabular-nums">
                      {pad(i + 1)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-[13px] tracking-tight ${
                            unread
                              ? "font-semibold text-ink"
                              : "font-medium text-ink-muted"
                          }`}
                        >
                          {n.title}
                        </p>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="display text-[10px] tabular-nums text-ink-faint">
                            {timeAgo(n.createdAt)}
                          </span>
                          {unread && (
                            <span
                              className="h-1.5 w-1.5 rounded-full bg-brand"
                              aria-hidden
                            />
                          )}
                        </div>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[12px] leading-snug text-ink-muted">
                        {n.body}
                      </p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

const StatCell = ({
  label,
  value,
  active,
  live,
  truncate,
}: {
  label: string;
  value: string;
  active?: boolean;
  live?: boolean;
  truncate?: boolean;
}) => {
  return (
    <div className="px-3 py-3.5 first:pl-0">
      <div className="flex items-center gap-1.5">
        <p className="eyebrow">{label}</p>
        {live && (
          <span
            className="h-1 w-1 animate-pulse rounded-full bg-brand"
            aria-hidden
          />
        )}
      </div>
      <p
        className={`mt-1.5 display text-[15px] font-semibold tracking-tight ${
          truncate ? "truncate" : "tabular-nums"
        } ${active === false ? "text-ink-faint" : "text-ink"}`}
        title={truncate ? value : undefined}
      >
        {value}
      </p>
    </div>
  );
};

const QuickAction = ({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Bell;
  label: string;
  onClick: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-center gap-2.5 bg-paper-raised px-2 py-4 transition hover:bg-muted/40 active:bg-muted"
    >
      <Icon
        size={19}
        strokeWidth={1.8}
        className="text-ink transition group-hover:text-brand"
      />
      <span className="text-[10.5px] font-medium tracking-tight text-ink-muted">
        {label}
      </span>
    </button>
  );
};

const ShiftCard = ({ onClick }: { onClick: () => void }) => {
  const { shift } = useActiveShift();
  const start = shift?.startTime || "—";
  const end = shift?.endTime || "—";
  const pct =
    shift?.startTime && shift?.endTime
      ? shiftProgressPct(shift.startTime, shift.endTime)
      : 0;

  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-2xl bg-brand p-4 text-left text-paper transition active:scale-[0.99]"
    >
      <div className="flex items-center justify-between">
        <p className="eyebrow text-paper/55">Shift Hari Ini</p>
      </div>

      <p className="mt-3 display text-[24px] font-semibold tabular-nums tracking-tight">
        {start}
        <span className="mx-1 font-normal text-paper/40">–</span>
        {end}
      </p>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between eyebrow text-paper/55">
          <span>Progress</span>
          <span className="display text-paper/85">{Math.round(pct)}%</span>
        </div>
        <div className="mt-2 h-[3px] w-full overflow-hidden bg-paper/15">
          <div className="h-full bg-paper/90" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-paper/65">
          <CalendarDays size={11} strokeWidth={2.2} />
          <span className="truncate">{shift?.name ?? "Belum ada shift"}</span>
        </div>
      </div>
    </button>
  );
};

const CutiCard = ({ onClick }: { onClick: () => void }) => {
  const { leave_balance } = useListMyLeaveBalance();
  const { permissions } = useListMyPermission();

  const total = leave_balance?.annualQuota ?? 0;
  const remaining = leave_balance?.remainingDays ?? 0;
  const pendingDays = permissions
    .filter((p) => p.status === "PENDING")
    .reduce((sum, p) => sum + (p.totalDays ?? 0), 0);
  const pct = total ? (remaining / total) * 100 : 0;
  const R = 26;
  const C = 2 * Math.PI * R;

  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-2xl border border-line bg-paper-raised p-4 text-left transition active:scale-[0.99]"
    >
      <p className="eyebrow">Saldo Cuti</p>

      <div className="mt-auto flex items-center gap-3 pt-4">
        <div className="relative h-[60px] w-[60px] shrink-0">
          <svg viewBox="0 0 80 80" className="absolute inset-0 -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={R}
              fill="none"
              stroke="#E6E6E3"
              strokeWidth="5"
            />
            <circle
              cx="40"
              cy="40"
              r={R}
              fill="none"
              stroke="#4F7A63"
              strokeWidth="5"
              strokeLinecap="butt"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - pct / 100)}
              className="transition-[stroke-dashoffset] duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="display text-[20px] font-semibold leading-none tabular-nums text-ink">
              {remaining}
            </span>
          </div>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold tracking-tight text-ink">
            dari {total} hari
          </p>
          <p className="mt-1 text-[11px] text-ink-muted">
            {pendingDays > 0 ? `${pendingDays} menunggu` : "Tersisa tahun ini"}
          </p>
        </div>
      </div>
    </button>
  );
};

export default HomePage;
