import { useState } from "react";
import {
  AlertTriangle,
  Baby,
  Calendar,
  CheckCircle2,
  FileText,
  Heart,
  HeartCrack,
  HelpCircle,
  Home,
  Loader2,
  Palmtree,
  Stethoscope,
  Sun,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@ui/sheet";
import { Button } from "@ui/button";
import RequestStatusBadge from "@features/request/components/RequestStatusBadge";
import type { PermissionRequest, PermissionType } from "@features/request/@types";
import {
  fmtDateLong,
  fmtDateRange,
  permissionTypeLabel,
} from "@features/request/utils/format";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: PermissionRequest | null;
  cancelling?: boolean;
  onCancel?: (request: PermissionRequest) => void | Promise<unknown>;
}

const TYPE_ICON: Record<PermissionType, LucideIcon> = {
  SICK: Stethoscope,
  PERMIT: FileText,
  ANNUAL_LEAVE: Palmtree,
  MATERNITY_LEAVE: Baby,
  PATERNITY_LEAVE: Baby,
  MARRIAGE_LEAVE: Heart,
  BEREAVEMENT: HeartCrack,
  HALF_DAY: Sun,
  WORK_FROM_HOME: Home,
  OTHER: HelpCircle,
};

const Row = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-b-0">
      <span className="text-[12.5px] text-slate-500">{label}</span>
      <span className="text-[13px] text-slate-900 font-medium text-right max-w-[60%] break-words">
        {value}
      </span>
    </div>
  );
};

const RequestDetailSheet = ({
  open,
  onOpenChange,
  request,
  cancelling,
  onCancel,
}: Props) => {
  const [confirmCancel, setConfirmCancel] = useState(false);

  if (!request) return null;

  const Icon = TYPE_ICON[request.type];

  const handleOpenChange = (next: boolean) => {
    if (!next) setConfirmCancel(false);
    onOpenChange(next);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="max-w-[420px] mx-auto rounded-t-2xl max-h-[92dvh] overflow-y-auto no-scrollbar bg-slate-50"
      >
        <SheetHeader className="pt-5 pb-2">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cta/8 text-cta">
              <Icon size={18} strokeWidth={1.75} />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-base">
                {permissionTypeLabel[request.type]}
              </SheetTitle>
              <SheetDescription className="text-[12px]">
                Detail pengajuan
              </SheetDescription>
            </div>
            <RequestStatusBadge status={request.status} size="md" />
          </div>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white px-4">
            <Row label="Jenis" value={permissionTypeLabel[request.type]} />
            <Row
              label="Periode"
              value={fmtDateRange(request.startDate, request.endDate)}
            />
            <Row label="Total" value={`${request.totalDays} hari`} />
            <Row label="Diajukan" value={fmtDateLong(request.createdAt)} />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1.5">
              Alasan
            </p>
            <p className="text-[13.5px] text-slate-800 leading-relaxed whitespace-pre-wrap">
              {request.reason || "—"}
            </p>
          </div>

          {request.attachmentUrl_url && (
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
                Lampiran
              </p>
              <a
                href={request.attachmentUrl_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 hover:bg-slate-50 transition-colors"
              >
                <FileText size={16} className="text-cta shrink-0" />
                <span className="flex-1 text-[12.5px] text-slate-700 truncate">
                  Lihat lampiran
                </span>
                <span className="text-[11px] text-cta font-medium">
                  Buka
                </span>
              </a>
            </div>
          )}

          {request.status !== "PENDING" && (
            <div
              className={`rounded-xl border p-4 ${
                request.status === "APPROVED"
                  ? "border-cta/20 bg-cta/5"
                  : request.status === "REJECTED"
                    ? "border-rose-200 bg-rose-50"
                    : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {request.status === "APPROVED" && (
                  <CheckCircle2 size={16} className="text-cta" />
                )}
                {request.status === "REJECTED" && (
                  <XCircle size={16} className="text-rose-600" />
                )}
                {request.status === "CANCELLED" && (
                  <Calendar size={16} className="text-slate-500" />
                )}
                <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-600">
                  {request.status === "APPROVED"
                    ? "Disetujui oleh"
                    : request.status === "REJECTED"
                      ? "Ditolak oleh"
                      : "Dibatalkan"}
                </p>
              </div>
              {request.approver && (
                <p className="text-[13.5px] font-semibold text-slate-900">
                  {request.approver.fullName}
                </p>
              )}
              {request.approvedAt && (
                <p className="text-[11.5px] text-slate-500 mt-0.5">
                  {fmtDateLong(request.approvedAt)}
                </p>
              )}
              {request.approvedNote && (
                <p className="text-[13px] text-slate-700 mt-2 leading-relaxed whitespace-pre-wrap">
                  {request.approvedNote}
                </p>
              )}
            </div>
          )}

          {request.status === "PENDING" &&
            onCancel &&
            (confirmCancel ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                <div className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
                    <AlertTriangle size={17} strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13.5px] font-semibold text-rose-900">
                      Batalkan pengajuan ini?
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-rose-700/80">
                      Pengajuan akan dibatalkan dan tidak bisa dikembalikan.
                    </p>
                  </div>
                </div>
                <div className="mt-3.5 flex gap-2.5">
                  <Button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    disabled={cancelling}
                    className="h-11 flex-1 rounded-lg border border-slate-200 bg-white text-[13.5px] font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                  >
                    Kembali
                  </Button>
                  <Button
                    type="button"
                    onClick={() => onCancel(request)}
                    disabled={cancelling}
                    className="h-11 flex-1 rounded-lg bg-rose-600 text-[13.5px] font-medium text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    {cancelling ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 size={15} className="animate-spin" />
                        Membatalkan...
                      </span>
                    ) : (
                      "Ya, Batalkan"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white text-[14.5px] font-medium text-rose-600 transition-colors hover:bg-rose-50"
              >
                <XCircle size={17} />
                Batalkan Pengajuan
              </Button>
            ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RequestDetailSheet;
