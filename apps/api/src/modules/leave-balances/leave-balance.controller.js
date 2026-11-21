import { validate } from "../../utils/validate.js";

import {
  createLeaveBalanceSchema,
  updateLeaveBalanceSchema,
  listLeaveBalanceSchema,
  myBalanceQuerySchema,
} from "./leave-balance.model.js";
import leaveBalanceService from "./leave-balance.service.js";
import auditLogsService from "../audit_logs/audit_logs.service.js";
import { AUDIT_ACTIONS } from "../audit_logs/audit_logs.model.js";
import logger from "../../utils/logger.js";
import { sendError } from "../../utils/error.js";

const getMyBalance = async (req, res) => {
  try {
    const value = validate(myBalanceQuerySchema, req.query);
    const balance = await leaveBalanceService.getMyBalance(
      req.user.id,
      value.year,
    );

    return res.status(200).json({
      success: true,
      message: "saldo cuti berhasil diambil",
      data: balance,
    });
  } catch (error) {
    logger.error(`get my leave balance error: ${error.message}`);
    return sendError(res, error);
  }
};

const getAllBalances = async (req, res) => {
  try {
    const value = validate(listLeaveBalanceSchema, req.query);
    const result = await leaveBalanceService.getAllBalances(value);

    return res.status(200).json({
      success: true,
      message: "daftar saldo cuti berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error(`get all leave balances error: ${error.message}`);
    return sendError(res, error);
  }
};

const getBalancesByUserId = async (req, res) => {
  try {
    const { userId } = req.params;
    const data = await leaveBalanceService.getBalancesByUserId(userId);

    return res.status(200).json({
      success: true,
      message: "riwayat saldo cuti karyawan berhasil diambil",
      data,
    });
  } catch (error) {
    logger.error(`get balances by user error: ${error.message}`);
    return sendError(res, error);
  }
};

const createBalance = async (req, res) => {
  try {
    const value = validate(createLeaveBalanceSchema, req.body);
    const balance = await leaveBalanceService.createBalance(value);

    auditLogsService.log({
      userId: req.user.id,
      action: AUDIT_ACTIONS.LEAVE_BALANCE_CREATED,
      details: `created leave balance for user ${balance.userId} year ${balance.year} — quota ${balance.annualQuota}`,
    });

    return res.status(201).json({
      success: true,
      message: "saldo cuti berhasil dibuat",
      data: balance,
    });
  } catch (error) {
    logger.error(`create leave balance error: ${error.message}`);
    return sendError(res, error);
  }
};

const updateBalance = async (req, res) => {
  try {
    const value = validate(updateLeaveBalanceSchema, req.body);
    const { id } = req.params;
    const balance = await leaveBalanceService.updateBalance(id, value);

    auditLogsService.log({
      userId: req.user.id,
      action: AUDIT_ACTIONS.LEAVE_BALANCE_UPDATED,
      details: `updated leave balance ${id} for user ${balance.userId} year ${balance.year}`,
    });

    return res.status(200).json({
      success: true,
      message: "saldo cuti berhasil diperbarui",
      data: balance,
    });
  } catch (error) {
    logger.error(`update leave balance error: ${error.message}`);
    return sendError(res, error);
  }
};

export default {
  getMyBalance,
  getAllBalances,
  getBalancesByUserId,
  createBalance,
  updateBalance,
};
