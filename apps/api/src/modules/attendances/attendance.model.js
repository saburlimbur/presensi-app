import Joi from "joi";

export const checkinModelSchema = Joi.object({
  workMode: Joi.string().valid("WFO", "WFA").required(),
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  gpsAccuracy: Joi.number().min(0).optional(),
  deviceInfo: Joi.string().optional(),
  note: Joi.string().optional(),
  faceToken: Joi.string().required(),
});

export const checkoutModelSchema = Joi.object({
  latitude: Joi.number().required(),
  longitude: Joi.number().required(),
  gpsAccuracy: Joi.number().min(0).optional(),
  faceToken: Joi.string().required(),
});

const ATTENDANCE_STATUSES = [
  "PRESENT",
  "LATE",
  "ABSENT",
  "SICK",
  "PERMIT",
  "ON_LEAVE",
  "HOLIDAY",
  "WORK_FROM_HOME",
];

const SHIFT_NAMES = [
  "MORNING",
  "AFTERNOON",
  "NIGHT",
  "FULL_DAY",
  "SPLIT_SHIFT",
  "FLEXIBLE",
];

export const adminListQuerySchema = Joi.object({
  date: Joi.date().iso().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().min(Joi.ref("dateFrom")).optional(),
  userId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional(),
  status: Joi.string()
    .valid(...ATTENDANCE_STATUSES)
    .optional(),
  workMode: Joi.string().valid("WFO", "WFA").optional(),
  shiftName: Joi.string()
    .valid(...SHIFT_NAMES)
    .optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
}).oxor("date", "dateFrom");

export const adminExportQuerySchema = Joi.object({
  date: Joi.date().iso().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().min(Joi.ref("dateFrom")).optional(),
  userId: Joi.string().uuid().optional(),
  departmentId: Joi.string().uuid().optional(),
  status: Joi.string()
    .valid(...ATTENDANCE_STATUSES)
    .optional(),
  workMode: Joi.string().valid("WFO", "WFA").optional(),
  shiftName: Joi.string()
    .valid(...SHIFT_NAMES)
    .optional(),
})
  .xor("date", "dateFrom")
  .and("dateFrom", "dateTo");

export const adminSummaryQuerySchema = Joi.object({
  date: Joi.date().iso().optional(),
});

export const myHistoryQuerySchema = Joi.object({
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().min(Joi.ref("dateFrom")).optional(),
  status: Joi.string()
    .valid(...ATTENDANCE_STATUSES)
    .optional(),
  workMode: Joi.string().valid("WFO", "WFA").optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export const adminCreateAttendanceSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  date: Joi.date().iso().required(),
  checkIn: Joi.date().iso().required(),
  checkOut: Joi.date().iso().min(Joi.ref("checkIn")).optional(),
  status: Joi.string()
    .valid(...ATTENDANCE_STATUSES)
    .required(),
  workMode: Joi.string().valid("WFO", "WFA").required(),
  shiftName: Joi.string()
    .valid(...SHIFT_NAMES)
    .optional(),
  latitudeIn: Joi.number().optional(),
  longitudeIn: Joi.number().optional(),
  latitudeOut: Joi.number().optional(),
  longitudeOut: Joi.number().optional(),
  note: Joi.string().max(500).optional(),
});
