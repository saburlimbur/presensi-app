import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import type { CalendarProps } from "@features/schedule/@types";
import {
  useGetCalendar,
  type Holiday,
} from "@hooks/useGetCalendar";
import { cn } from "@lib/utils";

const MONTH_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const WEEKDAY_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const isoFromYMD = (y: number, m: number, d: number) => {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

const Calendar = ({
  currentDate,
  setCurrentDate,
  selectedDate,
  setSelectedDate,
}: CalendarProps) => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const { calendarExternal, isLoading } = useGetCalendar(year);
  const holidays: Holiday[] = useMemo(
    () => calendarExternal ?? [],
    [calendarExternal],
  );

  const holidayMap = useMemo(() => {
    const m = new Map<string, Holiday>();
    holidays.forEach((h) => m.set(h.date, h));
    return m;
  }, [holidays]);

  const monthHolidays = useMemo(
    () =>
      holidays
        .filter((h) => {
          const d = new Date(h.date);
          return d.getFullYear() === year && d.getMonth() === month;
        })
        .sort((a, b) => a.date.localeCompare(b.date)),
    [holidays, year, month],
  );

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();
  const onToday = isCurrentMonth && selectedDate === todayDate;

  const previousMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => {
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today.getDate());
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < startingDayOfWeek; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(i);

  const selectedHoliday =
    selectedDate > 0
      ? holidayMap.get(isoFromYMD(year, month, selectedDate))
      : undefined;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-3 flex flex-col">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-900 tracking-tight truncate">
            {MONTH_ID[month]} {year}
          </h2>
          <p className="text-[10.5px] text-slate-400 mt-0.5 truncate">
            {monthHolidays.length > 0
              ? `${monthHolidays.length} hari libur bulan ini`
              : isLoading
                ? "Memuat hari libur..."
                : "Tidak ada hari libur"}
          </p>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={goToday}
            disabled={onToday}
            aria-label="Pergi ke hari ini"
            className={cn(
              "inline-flex items-center gap-1.5 h-8 px-2.5 rounded-full text-[11.5px] font-medium transition-colors",
              onToday
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : "bg-brand/10 text-brand hover:bg-brand/15 active:bg-brand/20",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                onToday ? "bg-slate-300" : "bg-brand",
              )}
              aria-hidden
            />
            Hari ini
          </button>
          <button
            onClick={previousMonth}
            aria-label="Bulan sebelumnya"
            className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={nextMonth}
            aria-label="Bulan berikutnya"
            className="flex items-center justify-center w-8 h-8 rounded-full text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 mt-3 mb-1">
        {WEEKDAY_ID.map((_, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-semibold py-1.5 uppercase tracking-wider text-slate-400"
          >
            {WEEKDAY_ID[i]}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (day === null) {
            return <div key={idx} className="aspect-square" />;
          }

          const holiday = holidayMap.get(isoFromYMD(year, month, day));
          const isHoliday = !!holiday;
          const isSelected = day === selectedDate;
          const isToday = isCurrentMonth && day === todayDate;

          return (
            <div
              key={idx}
              className="aspect-square flex items-center justify-center"
            >
              <button
                onClick={() => setSelectedDate(day)}
                aria-label={
                  isHoliday
                    ? `${day} ${MONTH_ID[month]} — ${holiday!.name}`
                    : `${day} ${MONTH_ID[month]}`
                }
                className={cn(
                  "relative h-9 w-9 flex items-center justify-center rounded-full text-[13px] font-medium transition-all",
                  isSelected
                    ? "bg-brand text-white shadow-sm scale-105"
                    : isToday
                      ? "bg-brand/10 text-brand ring-1 ring-inset ring-brand/20"
                      : "text-slate-700 hover:bg-slate-100",
                )}
              >
                <span className="tabular-nums">{day}</span>
                {isHoliday && (
                  <span
                    className={cn(
                      "absolute bottom-1 h-1 w-1 rounded-full",
                      isSelected ? "bg-white" : "bg-brand",
                    )}
                    aria-hidden
                  />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {selectedHoliday && (
        <div className="mt-3 flex items-center gap-1.5 rounded-full bg-brand/10 border border-brand/20 px-2.5 py-1 self-start w-fit max-w-full">
          <span
            className="h-1.5 w-1.5 rounded-full bg-brand shrink-0"
            aria-hidden
          />
          <span className="text-[11.5px] font-medium text-brand truncate">
            {selectedHoliday.name}
          </span>
        </div>
      )}
    </div>
  );
};

export default Calendar;
