import { useQuery } from "@tanstack/react-query";
import { FacesApi } from "@features/faces/api/faces.api";
import type { MyFacesResponse } from "@features/faces/@types";

export const useMyFacesEmbed = () => {
  const { data, isLoading, isError } = useQuery<MyFacesResponse>({
    queryKey: ["my-faces"],
    queryFn: FacesApi.listMe,
  });

  return {
    myFacesEmbed: data,
    embeddings: data?.data?.embeddings ?? [],
    total: data?.data?.total ?? 0,
    isLoading,
    isError,
  };
};
