import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UsersApi } from "@features/users/api/users.api";

export const useUpdatePhoto = () => {
  const qc = useQueryClient();

  const { mutateAsync: updatePhoto, isPending } = useMutation({
    mutationFn: (file: File) => UsersApi.updateMyPhoto(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  return { updatePhoto, isPending };
};
