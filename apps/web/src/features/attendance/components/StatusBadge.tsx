import type { AttendanceStatus } from "@features/attendance/@types";

const styles: Record<AttendanceStatus, string> = {
  present: "bg-success-soft text-success-foreground",
  late: "bg-warning-soft text-warning-foreground",
  absent: "bg-danger-soft text-danger-foreground",
  pending: "bg-muted text-ink-muted",
};

const labels: Record<AttendanceStatus, string> = {
  present: "Tepat Waktu",
  late: "Terlambat",
  absent: "Tidak Hadir",
  pending: "Belum Absen",
};

const StatusBadge = ({ status }: { status: AttendanceStatus }) => {
  return (
    <span
      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
};

export default StatusBadge;
