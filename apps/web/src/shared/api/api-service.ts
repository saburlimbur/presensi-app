import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import {
  getAccessToken,
  getRefreshToken,
  useAuthStore,
} from "@features/auth/store/auth.store";

export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("VITE_API_BASE_URL belum di-set. Lihat .env.example.");
}

const AxiosApiService = axios.create({
  baseURL: API_BASE_URL,
  timeout: 50000,
});

let refreshPromise: Promise<string> | null = null;

const requestNewAccessToken = async (): Promise<string> => {
  const res = await axios.post<{
    data: { accessToken: string; isFaceRegistered?: boolean };
  }>(
    `${API_BASE_URL}/users/refresh-token`,
    { refreshToken: getRefreshToken() },
    { timeout: 15000 },
  );

  const { accessToken: newAccessToken, isFaceRegistered } = res.data.data;
  useAuthStore.getState().setAccessToken(newAccessToken);
  if (typeof isFaceRegistered === "boolean") {
    useAuthStore.getState().setFaceRegistered(isFaceRegistered);
  }
  return newAccessToken;
};

const refreshAccessToken = () => {
  refreshPromise ??= requestNewAccessToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
};

const isRejectedRefresh = (err: unknown) =>
  !getRefreshToken() ||
  (axios.isAxiosError(err) &&
    [400, 401, 403].includes(err.response?.status ?? 0));

const PUBLIC_PATHS = [
  "/users/login",
  "/users/refresh-token",
  "/users/password/forgot",
  "/users/password/reset",
];
const isPublicPath = (url?: string) =>
  !!url && PUBLIC_PATHS.some((p) => url.includes(p));

AxiosApiService.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

AxiosApiService.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;

    if (
      error.response?.status === 401 &&
      config &&
      !config._retry &&
      !isPublicPath(config.url)
    ) {
      config._retry = true;

      try {
        await refreshAccessToken();
      } catch (refreshErr) {
        if (isRejectedRefresh(refreshErr)) {
          useAuthStore.getState().clearAuth();
          if (window.location.pathname !== "/auth/login") {
            window.location.href = "/auth/login";
          }
        }
        return Promise.reject(refreshErr);
      }

      return AxiosApiService.request(config);
    }

    if ((error.response?.status ?? 0) >= 500) {
      console.error("Server error:", error.response?.data);
    }

    return Promise.reject(error);
  },
);

export default AxiosApiService;
