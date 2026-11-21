import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UsersApi } from "@features/users/api/users.api";
import type { UpdateProfileValues } from "@features/users/validation/profile.validation";

export const useUpdateProfile = () => {
  const qc = useQueryClient();

  const { mutateAsync: updateProfile, isPending } = useMutation({
    mutationFn: (data: UpdateProfileValues) => UsersApi.updateMe(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  return { updateProfile, isPending };
};
