import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(timezone);

export const inJakarta = (input) => dayjs(input).tz("Asia/Jakarta");

export const toUtcDayStart = (input) => {
  const jkt = inJakarta(input);
  return new Date(
    Date.UTC(jkt.year(), jkt.month(), jkt.date()),
  );
};

export const toUtcNextDayStart = (input) => {
  const start = toUtcDayStart(input);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
};

export const addDaysUtcStart = (input, days) => {
  const start = toUtcDayStart(input);
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
};

export const minutesOfDayJakarta = (input) => {
  const jkt = inJakarta(input);
  return jkt.hour() * 60 + jkt.minute();
};

export const minutesOfDayFromDbTime = (timeColumn) => {
  const d = new Date(timeColumn);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};

export const formatJakartaDate = (input) => inJakarta(input).format("YYYY-MM-DD");
