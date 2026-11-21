import { inJakarta, formatJakartaDate } from "./date.js";
import {
  buildWorkbook,
  buildExportFilename as buildGenericFilename,
} from "./excel-export.js";

const formatDate = (d) => (d ? formatJakartaDate(d) : "");
const formatTime = (d) => (d ? inJakarta(d).format("HH:mm:ss") : "");

const computeDurationHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return null;
  const ms = new Date(checkOut) - new Date(checkIn);
  return Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
};

const ATTENDANCE_COLUMNS = [
  {
    header: "No",
    key: "no",
    width: 6,
  },
  {
    header: "Tanggal",
    key: "date",
    width: 12,
  },
  {
    header: "Employee ID",
    key: "employeeId",
    width: 14,
  },
  {
    header: "Nama",
    key: "fullName",
    width: 24,
  },
  {
    header: "Email",
    key: "email",
    width: 28,
  },
  {
    header: "Departemen",
    key: "department",
    width: 18,
  },
  {
    header: "Jabatan",
    key: "position",
    width: 18,
  },
  {
    header: "Shift",
    key: "shiftName",
    width: 12,
  },
  {
    header: "Work Mode",
    key: "workMode",
    width: 10,
  },
  {
    header: "Check In",
    key: "checkIn",
    width: 10,
  },
  {
    header: "Check Out",
    key: "checkOut",
    width: 10,
  },
  {
    header: "Durasi (jam)",
    key: "duration",
    width: 12,
  },
  {
    header: "Status",
    key: "status",
    width: 12,
  },
  {
    header: "Lokasi In",
    key: "locIn",
    width: 22,
  },
  {
    header: "Lokasi Out",
    key: "locOut",
    width: 22,
  },
  {
    header: "Catatan",
    key: "note",
    width: 30,
  },
];

const mapAttendanceRow = (a, idx) => ({
  no: idx + 1,
  date: formatDate(a.date),
  employeeId: a.user?.employeeId ?? "",
  fullName: a.user?.fullName ?? "",
  email: a.user?.email ?? "",
  department: a.user?.department?.name ?? "",
  position: a.user?.position ?? "",
  shiftName: a.shiftName ?? "",
  workMode: a.workMode ?? "",
  checkIn: formatTime(a.checkIn),
  checkOut: a.checkOut ? formatTime(a.checkOut) : "-",
  duration: computeDurationHours(a.checkIn, a.checkOut) ?? "-",
  status: a.status ?? "",
  locIn:
    a.latitudeIn != null && a.longitudeIn != null
      ? `${a.latitudeIn},${a.longitudeIn}`
      : "",
  locOut:
    a.latitudeOut != null && a.longitudeOut != null
      ? `${a.latitudeOut},${a.longitudeOut}`
      : "",
  note: a.note ?? "",
});

export const buildAttendanceWorkbook = (items, filters) =>
  buildWorkbook({
    sheets: [
      {
        name: "Attendances",
        columns: ATTENDANCE_COLUMNS,
        rows: items.map(mapAttendanceRow),
      },
    ],
    filters,
  });

export const buildExportFilename = (filters) =>
  buildGenericFilename("attendances", filters);
