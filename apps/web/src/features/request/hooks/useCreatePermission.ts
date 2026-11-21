import { useMutation } from "@tanstack/react-query";
import type { CreatePermissionPayload } from "@features/request/@types";
import { PermissionsApi } from "@features/request/api/permissions.api";
import { queryClient } from "@lib/react-query";

export const useCreatePermission = () => {
  const {
    mutateAsync: createPermission,
    isError,
    isPending,
  } = useMutation({
    mutationKey: ["request-permission"],

    mutationFn: (payload: CreatePermissionPayload) =>
      PermissionsApi.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["my-permission-request"],
      });
    },

    onError: (error) => {
      console.error(error);
    },
  });

  return {
    createPermission,
    isError,
    isPending,
  };
};
