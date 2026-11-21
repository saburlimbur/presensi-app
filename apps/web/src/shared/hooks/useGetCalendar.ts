import { useQuery } from "@tanstack/react-query";
import AxiosApiCalendar from "@shared/api/api-calendar";

export interface Holiday {
  date: string;
  name: string;
}

interface NagerHoliday {
  date: string;
  localName: string;
  name: string;
}

export const useGetCalendar = (year?: number) => {
  const target = year ?? new Date().getFullYear();

  const {
    data: calendarExternal,
    isLoading,
    isError,
  } = useQuery<Holiday[]>({
    queryKey: ["calendar", target],
    queryFn: async () => {
      const response = await AxiosApiCalendar.get<NagerHoliday[]>(
        `/api/v3/PublicHolidays/${target}/ID`,
      );
      return Array.isArray(response.data)
        ? response.data.map((h) => ({ date: h.date, name: h.localName }))
        : [];
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  return { calendarExternal, isLoading, isError };
};
