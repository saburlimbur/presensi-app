import AxiosApiService from "@shared/api/api-service";
import type { FaceRecognizeResponse } from "@features/attendance/@types";
import type { MyFacesResponse, ResetFaceResponse } from "@features/faces/@types";

export const FacesApi = {
  enroll: (files: File[]) => {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("user_faces", file);
    });

    return AxiosApiService.post("/faces/enroll", formData);
  },

  verify: async (file: File): Promise<FaceRecognizeResponse> => {
    const formData = new FormData();
    formData.append("attendance_photo", file);

    const res = await AxiosApiService.post("/faces/recognize", formData);
    return res.data;
  },

  listMe: async (): Promise<MyFacesResponse> => {
    const res = await AxiosApiService.get("/faces/my-embeddings");
    return res.data;
  },

  resetMe: async (): Promise<ResetFaceResponse> => {
    const res = await AxiosApiService.delete("/faces/reset");
    return res.data;
  },
};
