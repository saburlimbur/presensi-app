import { useQuery } from "@tanstack/react-query";
import { PermissionsApi } from "@features/request/api/permissions.api";

export const useListMyPermission = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["my-permission-request"],
    queryFn: PermissionsApi.listMyPermission,
  });

  return {
    permissions: data?.data ?? [],
    isLoading,
    isError,
  };
};
