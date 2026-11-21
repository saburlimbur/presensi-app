import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Crosshair,
  ImageIcon,
  MapPin,
} from "lucide-react";
import { Button } from "@ui/button";
import LocationMap from "@features/attendance/components/LocationMap";
import AttendanceSheet from "@features/attendance/components/AttendanceSheet";
import AttendanceHistorySheet from "@features/attendance/components/AttendanceHistorySheet";
import UnresolvedSessionNotice from "@features/attendance/components/UnresolvedSessionNotice";
import { useTodayResolved } from "@features/attendance/hooks/useTodayResolved";
import { useGeolocation } from "@features/attendance/hooks/useGeolocation";
import { findNearestLocation } from "@features/attendance/utils/geo";
import { useReadLocation } from "@features/attendance/hooks/useReadLocation";
import {
  isHalfDayPermission,
  permissionLabel,
} from "@features/attendance/utils/permission";
import {
  fmtTime,
  locationLabel,
  minutesSince,
  startOfWeek,
  workMinutes,
} from "@features/attendance/utils/format";
import type { AttendanceRecord, AttendanceStatus } from "@features/attendance/@types";

type Filter = "week" | "month";

const pad = (n: number) => String(n).padStart(2, "0");

const AttendancePage = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<AttendanceRecord | null>(
    null,
  );
  const [filter, setFilter] = useState<Filter>("week");

  const {
    today,
    unresolvedSession,
    activePermission,
    isOnLeave,
    targetMinutes,
    historyData,
    isLoading: todayLoading,
    historyLoading,
  } = useTodayResolved();

  const allLogs = useMemo(
    () => (historyData?.data ?? []).filter((r) => r.status !== "absent"),
    [historyData],
  );

  const filteredLogs = useMemo(() => {
    const now = new Date();
    if (filter === "week") {
      const start = startOfWeek(now);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return allLogs.filter((r) => {
        const d = new Date(r.date);
        return d >= start && d < end;
      });
    }
    return allLogs.filter((r) => {
      const d = new Date(r.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });
  }, [allLogs, filter]);

  const { readLocation } = useReadLocation();
  const {
    coords,
    error: geoError,
    loading: geoLoading,
    permission: geoPermission,
    request: requestLocation,
  } = useGeolocation();
  const nearest = useMemo(
    () =>
      coords && readLocation?.data
        ? findNearestLocation(coords, readLocation.data)
        : null,
    [readLocation, coords],
  );

  const hasCheckIn = !!today?.checkIn;
  const hasCheckOut = !!today?.checkOut;
  const ctaMode: "in" | "out" = hasCheckIn && !hasCheckOut ? "out" : "in";
  const done = hasCheckIn && hasCheckOut;

  const isHalfDay = isHalfDayPermission(activePermission?.type);

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const tickMs = hasCheckIn ? 30_000 : 1_000;
    const id = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(id);
  }, [hasCheckIn]);

  const todayMins = hasCheckOut
    ? workMinutes(today!)
    : hasCheckIn
      ? minutesSince(today!.checkIn!.time)
      : 0;
  const progressH = Math.floor(todayMins / 60);
  const progressM = todayMins % 60;
  const progressPct = Math.min(100, (todayMins / targetMinutes) * 100);

  const liveTime = now.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateLabel = now.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const statusLabel = done
    ? "Hari kerja selesai"
    : hasCheckIn
      ? "Sedang bekerja"
      : isOnLeave
        ? "Sedang izin"
        : "Belum check-in";

  const hasMap = !!(coords && nearest?.location);

  return (
    <div className="pb-8">
      <div className="relative h-[52vh] min-h-[360px] max-h-[540px] overflow-hidden rounded-2xl border border-line bg-muted">
        {hasMap ? (
          <LocationMap
            userLat={coords!.lat}
            userLng={coords!.lng}
            officeLat={nearest!.location!.lat}
            officeLng={nearest!.location!.lng}
            radiusMeters={nearest!.location!.radiusMeters}
            className="h-full w-full"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-8 text-center">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-paper-raised text-ink-faint">
              <MapPin size={20} strokeWidth={1.8} />
            </span>
            <p className="max-w-[240px] text-[12.5px] leading-relaxed text-ink-muted">
              {geoLoading
                ? "Mendeteksi lokasi…"
                : (geoError ??
                  "Aktifkan lokasi untuk melihat posisi & radius kantor.")}
            </p>
            {!geoLoading && geoPermission !== "unsupported" && (
              <Button
                type="button"
                size="sm"
                onClick={requestLocation}
                className="mt-1 h-9 gap-1.5 rounded-lg px-4 text-[12.5px] font-semibold"
              >
                <Crosshair size={14} strokeWidth={2.2} />
                {geoPermission === "denied"
                  ? "Coba Aktifkan Lagi"
                  : "Aktifkan Lokasi"}
              </Button>
            )}
          </div>
        )}

        {nearest && (
          <span className="absolute left-3 top-3 z-[3] inline-flex items-center gap-1.5 rounded-full border border-line bg-paper-raised/95 px-2.5 py-1 backdrop-blur-sm">
            <span className="relative flex h-1.5 w-1.5">
              {nearest.inRadius && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/60" />
              )}
              <span
                className={`relative h-1.5 w-1.5 rounded-full ${
                  nearest.inRadius ? "bg-brand" : "bg-destructive"
                }`}
              />
            </span>
            <span className="eyebrow text-ink">
              {nearest.inRadius ? "Dalam radius" : "Luar radius"}
            </span>
          </span>
        )}
      </div>

      <section className="relative z-10 -mt-4 rounded-2xl border border-line bg-paper-raised px-4 pt-4 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="eyebrow">Hari ini</p>
            <p className="mt-1.5 text-[13.5px] font-medium tracking-tight text-ink">
              {dateLabel}
            </p>
          </div>
          <StatusBadge state={done ? "done" : hasCheckIn ? "active" : "idle"} />
        </div>

        {unresolvedSession && (
          <UnresolvedSessionNotice
            session={unresolvedSession}
            canCheckIn={!todayLoading && !hasCheckIn}
            className="mt-4"
          />
        )}

        {activePermission && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-2.5">
            <CalendarClock size={14} className="shrink-0 text-brand" />
            <p className="text-[12px] font-medium text-brand">
              {permissionLabel(activePermission.type)} aktif hari ini
              {isHalfDay && (
                <span className="font-normal text-brand/70">
                  {" "}
                  · target kerja 4 jam
                </span>
              )}
            </p>
          </div>
        )}

        <h2 className="mt-4 text-[12.5px] font-medium tracking-tight text-ink-muted">
          {statusLabel}
        </h2>
        <div className="mt-0.5 flex items-end gap-2 display">
          {hasCheckIn ? (
            <>
              <span className="text-[34px] font-semibold leading-[0.85] text-ink">
                {pad(progressH)}
              </span>
              <span className="mb-1 eyebrow">jam</span>
              <span className="text-[34px] font-semibold leading-[0.85] text-ink">
                {pad(progressM)}
              </span>
              <span className="mb-1 eyebrow">menit</span>
            </>
          ) : (
            <>
              <span className="text-[34px] font-semibold leading-[0.85] text-ink">
                {liveTime}
              </span>
              <span className="mb-1 eyebrow">WIB</span>
            </>
          )}
        </div>

        {hasCheckIn && (
          <div className="mt-3">
            <div className="flex items-center justify-between eyebrow text-ink-muted">
              <span>Progress {targetMinutes / 60} Jam</span>
              <span className="display text-ink">
                {Math.round(progressPct)}%
              </span>
            </div>
            <div className="mt-2 h-[3px] w-full overflow-hidden bg-line">
              <div
                className="h-full bg-brand transition-[width] duration-700 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 divide-x divide-line border-y border-line">
          <TimeCell
            label="Check-in"
            value={hasCheckIn ? (fmtTime(today?.checkIn?.time) ?? "—") : "—"}
            active={hasCheckIn}
          />
          <TimeCell
            label="Check-out"
            value={hasCheckOut ? (fmtTime(today?.checkOut?.time) ?? "—") : "—"}
            active={hasCheckOut}
            live={hasCheckIn && !hasCheckOut}
          />
        </div>

        <div className="mt-4">
          {todayLoading ? (
            <Button disabled className="h-12 w-full rounded-xl">
              Memuat…
            </Button>
          ) : done ? (
            <div className="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-soft text-[14px] font-semibold text-brand">
              <CheckCircle2 size={16} />
              Absensi hari ini selesai
            </div>
          ) : isOnLeave ? (
            <div className="flex h-12 items-center justify-center gap-2 rounded-xl bg-muted text-[14px] font-semibold text-ink-muted">
              <CalendarClock size={16} />
              Tidak perlu check-in hari ini
            </div>
          ) : (
            <Button
              onClick={() => setSheetOpen(true)}
              className="h-12 w-full rounded-xl text-[15px] font-semibold tracking-tight"
            >
              {ctaMode === "in" ? "Check-In Sekarang" : "Check-Out Sekarang"}
            </Button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-soft text-brand">
            <MapPin size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold tracking-tight text-ink">
              {nearest?.location?.name ?? "—"}
            </p>
            <p className="truncate text-[12px] text-ink-muted">
              {nearest?.location
                ? `${Math.round(nearest.distance)} m dari kamu · radius ${nearest.location.radiusMeters} m`
                : "Aktifkan GPS untuk cek radius"}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <p className="eyebrow">Riwayat</p>
          <SegmentedTabs<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: "week", label: "Minggu" },
              { value: "month", label: "Bulan" },
            ]}
          />
        </div>

        <ul className="overflow-hidden rounded-2xl border border-line bg-paper-raised divide-y divide-line">
          {historyLoading ? (
            <li className="px-5 py-10 text-center text-[13px] text-ink-faint">
              Memuat…
            </li>
          ) : filteredLogs.length === 0 ? (
            <li className="px-5 py-10 text-center text-[13px] text-ink-faint">
              Belum ada catatan
            </li>
          ) : (
            filteredLogs.map((r) => (
              <HistoryItem
                key={r.id}
                record={r}
                onClick={() => setDetailRecord(r)}
              />
            ))
          )}
        </ul>
      </section>

      <AttendanceSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        mode={ctaMode}
      />

      <AttendanceHistorySheet
        open={!!detailRecord}
        onOpenChange={(o) => !o && setDetailRecord(null)}
        record={detailRecord}
      />
    </div>
  );
};

