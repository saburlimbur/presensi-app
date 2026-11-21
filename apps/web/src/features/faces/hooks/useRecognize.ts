import { useMutation } from "@tanstack/react-query";
import { FacesApi } from "@features/faces/api/faces.api";

export const useRecognize = () => {
  const { mutateAsync: recognize, isPending } = useMutation({
    mutationKey: ["recognize-face"],
    mutationFn: (file: File) => FacesApi.verify(file),
  });

  return { recognize, isPending };
};
