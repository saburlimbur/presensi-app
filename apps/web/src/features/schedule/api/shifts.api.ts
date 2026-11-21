import AxiosApiService from "@shared/api/api-service";
import type { ActiveShiftResponse } from "@features/schedule/@types";

const toHHmm = (value: unknown): string => {
  if (typeof value !== "string") return "";
  const m = value.match(/T(\d{2}:\d{2})/) ?? value.match(/^(\d{2}:\d{2})/);
  return m ? m[1] : "";
};

export const ShiftsApi = {
  getActiveMe: async (): Promise<ActiveShiftResponse> => {
    const res = await AxiosApiService.get("/shifts/active");
    const body = res.data as {
      success: boolean;
      message?: string;
      data: Record<string, unknown> | null;
    };
    const raw = body.data;

    return {
      success: body.success,
      message: body.message,
      data: raw
        ? {
            id: String(raw.id),
            name: String(raw.name),
            startTime: toHHmm(raw.startTime),
            endTime: toHHmm(raw.endTime),
            location: null,
          }
        : null,
    };
  },
};
