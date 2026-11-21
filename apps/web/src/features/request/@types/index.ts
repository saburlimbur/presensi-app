export type PermissionType =
  | "SICK"
  | "PERMIT"
  | "ANNUAL_LEAVE"
  | "MATERNITY_LEAVE"
  | "PATERNITY_LEAVE"
  | "MARRIAGE_LEAVE"
  | "BEREAVEMENT"
  | "HALF_DAY"
  | "WORK_FROM_HOME"
  | "OTHER";

export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";

export interface Approver {
  id: string;
  fullName: string;
}

export interface PermissionRequest {
  id: string;
  type: PermissionType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  attachmentUrl?: string | null;
  attachmentUrl_url?: string | null;
  status: RequestStatus;
  approvedNote?: string | null;
  approver?: Approver | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePermissionPayload {
  type: PermissionType;
  startDate: string;
  endDate: string;
  reason?: string;
  permission_attachment?: File;
}

export interface PermissionFormSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  submitting?: boolean;
  balance?: LeaveBalance | null;
  onSubmit: (payload: CreatePermissionPayload) => void | Promise<unknown>;
}

export interface LeaveBalance {
  totalDays: number;
  usedDays: number;
  pendingDays: number;
  remainingDays: number;
}

export interface LeaveBalanceResponse {
  id: string;
  userId: string;
  year: number;
  annualQuota: number;
  usedDays: number;
  remainingDays: number;
  carryOverDays: number;
  updatedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
    employeeId?: string;
    department?: Department;
  };
}

export interface Department {
  id: string;
  name: string;
  code?: string;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}
