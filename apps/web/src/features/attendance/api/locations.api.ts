import AxiosApiService from "@shared/api/api-service";
import type { Location, LocationsResponse } from "@features/attendance/@types";

interface RawLocation {
  id: string;
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  lat?: number;
  lng?: number;
  radiusMeters?: number;
}

const normalizeLocation = (raw: RawLocation): Location => {
  return {
    id: raw.id,
    name: raw.name,
    address: raw.address,
    lat: raw.lat ?? raw.latitude ?? 0,
    lng: raw.lng ?? raw.longitude ?? 0,
    radiusMeters: raw.radiusMeters ?? raw.radius ?? 0,
  };
};

export const LocationsApi = {
  list: async (): Promise<LocationsResponse> => {
    const res = await AxiosApiService.get("/attendance/locations");
    const body = res.data as {
      success: boolean;
      message?: string;
      data: RawLocation[];
    };
    return {
      success: body.success,
      data: Array.isArray(body.data) ? body.data.map(normalizeLocation) : [],
    };
  },
};
