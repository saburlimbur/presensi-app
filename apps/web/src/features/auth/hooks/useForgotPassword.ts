import { useMutation } from "@tanstack/react-query";

import { AuthApi } from "@features/auth/api/auth.api";
import type { MessageResponse } from "@features/auth/@types";

export const useForgotPassword = () => {
  const mutation = useMutation<MessageResponse, Error, {
    email: string
  }>({
    mutationKey: ["forgot-password"],
    mutationFn: (data) => AuthApi.forgotPassword(data),
  });

  return { forgotPassword: mutation.mutate, isPending: mutation.isPending };
};
