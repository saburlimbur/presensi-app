import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { AuthApi } from "@features/auth/api/auth.api";
import { useAuthStore } from "@features/auth/store/auth.store";
import type { LoginFormValues } from "@features/auth/validation/login.validation";
import type { AuthResponse } from "@features/auth/@types";

export const useLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);

  const {
    mutate: loginUser,
    isError,
    isSuccess,
    isPending,
  } = useMutation<AuthResponse, Error, LoginFormValues>({
    mutationKey: ["login"],
    mutationFn: (data) => AuthApi.login(data),

    onSuccess: (res) => {
      setAuth(res.data.accessToken, res.data.refreshToken, res.data.user);
      navigate(res.data.user.isFaceRegistered ? "/home" : "/auth/enrolled");
    },
  });

  return { loginUser, isError, isSuccess, isPending };
};
