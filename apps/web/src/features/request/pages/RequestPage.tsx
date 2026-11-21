import { getErrorMessage } from "@shared/utils/error";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@ui/button";
import RequestCard from "@features/request/components/RequestCard";
import RequestEmptyState from "@features/request/components/RequestEmptyState";
import PermissionFormSheet from "@features/request/components/PermissionFormSheet";
import RequestDetailSheet from "@features/request/components/RequestDetailSheet";
import type {
  CreatePermissionPayload,
  LeaveBalance,
  PermissionRequest,
  RequestStatus,
} from "@features/request/@types";
import { useGetCalendar } from "@hooks/useGetCalendar";
import { useListMyPermission } from "@features/request/hooks/useListMyPermission";
import { useListMyLeaveBalance } from "@features/request/hooks/useListMyLeaveBalance";
import { useCreatePermission } from "@features/request/hooks/useCreatePermission";
import { useCancelPermission } from "@features/request/hooks/useCancelPermission";
import { STATUS_FILTERS } from "@features/request/utils/tab-filter-status";

const RequestPage = () => {
  const { permissions, isLoading } = useListMyPermission();
  const { leave_balance } = useListMyLeaveBalance();
  const { createPermission, isPending: creating } = useCreatePermission();
  const { cancelPermission, isPending: cancelling } = useCancelPermission();

  const [statusFilter, setStatusFilter] = useState<RequestStatus | "ALL">(
    "ALL",
  );
  const [formOpen, setFormOpen] = useState(false);
  const [detailFor, setDetailFor] = useState<PermissionRequest | null>(null);

  useGetCalendar(new Date().getFullYear());

  const filteredList = useMemo(() => {
    if (statusFilter === "ALL") return permissions;
    return permissions.filter((r) => r.status === statusFilter);
  }, [permissions, statusFilter]);

  const pendingDays = useMemo(
    () =>
      permissions
        .filter((p) => p.status === "PENDING")
        .reduce((sum, p) => sum + (p.totalDays ?? 0), 0),
    [permissions],
  );

  const balance: LeaveBalance = {
    totalDays: leave_balance?.annualQuota ?? 0,
    usedDays: leave_balance?.usedDays ?? 0,
    remainingDays: leave_balance?.remainingDays ?? 0,
    pendingDays,
  };

  const balancePct = balance.totalDays
    ? Math.max(
        0,
        Math.min(100, (balance.remainingDays / balance.totalDays) * 100),
      )
    : 0;

  const handleCreate = async (payload: CreatePermissionPayload) => {
    try {
      const res = await createPermission(payload);
      toast.success(res.message ?? "Pengajuan berhasil dikirim");
      setFormOpen(false);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Gagal mengirim pengajuan"));
    }
  };

  const handleCancel = async (request: PermissionRequest) => {
    try {
      const res = await cancelPermission(request.id);
      toast.success(res.message ?? "Pengajuan berhasil dibatalkan");
      setDetailFor(null);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Gagal membatalkan pengajuan"));
    }
  };

  return (
    <div className="space-y-3 mt-1 mb-6">
      <section className="relative overflow-hidden bg-gradient-to-br from-sage-500 to-sage-700 rounded-2xl p-5 text-white">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-12 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-white/60">
            Sisa Cuti Tahunan
          </p>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-[40px] font-semibold leading-none tabular-nums">
              {balance.remainingDays}
            </span>
            <span className="text-sm text-white/70">
              / {balance.totalDays} hari
            </span>
          </div>

          <div className="mt-4 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-[width] duration-500"
              style={{ width: `${balancePct}%` }}
              aria-label={`${balance.remainingDays} dari ${balance.totalDays} hari tersisa`}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[11px] text-white/70">
            <span>
              Terpakai{" "}
              <span className="font-semibold text-white tabular-nums">
                {balance.usedDays}
              </span>
            </span>
            {balance.pendingDays > 0 && (
              <span>
                Menunggu{" "}
                <span className="font-semibold text-white tabular-nums">
                  {balance.pendingDays}
                </span>
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="flex items-center justify-between gap-2 mt-1">
        <h2 className="text-[14px] font-semibold text-slate-900">
          Riwayat Pengajuan
        </h2>
        <Button
          onClick={() => setFormOpen(true)}
          className="h-9 px-3 rounded-lg bg-cta hover:bg-sage-700 text-white text-[12.5px] font-medium"
        >
          <Plus size={14} />
          Ajukan Baru
        </Button>
      </div>

      <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1 py-1">
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.value;
          return (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`whitespace-nowrap text-[12px] font-medium px-3 py-1.5 rounded-full border transition-colors ${
                active
                  ? "bg-cta text-white border-cta"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>

      <div className="space-y-2.5">
        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white px-5 py-10 text-center text-[13px] text-slate-400">
            Memuat pengajuan…
          </div>
        ) : filteredList.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white">
            <RequestEmptyState
              title={
                statusFilter === "ALL"
                  ? "Belum ada pengajuan"
                  : "Tidak ada hasil"
              }
              description={
                statusFilter === "ALL"
                  ? "Ajukan permohonan untuk mulai mencatat permintaan Anda."
                  : "Coba ubah filter status untuk melihat pengajuan lain."
              }
              ctaLabel={statusFilter === "ALL" ? "Ajukan Sekarang" : undefined}
              onCta={
                statusFilter === "ALL" ? () => setFormOpen(true) : undefined
              }
            />
          </div>
        ) : (
          filteredList.map((r) => (
            <RequestCard
              key={r.id}
              request={r}
              onClick={(req) => setDetailFor(req)}
            />
          ))
        )}
      </div>

      <PermissionFormSheet
        open={formOpen}
        onOpenChange={setFormOpen}
        balance={balance}
        submitting={creating}
        onSubmit={handleCreate}
      />
      <RequestDetailSheet
        key={detailFor?.id}
        open={!!detailFor}
        onOpenChange={(o) => !o && setDetailFor(null)}
        request={detailFor}
        onCancel={handleCancel}
        cancelling={cancelling}
      />
    </div>
  );
};

export default RequestPage;
