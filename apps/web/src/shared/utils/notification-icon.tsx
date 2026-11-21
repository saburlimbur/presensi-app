import { CalendarClock, CheckCircle2, Clock3 } from "lucide-react";
import type { NotificationType } from "@shared/@types/notification";

export const getNotificationIcon = (type: NotificationType, size = 14) => {
  if (type.startsWith("ATTENDANCE")) {
    return <Clock3 size={size} className="text-warning" />;
  }
  if (type.startsWith("PERMISSION")) {
    return <CalendarClock size={size} className="text-info" />;
  }
  return <CheckCircle2 size={size} className="text-success" />;
};
