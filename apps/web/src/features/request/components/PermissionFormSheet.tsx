import { toLocalDateIso } from "@shared/utils/date";
import { useEffect, useMemo, useState } from "react";
import { Loader2, Paperclip, X } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@ui/sheet";
import { Button } from "@ui/button";
import { Label } from "@ui/label";
import { Input } from "@ui/input";
import { Textarea } from "@ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@ui/select";
import type { PermissionFormSheetProps, PermissionType } from "@features/request/@types";
import {
  PERMISSION_TYPE_OPTIONS,
  calcDays,
  permissionTypeHint,
  permissionTypeLabel,
} from "@features/request/utils/format";
import {
  ACCEPTED_ATTACHMENT_TYPES,
  MAX_ATTACHMENT_SIZE,
  createPermissionSchema,
} from "@features/request/validation/permission.validation";

const PermissionFormSheet = ({
  open,
  onOpenChange,
  submitting,
  balance,
  onSubmit,
}: PermissionFormSheetProps) => {
  const [type, setType] = useState<PermissionType>("PERMIT");
  const [startDate, setStartDate] = useState(toLocalDateIso());
  const [endDate, setEndDate] = useState(toLocalDateIso());
  const [reason, setReason] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setType("PERMIT");
      setStartDate(toLocalDateIso());
      setEndDate(toLocalDateIso());
      setReason("");
      setAttachment(null);
      setError(null);
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open]);

  const totalDays = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return calcDays(startDate, endDate);
  }, [startDate, endDate]);

  const isAnnual = type === "ANNUAL_LEAVE";
  const remainingAfter =
    isAnnual && balance ? balance.remainingDays - totalDays : null;
  const overBudget = remainingAfter !== null && remainingAfter < 0;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_SIZE) {
      setError("Ukuran lampiran maksimal 5 MB");
      e.target.value = "";
      return;
    }
    if (
      !ACCEPTED_ATTACHMENT_TYPES.includes(
        file.type as (typeof ACCEPTED_ATTACHMENT_TYPES)[number],
      )
    ) {
      setError("Format lampiran harus JPG, PNG, WEBP, atau PDF");
      e.target.value = "";
      return;
    }
    setError(null);
    setAttachment(file);
  };

  const handleSubmit = async () => {
    const result = createPermissionSchema.safeParse({
      type,
      startDate,
      endDate,
      reason: reason.trim() || undefined,
      permission_attachment: attachment ?? undefined,
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? "Periksa kembali isian form");
      return;
    }
    if (overBudget) {
      setError("Saldo cuti tidak mencukupi");
      return;
    }
    setError(null);
    await onSubmit(result.data);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-w-[420px] mx-auto rounded-t-2xl max-h-[92dvh] overflow-y-auto no-scrollbar bg-muted"
      >
        <SheetHeader className="pt-5 pb-2">
          <SheetTitle className="text-lg">Ajukan Permohonan</SheetTitle>
          <SheetDescription>
            Pilih jenis pengajuan dan isi detailnya.
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-ink-muted">
              Jenis Pengajuan
            </Label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as PermissionType)}
            >
              <SelectTrigger className="w-full h-11 bg-paper-raised border-line text-[14px]">
                <SelectValue placeholder="Pilih jenis pengajuan" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {PERMISSION_TYPE_OPTIONS.map((opt) => (
                    <SelectItem
                      key={opt}
                      value={opt}
                      className="text-[13.5px]"
                    >
                      {permissionTypeLabel[opt]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {permissionTypeHint[type] && (
              <p className="text-[11.5px] text-ink-muted leading-relaxed pt-0.5">
                {permissionTypeHint[type]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="startDate"
                className="text-[13px] font-medium text-ink-muted"
              >
                Mulai
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                min={toLocalDateIso()}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-11 text-[14px] bg-paper-raised"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="endDate"
                className="text-[13px] font-medium text-ink-muted"
              >
                Selesai
              </Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                min={startDate || toLocalDateIso()}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-11 text-[14px] bg-paper-raised"
              />
            </div>
          </div>

          {totalDays > 0 && (
            <div className="text-[12.5px] text-ink-muted -mt-1 px-1">
              Total{" "}
              <span className="font-semibold text-ink">
                {totalDays} hari
              </span>
            </div>
          )}

          {isAnnual && balance && (
            <div
              className={`rounded-xl border p-3.5 ${
                overBudget
                  ? "border-danger/30 bg-danger-soft"
                  : "border-line bg-paper-raised"
              }`}
            >
              <p className="text-[11px] uppercase tracking-wider font-semibold text-ink-muted">
                Saldo Cuti Tahunan
              </p>
              <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[18px] font-semibold text-ink tabular-nums">
                    {balance.remainingDays}
                  </p>
                  <p className="text-[10.5px] text-ink-muted mt-0.5">Tersisa</p>
                </div>
                <div>
                  <p className="text-[18px] font-semibold text-warning tabular-nums">
                    -{totalDays}
                  </p>
                  <p className="text-[10.5px] text-ink-muted mt-0.5">Dipakai</p>
                </div>
                <div>
                  <p
                    className={`text-[18px] font-semibold tabular-nums ${
                      overBudget ? "text-danger" : "text-brand"
                    }`}
                  >
                    {remainingAfter}
                  </p>
                  <p className="text-[10.5px] text-ink-muted mt-0.5">Sesudah</p>
                </div>
              </div>
              {overBudget && (
                <p className="text-[12px] text-danger font-medium mt-2.5">
                  Saldo cuti tidak mencukupi untuk pengajuan ini.
                </p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label
              htmlFor="reason"
              className="text-[13px] font-medium text-ink-muted"
            >
              Alasan
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="Jelaskan alasan pengajuan..."
              className="bg-paper-raised"
            />
            <p className="text-[11px] text-ink-faint text-right tabular-nums">
              {reason.length}/500
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[13px] font-medium text-ink-muted">
              Lampiran{" "}
              <span className="font-normal text-ink-faint">
                (opsional, mis. surat dokter)
              </span>
            </Label>
            {attachment ? (
              <div className="flex items-center gap-2 rounded-lg border border-line bg-paper-raised px-3 py-2.5">
                <Paperclip size={16} className="text-ink-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12.5px] font-medium text-ink truncate">
                    {attachment.name}
                  </p>
                  <p className="text-[11px] text-ink-muted tabular-nums">
                    {(attachment.size / 1024).toFixed(0)} KB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachment(null)}
                  aria-label="Hapus lampiran"
                  className="p-1.5 rounded-md text-ink-faint hover:text-danger hover:bg-danger-soft transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <label
                htmlFor="attachment"
                className="flex items-center gap-2 rounded-lg border border-dashed border-line bg-paper-raised px-3 py-3 cursor-pointer hover:border-line transition-colors"
              >
                <Paperclip size={16} className="text-ink-muted" />
                <span className="text-[12.5px] text-ink-muted">
                  Pilih file (PDF / JPG / PNG / WEBP, maks 5 MB)
                </span>
                <input
                  id="attachment"
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={handleFile}
                />
              </label>
            )}
          </div>

          {error && (
            <p role="alert" className="text-[13px] text-danger -mt-1">
              {error}
            </p>
          )}

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || overBudget}
            className="w-full h-12 rounded-lg bg-brand hover:bg-brand-bright text-white text-[15px] font-medium disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Mengirim...
              </span>
            ) : (
              "Ajukan Permohonan"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PermissionFormSheet;
