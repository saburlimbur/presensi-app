import { Inbox } from "lucide-react";
import { Button } from "@ui/button";

interface Props {
  title?: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

const RequestEmptyState = ({
  title = "Belum ada pengajuan",
  description = "Ajukan cuti, izin, sakit, atau lembur untuk mulai mencatat permohonan Anda.",
  ctaLabel = "Ajukan Sekarang",
  onCta,
}: Props) => {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12">
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
        <Inbox size={22} strokeWidth={1.5} className="text-slate-400" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
      <p className="text-[13px] text-slate-500 mt-1.5 max-w-[260px] leading-relaxed">
        {description}
      </p>
      {onCta && (
        <Button
          onClick={onCta}
          className="mt-5 h-10 px-5 rounded-lg bg-cta hover:bg-cta/90 text-white text-[13px] font-medium"
        >
          {ctaLabel}
        </Button>
      )}
    </div>
  );
};

export default RequestEmptyState;
