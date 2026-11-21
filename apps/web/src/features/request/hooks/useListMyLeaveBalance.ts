import { useQuery } from "@tanstack/react-query";
import { LeaveBalancesApi } from "@features/request/api/leave-balances.api";

export const useListMyLeaveBalance = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-leave-balance"],
    queryFn: LeaveBalancesApi.getMyLeaveBalance,
  });

  return {
    leave_balance: data?.data,
    isLoading,
    isError,
  };
};
