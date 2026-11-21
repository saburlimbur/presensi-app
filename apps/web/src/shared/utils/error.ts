import { isAxiosError } from "axios";

export const getErrorMessage = (err: unknown, fallback: string): string =>
  (isAxiosError<{ message?: string }>(err) && err.response?.data?.message) ||
  fallback;
