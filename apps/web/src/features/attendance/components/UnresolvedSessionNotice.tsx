import { AlertTriangle } from "lucide-react";
import { fmtTime } from "@features/attendance/utils/format";
import type { UnresolvedSession } from "@features/attendance/@types";

interface Props {
  session: UnresolvedSession;
  canCheckIn?: boolean;
  className?: string;
}

const UnresolvedSessionNotice = ({ session, canCheckIn, className }: Props) => {
  const dateLabel = new Date(session.checkIn).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 rounded-xl bg-amber-50 px-3 py-2.5 ${className ?? ""}`}
    >
      <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-700" />
      <div className="min-w-0 text-[12px] leading-relaxed text-amber-700">
        <p className="font-semibold">
          Sesi {dateLabel} belum check-out
        </p>
        <p className="font-normal text-amber-700/80">
          Check-in {fmtTime(session.checkIn)}, batas waktu check-out sudah
          lewat. Hubungi admin untuk koreksi jam pulang.
          {canCheckIn && " Kamu tetap bisa check-in hari ini."}
        </p>
      </div>
    </div>
  );
};

export default UnresolvedSessionNotice;
