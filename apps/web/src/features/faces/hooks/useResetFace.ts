import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FacesApi } from "@features/faces/api/faces.api";
import { useAuthStore } from "@features/auth/store/auth.store";

export const useResetFace = () => {
  const qc = useQueryClient();

  const { mutateAsync: resetFace, isPending } = useMutation({
    mutationFn: FacesApi.resetMe,
    onSuccess: () => {
      useAuthStore.getState().setFaceRegistered(false);
      qc.invalidateQueries({ queryKey: ["my-faces"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  return { resetFace, isPending };
};
