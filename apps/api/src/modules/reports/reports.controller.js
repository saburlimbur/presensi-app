import { validate } from "../../utils/validate.js";

import reportsService from "./reports.service.js";
import {
  monthlyAttendanceQuerySchema,
  weeklyAttendanceQuerySchema,
  rangeAttendanceQuerySchema,
} from "./reports.model.js";
import { sendError } from "../../utils/error.js";
import logger from "../../utils/logger.js";

const getMonthlyAttendanceReport = async (req, res) => {
  try {
    const value = validate(monthlyAttendanceQuerySchema, req.query);
    const data = await reportsService.getMonthlyAttendanceReport(value);

    return res.status(200).json({
      success: true,
      message: "rekap kehadiran bulanan berhasil diambil",
      data,
    });
  } catch (error) {
    logger.error(`get monthly attendance report error: ${error.message}`);

    return sendError(res, error);
  }
};

const getWeeklyAttendanceReport = async (req, res) => {
  try {
    const value = validate(weeklyAttendanceQuerySchema, req.query);
    const data = await reportsService.getWeeklyAttendanceReport(value);

    return res.status(200).json({
      success: true,
      message: "rekap kehadiran mingguan berhasil diambil",
      data,
    });
  } catch (error) {
    logger.error(`get weekly attendance report error: ${error.message}`);

    return sendError(res, error);
  }
};

const getRangeAttendanceReport = async (req, res) => {
  try {
    const value = validate(rangeAttendanceQuerySchema, req.query);
    const data = await reportsService.getRangeAttendanceReport(value);

    return res.status(200).json({
      success: true,
      message: "rekap kehadiran berdasarkan rentang tanggal berhasil diambil",
      data,
    });
  } catch (error) {
    logger.error(`get range attendance report error: ${error.message}`);

    return sendError(res, error);
  }
};

export default {
  getMonthlyAttendanceReport,
  getWeeklyAttendanceReport,
  getRangeAttendanceReport,
};
