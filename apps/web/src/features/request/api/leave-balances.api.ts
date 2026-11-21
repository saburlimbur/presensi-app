import AxiosApiService from "@shared/api/api-service";
import type { ApiEnvelope, LeaveBalanceResponse } from "@features/request/@types";

export const LeaveBalancesApi = {
  getMyLeaveBalance: async (): Promise<ApiEnvelope<LeaveBalanceResponse>> => {
    const res = await AxiosApiService.get("/leave-balances/my-balance");
    return res.data;
  },
};
