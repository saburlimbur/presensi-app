import {
  Baby,
  FileText,
  HeartCrack,
  Heart,
  Home,
  HelpCircle,
  MoonStar,
  Palmtree,
  Stethoscope,
  Sun,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PermissionRequest, PermissionType } from "@features/request/@types";
import RequestStatusBadge from "@features/request/components/RequestStatusBadge";
import {
  fmtDateRange,
  fmtRelativeShort,
  permissionTypeLabel,
} from "@features/request/utils/format";

interface Props {
  request: PermissionRequest;
  onClick?: (request: PermissionRequest) => void;
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

void MoonStar;

const RequestCard = ({ request, onClick }: Props) => {
  const Icon = TYPE_ICON[request.type];

  return (
    <button
      type="button"
      onClick={() => onClick?.(request)}
      className="w-full text-left bg-white rounded-xl border border-slate-200 px-4 py-3.5 hover:bg-slate-50 active:bg-slate-100 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cta/8 text-cta shrink-0">
          <Icon size={18} strokeWidth={1.75} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-[14px] font-semibold text-slate-900 truncate">
              {permissionTypeLabel[request.type]}
            </p>
            <RequestStatusBadge status={request.status} />
          </div>

          <p className="text-[12.5px] text-slate-600 mt-0.5 truncate">
            {fmtDateRange(request.startDate, request.endDate)}
          </p>

          <div className="flex items-center gap-2 mt-2 text-[11.5px] text-slate-500">
            <span className="font-medium text-slate-700 tabular-nums">
              {request.totalDays} hari
            </span>
            <span className="w-0.5 h-0.5 rounded-full bg-slate-300" />
            <span>diajukan {fmtRelativeShort(request.createdAt)}</span>
          </div>
        </div>
      </div>
    </button>
  );
};

export default RequestCard;
