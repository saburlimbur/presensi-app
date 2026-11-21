import type { RequestStatus } from "@features/request/@types";

const styles: Record<RequestStatus, string> = {
  PENDING: "bg-warning-soft text-warning-foreground ring-1 ring-inset ring-warning/20",
  APPROVED: "bg-success-soft text-success-foreground ring-1 ring-inset ring-success/20",
  REJECTED: "bg-danger-soft text-danger-foreground ring-1 ring-inset ring-danger/20",
  CANCELLED: "bg-muted text-ink-muted ring-1 ring-inset ring-line",
};

const labels: Record<RequestStatus, string> = {
  PENDING: "Menunggu",
  APPROVED: "Disetujui",
  REJECTED: "Ditolak",
  CANCELLED: "Dibatalkan",
};

interface Props {
  status: RequestStatus;
  size?: "sm" | "md";
}

const RequestStatusBadge = ({ status, size = "sm" }: Props) => {
  const sizing =
    size === "sm" ? "text-[10.5px] px-2 py-0.5" : "text-[12px] px-2.5 py-1";
  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full ${sizing} ${styles[status]}`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          status === "PENDING"
            ? "bg-warning"
            : status === "APPROVED"
              ? "bg-success"
              : status === "REJECTED"
                ? "bg-danger"
                : "bg-ink-faint"
        }`}
      />
      {labels[status]}
    </span>
  );
};

export default RequestStatusBadge;
