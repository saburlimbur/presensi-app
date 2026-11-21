import { Clock, MapPin } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@ui/sheet";
import StatusBadge from "@features/attendance/components/StatusBadge";
import { fmtTime, locationLabel } from "@features/attendance/utils/format";
import type { AttendanceRecord } from "@features/attendance/@types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: AttendanceRecord | null;
}

const AttendanceHistorySheet = ({ open, onOpenChange, record }: Props) => {
  if (!record) return null;

  const mapCoords = [record.checkIn, record.checkOut].find(
    (entry) => entry?.lat != null && entry?.lng != null,
  );
  const dateLabel = new Date(record.date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-w-[420px] mx-auto rounded-t-2xl max-h-[92dvh] overflow-y-auto no-scrollbar bg-slate-50"
      >
        <SheetHeader className="pt-5 pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <SheetTitle className="text-base">{dateLabel}</SheetTitle>
              <SheetDescription className="text-[12px]">
                Detail kehadiran
              </SheetDescription>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {record.workType && (
                <span
                  className={`rounded px-2 py-1 text-[10px] font-semibold ${
                    record.workType === "WFO"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {record.workType}
                </span>
              )}
              <StatusBadge status={record.status} />
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-3 px-4 pb-6">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">
                Check-in
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Clock size={14} className="text-slate-400" />
                {fmtTime(record.checkIn?.time) ?? "--:--"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[10px] font-semibold uppercase text-slate-500">
                Check-out
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                <Clock size={14} className="text-slate-400" />
                {fmtTime(record.checkOut?.time) ?? "--:--"}
              </p>
            </div>
          </div>

          {(record.checkIn?.photoUrl || record.checkOut?.photoUrl) && (
            <div className="grid grid-cols-2 gap-3">
              {record.checkIn?.photoUrl && (
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase text-slate-500">
                    Foto Masuk
                  </p>
                  <img
                    src={record.checkIn.photoUrl}
                    alt="check-in"
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                </div>
              )}
              {record.checkOut?.photoUrl && (
                <div className="rounded-xl border border-slate-200 bg-white p-3">
                  <p className="mb-2 text-[10px] font-semibold uppercase text-slate-500">
                    Foto Pulang
                  </p>
                  <img
                    src={record.checkOut.photoUrl}
                    alt="check-out"
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                </div>
              )}
            </div>
          )}

          {mapCoords && (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 text-cta" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900">
                    {locationLabel(record)}
                  </p>
                </div>
              </div>
              <iframe
                title="lokasi-detail"
                className="h-40 w-full rounded-lg border border-slate-100"
                src={`https://maps.google.com/maps?q=${mapCoords.lat},${mapCoords.lng}&z=16&output=embed`}
                loading="lazy"
              />
            </div>
          )}

          {(record.checkIn?.note || record.checkOut?.note) && (
            <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-900">Catatan</p>
              {record.checkIn?.note && (
                <p className="text-xs text-slate-600">
                  <span className="font-semibold">Masuk:</span>{" "}
                  {record.checkIn.note}
                </p>
              )}
              {record.checkOut?.note && (
                <p className="text-xs text-slate-600">
                  <span className="font-semibold">Pulang:</span>{" "}
                  {record.checkOut.note}
                </p>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default AttendanceHistorySheet;
