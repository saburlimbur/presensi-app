import AxiosApiService from "@shared/api/api-service";
import type { UpdateProfileValues } from "@features/users/validation/profile.validation";

type UpdatePasswordPayload = {
  oldPassword: string;
  newPassword: string;
};

export const UsersApi = {
  getMe: async () => {
    const res = await AxiosApiService.get("/users/profile");
    return res.data.data;
  },

  updateMe: async (data: UpdateProfileValues) => {
    const res = await AxiosApiService.patch("/users/profile", data);
    return res.data;
  },

  updateMyPhoto: async (file: File) => {
    const formData = new FormData();
    formData.append("profile_photo", file);
    const res = await AxiosApiService.patch("/users/profile/photo", formData);
    return res.data;
  },

  updateMyPassword: async (data: UpdatePasswordPayload) => {
    const res = await AxiosApiService.patch("/users/password", data);
    return res.data;
  },
};