const StatusBadge = ({ state }: { state: "idle" | "active" | "done" }) => {
  if (state === "active") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1">
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-60" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
        </span>
        <span className="eyebrow text-brand">Bekerja</span>
      </span>
    );
  }
  if (state === "done") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
        <CheckCircle2 size={12} className="text-ink-muted" />
        <span className="eyebrow text-ink-muted">Selesai</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1">
      <span className="h-1.5 w-1.5 rounded-full bg-ink-faint" />
      <span className="eyebrow text-ink-muted">Menunggu</span>
    </span>
  );
};

const TimeCell = ({
  label,
  value,
  active,
  live,
}: {
  label: string;
  value: string;
  active?: boolean;
  live?: boolean;
}) => {
  return (
    <div className="px-1 py-3 first:pl-0 last:pl-4">
      <div className="flex items-center gap-1.5">
        <p className="eyebrow">{label}</p>
        {live && (
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-50" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand" />
          </span>
        )}
      </div>
      <p
        className={`mt-1.5 display text-[16px] font-semibold leading-none tabular-nums ${
          active ? "text-ink" : "text-ink-faint"
        }`}
      >
        {value}
      </p>
    </div>
  );
};

const HistoryItem = ({
  record,
  onClick,
}: {
  record: AttendanceRecord;
  onClick: () => void;
}) => {
  const date = new Date(record.date);
  const dayNum = date.getDate();
  const monthShort = date.toLocaleDateString("id-ID", { month: "short" });
  const status = statusFor(record.status);
  const photo = record.checkIn?.photoUrl;
  const locationName = locationLabel(record);

  return (
    <li
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/40 active:bg-muted"
    >
      <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-paper">
        <span className="eyebrow leading-none">{monthShort}</span>
        <span className="mt-1 display text-[18px] font-semibold leading-none tabular-nums text-ink">
          {dayNum}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="display text-[14px] font-medium tabular-nums text-ink">
          {fmtTime(record.checkIn?.time)}
          <span className="mx-1 text-ink-faint">→</span>
          {record.checkOut ? fmtTime(record.checkOut.time) : "—"}
        </p>
        <div className="mt-1 flex items-center gap-1.5 text-[12px] text-ink-muted">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">{locationName}</span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {photo ? (
          <img
            src={photo}
            alt=""
            className="h-9 w-9 rounded-lg border border-line object-cover"
          />
        ) : (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-paper text-ink-faint">
            <ImageIcon size={14} />
          </div>
        )}
        <div className="flex flex-col items-end gap-1">
          <span className={status.className}>{status.label}</span>
          <ChevronRight size={14} className="text-ink-faint" />
        </div>
      </div>
    </li>
  );
};

const SegmentedTabs = <T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) => {
  return (
    <div className="inline-flex rounded-lg border border-line bg-paper p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-1 text-[12px] font-medium transition-colors ${
            value === opt.value
              ? "bg-brand text-paper"
              : "text-ink-muted hover:text-ink"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

const statusFor = (s: AttendanceStatus) => {
  const base =
    "inline-flex items-center h-5 px-1.5 rounded text-[10px] font-semibold";
  switch (s) {
    case "present":
      return {
        label: "Tepat waktu",
        className: `${base} bg-brand-soft text-brand`,
      };
    case "late":
      return {
        label: "Telat",
        className: `${base} bg-amber-50 text-amber-700`,
      };
    case "pending":
      return {
        label: "Pending",
        className: `${base} bg-muted text-ink-muted`,
      };
    default:
      return {
        label: "Izin",
        className: `${base} bg-muted text-ink-muted`,
      };
  }
};

export default AttendancePage;
