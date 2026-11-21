import { useQuery } from "@tanstack/react-query";
import { LocationsApi } from "@features/attendance/api/locations.api";

export const useReadLocation = () => {
  const {
    data: readLocation,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["locations"],
    queryFn: LocationsApi.list,
  });

  return { readLocation, isLoading, isError };
};
