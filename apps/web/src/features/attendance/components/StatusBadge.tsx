import type { AttendanceStatus } from "@features/attendance/@types";
import {
  ATTENDANCE_STATUS_META,
  STATUS_TONE_CLASS,
} from "@features/attendance/utils/status";

const sizes = {
  md: "text-[11px] px-2.5 py-1 rounded-full",
  sm: "inline-flex items-center h-5 px-1.5 rounded text-[10px]",
};

interface StatusBadgeProps {
  status: AttendanceStatus;
  size?: keyof typeof sizes;
}

const StatusBadge = ({ status, size = "md" }: StatusBadgeProps) => {
  const meta = ATTENDANCE_STATUS_META[status];

  return (
    <span
      className={`font-semibold ${sizes[size]} ${STATUS_TONE_CLASS[meta.tone]}`}
    >
      {meta.label}
    </span>
  );
};

export default StatusBadge;
