import { useMutation } from "@tanstack/react-query";
import { UsersApi } from "@features/users/api/users.api";

export const useUpdatePassword = () => {
  const { mutateAsync: updatePassword, isPending } = useMutation({
    mutationFn: UsersApi.updateMyPassword,
  });

  return { updatePassword, isPending };
};
