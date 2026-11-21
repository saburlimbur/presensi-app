export interface CalendarProps {
  currentDate: Date
  setCurrentDate: (date: Date) => void
  selectedDate: number
  setSelectedDate: (date: number) => void
}

export interface ActiveShift {
  id: string;
  name: string;
  startTime: string; // "08:00"
  endTime: string; // "17:00"
  location?: {
    id: string;
    name: string;
    address?: string;
  } | null;
}

export interface ActiveShiftResponse {
  success: boolean;
  message?: string;
  data: ActiveShift | null;
}
