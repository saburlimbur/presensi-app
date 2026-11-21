import AxiosApiService from "@shared/api/api-service";
import type { AuthResponse, MessageResponse } from "@features/auth/@types";
import type { LoginFormValues } from "@features/auth/validation/login.validation";

type ForgotPasswordPayload = { email: string };
type ResetPasswordPayload = { token: string; newPassword: string };

export const AuthApi = {
  login: async (data: LoginFormValues): Promise<AuthResponse> => {
    const res = await AxiosApiService.post<AuthResponse>("/users/login", data);
    return res.data;
  },

  logout: async (refreshToken: string | null) => {
    const res = await AxiosApiService.post("/users/logout", { refreshToken });
    return res.data;
  },

  forgotPassword: async (
    payload: ForgotPasswordPayload,
  ): Promise<MessageResponse> => {
    const res = await AxiosApiService.post<MessageResponse>(
      "/users/password/forgot",
      payload,
    );
    return res.data;
  },

  resetPassword: async (
    payload: ResetPasswordPayload,
  ): Promise<MessageResponse> => {
    const res = await AxiosApiService.post<MessageResponse>(
      "/users/password/reset",
      payload,
    );
    return res.data;
  },
};
