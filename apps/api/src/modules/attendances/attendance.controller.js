import { validate } from "../../utils/validate.js";
import {
  checkinModelSchema,
  checkoutModelSchema,
  adminListQuerySchema,
  adminExportQuerySchema,
  adminSummaryQuerySchema,
  adminCreateAttendanceSchema,
  myHistoryQuerySchema,
} from "./attendance.model.js";
import attendanceService from "./attendance.service.js";
import auditLogsService from "../audit_logs/audit_logs.service.js";
import { AUDIT_ACTIONS } from "../audit_logs/audit_logs.model.js";
import AppError, { sendError } from "../../utils/error.js";
import tokens from "../../lib/tokens.js";

const assertFaceVerified = (faceToken, userId) => {
  if (!tokens.isValidFaceToken(faceToken, userId)) {
    throw new AppError(
      "verifikasi wajah tidak valid atau sudah kedaluwarsa. ulangi verifikasi.",
      "FACE_VERIFICATION_REQUIRED",
      403,
    );
  }
};

const checkIn = async (req, res) => {
  try {
    const { faceToken, ...value } = validate(checkinModelSchema, req.body);
    assertFaceVerified(faceToken, req.user.id);

    const result = await attendanceService.checkIn(req.user.id, value, req.ip);

    return res.status(201).json({
      success: true,
      message: "check-in berhasil.",
      data: result,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const checkOut = async (req, res) => {
  try {
    const { faceToken, ...value } = validate(checkoutModelSchema, req.body);
    assertFaceVerified(faceToken, req.user.id);

    const result = await attendanceService.checkOut(req.user.id, value);
    return res.status(200).json({
      success: true,
      message: "check-out berhasil.",
      data: result,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getToday = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await attendanceService.getToday(userId);
    return res.status(200).json({
      success: true,
      message: "data absensi hari ini berhasil diambil.",
      data: result,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getMyHistory = async (req, res) => {
  try {
    const filters = validate(myHistoryQuerySchema, req.query);
    const userId = req.user.id;
    const result = await attendanceService.getMyHistory(userId, filters);
    return res.status(200).json({
      success: true,
      message: "riwayat absensi berhasil diambil.",
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const listActiveLocations = async (req, res) => {
  try {
    const result = await attendanceService.listActiveLocations();
    return res.status(200).json({
      success: true,
      message: "daftar lokasi kantor aktif berhasil diambil.",
      data: result,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const adminList = async (req, res) => {
  try {
    const value = validate(adminListQuerySchema, req.query);

    const result = await attendanceService.listAdmin(value);
    return res.status(200).json({
      success: true,
      message: "daftar absensi berhasil diambil.",
      data: result.items,
      pagination: result.pagination,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const adminExport = async (req, res) => {
  try {
    const value = validate(adminExportQuerySchema, req.query);

    const { workbook, filename } = await attendanceService.exportAdmin(value);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    return res.end();
  } catch (error) {
    return sendError(res, error);
  }
};

const adminSummary = async (req, res) => {
  try {
    const value = validate(adminSummaryQuerySchema, req.query);

    const result = await attendanceService.getSummaryAdmin(value.date);
    return res.status(200).json({
      success: true,
      message: "ringkasan absensi berhasil diambil.",
      data: result,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const adminDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await attendanceService.getDetailAdmin(id);
    return res.status(200).json({
      success: true,
      message: "detail absensi berhasil diambil.",
      data: result,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const adminCreateManual = async (req, res) => {
  try {
    const value = validate(adminCreateAttendanceSchema, req.body);

    const adminId = req.user.id;
    const result = await attendanceService.createManualAdmin(adminId, value);

    auditLogsService.log({
      userId: adminId,
      action: AUDIT_ACTIONS.ATTENDANCE_MANUAL_CREATED,
      details: `manual attendance for user ${value.userId} on ${value.date} — status: ${value.status}`,
    });

    return res.status(201).json({
      success: true,
      message: "absensi manual berhasil dibuat.",
      data: result,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export default {
  checkIn,
  checkOut,
  getToday,
  getMyHistory,
  listActiveLocations,
  adminList,
  adminExport,
  adminSummary,
  adminDetail,
  adminCreateManual,
};
