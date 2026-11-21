import { useMutation } from "@tanstack/react-query";
import { FacesApi } from "@features/faces/api/faces.api";

export const useEnrollFace = () => {
  const { mutateAsync: enrollFace, isPending } = useMutation({
    mutationKey: ["enroll-face"],
    mutationFn: (files: File[]) => FacesApi.enroll(files),
  });

  return { enrollFace, isPending };
};
