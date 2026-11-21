import { useQuery } from "@tanstack/react-query";
import { UsersApi } from "@features/users/api/users.api";

export const useProfileUser = () => {
  const {
    data: userProfile,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["profile"],
    queryFn: UsersApi.getMe,
  });

  return { userProfile, isLoading, isError };
};
