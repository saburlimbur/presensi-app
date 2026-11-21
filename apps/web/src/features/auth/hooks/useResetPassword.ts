import { useMutation } from "@tanstack/react-query";

import { AuthApi } from "@features/auth/api/auth.api";
import type { MessageResponse } from "@features/auth/@types";

type ResetPayload = { token: string; newPassword: string };

export const useResetPassword = () => {
  const mutation = useMutation<MessageResponse, Error, ResetPayload>({
    mutationKey: ["reset-password"],
    mutationFn: (data) => AuthApi.resetPassword(data),
  });

  return { resetPassword: mutation.mutate, isPending: mutation.isPending };
};
