import type { RequestStatus } from "@features/request/@types";

export const STATUS_FILTERS: {
  value: RequestStatus | "ALL";
  label: string;
}[] = [
  {
    value: "ALL",
    label: "Semua",
  },
  {
    value: "PENDING",
    label: "Menunggu",
  },
  {
    value: "APPROVED",
    label: "Disetujui",
  },
  {
    value: "REJECTED",
    label: "Ditolak",
  },
  {
    value: "CANCELLED",
    label: "Dibatalkan",
  },
];
