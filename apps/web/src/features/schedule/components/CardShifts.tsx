import type { ActiveShift } from "@features/schedule/@types";
import { useActiveShift } from "@features/schedule/hooks/useActiveShift";

interface ShiftsListProps {
  currentDate: Date;
  selectedDate: number;
}

const WEEKDAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const durationLabel = (start: string, end: string): string => {
  if (!start || !end) return "—";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let mins = eh * 60 + em - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60;
  return `${Math.floor(mins / 60)}j ${String(mins % 60).padStart(2, "0")}m`;
};

type DayCell = {
  date: Date;
  isWorkday: boolean;
  isSelected: boolean;
  isToday: boolean;
};

const buildWeek = (currentDate: Date, selectedDate: number): DayCell[] => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const selDate = new Date(year, month, selectedDate);
  const dow = selDate.getDay();
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(selDate);
  monday.setDate(monday.getDate() + mondayOffset);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const out: DayCell[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    const day = d.getDay();
    out.push({
      date: d,
      isWorkday: day !== 0 && day !== 6,
      isSelected:
        d.getDate() === selectedDate &&
        d.getMonth() === month &&
        d.getFullYear() === year,
      isToday: d.getTime() === today.getTime(),
    });
  }
  return out;
};

const CardShiftList = ({ currentDate, selectedDate }: ShiftsListProps) => {
  const week = buildWeek(currentDate, selectedDate);
  const { shift, isLoading } = useActiveShift();

  const selDateObj = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    selectedDate,
  );
  const sectionLabel = selDateObj.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <h3 className="text-[14px] font-semibold text-slate-900 tracking-tight">
            Jadwal Minggu Ini
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500 capitalize">
            {sectionLabel}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-brand">
          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
          7 hari
        </span>
      </div>

      <ul className="space-y-2.5">
        {week.map((cell, i) => (
          <li key={i}>
            {cell.isWorkday ? (
              <WorkdayCard cell={cell} shift={shift} isLoading={isLoading} />
            ) : (
              <OffDayCard cell={cell} />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

const WorkdayCard = ({
  cell,
  shift,
  isLoading,
}: {
  cell: DayCell;
  shift: ActiveShift | null;
  isLoading: boolean;
}) => {
  const { date, isSelected, isToday } = cell;
  const dayNum = date.getDate();
  const weekdayShort = WEEKDAY_SHORT[date.getDay()];

  const name = isLoading
    ? "Memuat…"
    : (shift?.name ?? "Belum ada shift aktif");
  const start = shift?.startTime || "—";
  const end = shift?.endTime || "—";
  const duration =
    shift?.startTime && shift?.endTime
      ? durationLabel(shift.startTime, shift.endTime)
      : "—";

  return (
    <article
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-sage-500 to-sage-700 p-4 text-white transition-all ${
        isSelected
          ? "ring-2 ring-white shadow-[0_14px_30px_-14px_rgba(79,122,99,0.55)]"
          : "shadow-[0_8px_22px_-14px_rgba(79,122,99,0.4)]"
      }`}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full border border-white/8"
      />

      <div className="relative flex items-stretch gap-4">
        <div className="flex h-[70px] w-[64px] shrink-0 flex-col items-center justify-center rounded-2xl bg-white text-brand">
          <span className="text-[22px] font-semibold leading-none tabular-nums">
            {dayNum}
          </span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-brand/70">
            {weekdayShort}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[13px] font-semibold tracking-tight text-white">
              {name}
            </p>
            {isToday && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                <span className="h-1 w-1 rounded-full bg-white" />
                Hari ini
              </span>
            )}
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-2">
            <StatBlock label="Mulai" value={start} />
            <StatBlock label="Selesai" value={end} />
            <StatBlock label="Durasi" value={duration} />
          </div>
        </div>
      </div>
    </article>
  );
};

const OffDayCard = ({ cell }: { cell: DayCell }) => {
  const { date, isSelected } = cell;
  const dayNum = date.getDate();
  const weekdayShort = WEEKDAY_SHORT[date.getDay()];

  return (
    <article
      className={`flex items-center gap-4 rounded-3xl border bg-white p-4 transition-all ${
        isSelected ? "border-brand/40" : "border-slate-200"
      }`}
    >
      <div className="flex h-[70px] w-[64px] shrink-0 flex-col items-center justify-center rounded-2xl bg-slate-50">
        <span className="text-[22px] font-semibold leading-none tabular-nums text-slate-900">
          {dayNum}
        </span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          {weekdayShort}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-slate-900">Hari libur</p>
        <p className="mt-1 text-[11.5px] text-slate-500">
          Tidak ada jadwal kerja.
        </p>
      </div>
    </article>
  );
};

const StatBlock = ({ label, value }: { label: string; value: string }) => {
  return (
    <div className="rounded-xl bg-white/[0.08] px-2.5 py-1.5 backdrop-blur">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-white/55">
        {label}
      </p>
      <p className="mt-0.5 text-[13px] font-semibold tabular-nums tracking-tight text-white">
        {value}
      </p>
    </div>
  );
};

export default CardShiftList;
