import AxiosApiService from "@shared/api/api-service";
import type {
  ApiEnvelope,
  CreatePermissionPayload,
  PermissionRequest,
} from "@features/request/@types";

export const PermissionsApi = {
  create: async (
    payload: CreatePermissionPayload,
  ): Promise<ApiEnvelope<PermissionRequest>> => {
    const formData = new FormData();
    formData.append("type", payload.type);
    formData.append("startDate", payload.startDate);
    formData.append("endDate", payload.endDate);
    if (payload.reason) formData.append("reason", payload.reason);
    if (payload.permission_attachment) {
      formData.append("permission_attachment", payload.permission_attachment);
    }

    const res = await AxiosApiService.post("/permissions/request", formData);
    return res.data;
  },

  listMyPermission: async (): Promise<ApiEnvelope<PermissionRequest[]>> => {
    const res = await AxiosApiService.get("/permissions/my-permission");
    return res.data;
  },

  cancel: async (id: string): Promise<ApiEnvelope<PermissionRequest>> => {
    const res = await AxiosApiService.patch(`/permissions/${id}/cancel`);
    return res.data;
  },

};
