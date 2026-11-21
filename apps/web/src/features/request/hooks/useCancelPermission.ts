import { useMutation } from "@tanstack/react-query";
import { PermissionsApi } from "@features/request/api/permissions.api";
import { queryClient } from "@lib/react-query";

export const useCancelPermission = () => {
  const {
    mutateAsync: cancelPermission,
    isError,
    isPending,
  } = useMutation({
    mutationKey: ["cancel-permission"],

    mutationFn: (id: string) => PermissionsApi.cancel(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-permission-request"],
      });
      queryClient.invalidateQueries({
        queryKey: ["my-leave-balance"],
      });
    },

    onError: (error) => {
      console.error(error);
    },
  });

  return {
    cancelPermission,
    isError,
    isPending,
  };
};
