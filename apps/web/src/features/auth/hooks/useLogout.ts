import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

import { useAuthStore } from "@features/auth/store/auth.store";
import { AuthApi } from "@features/auth/api/auth.api";

export const useLogout = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const refreshToken = useAuthStore((s) => s.refreshToken);

  return async () => {
    try {
      await AuthApi.logout(refreshToken);
    } catch (err) {
      console.warn("logout API failed, lanjut clear lokal", err);
    } finally {
      clearAuth();
      qc.clear();
      navigate("/auth/login", { replace: true });
    }
  };
};
