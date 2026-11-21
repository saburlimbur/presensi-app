import { validate } from "../../utils/validate.js";
import { createShiftSchema, updateShiftSchema } from "./shifts.model.js";
import shiftsService from "./shifts.service.js";
import logger from "../../utils/logger.js";
import { sendError } from "../../utils/error.js";

const getAllShifts = async (req, res) => {
  try {
    const shifts = await shiftsService.getAllShifts();

    return res.status(200).json({
      success: true,
      message: "daftar shift berhasil diambil",
      data: shifts,
    });
  } catch (error) {
    logger.error(`get shifts error: ${error.message}`);

    return sendError(res, error);
  }
};

const getActiveShift = async (req, res) => {
  try {
    const shift = await shiftsService.getActiveShift();
    return res.status(200).json({
      success: true,
      message: "shift aktif berhasil diambil",
      data: shift,
    });
  } catch (error) {
    logger.error(`get active shift error: ${error.message}`);

    return sendError(res, error);
  }
};

const getShiftById = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await shiftsService.getShiftById(id);

    if (!shift) {
      return res.status(404).json({
        success: false,
        message: "shift tidak ditemukan",
      });
    }

    return res.status(200).json({
      success: true,
      message: "detail shift berhasil diambil",
      data: shift,
    });
  } catch (error) {
    logger.error(`get shift by id error: ${error.message}`);

    return sendError(res, error);
  }
};

const createShift = async (req, res) => {
  try {
    const value = validate(createShiftSchema, req.body);
    const shift = await shiftsService.createNewShift(value);

    return res.status(201).json({
      success: true,
      message: "shift berhasil dibuat",
      data: shift,
    });
  } catch (error) {
    logger.error(`create shift error: ${error.message}`);

    return sendError(res, error);
  }
};

const updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const value = validate(updateShiftSchema, req.body);
    const shift = await shiftsService.updateShift(id, value);

    return res.status(200).json({
      success: true,
      message: "shift berhasil diperbarui",
      data: shift,
    });
  } catch (error) {
    logger.error(`update shift error: ${error.message}`);

    return sendError(res, error);
  }
};

const deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    await shiftsService.deleteShift(id);

    return res.status(200).json({
      success: true,
      message: "shift berhasil dihapus",
    });
  } catch (error) {
    logger.error(`delete shift error: ${error.message}`);

    return sendError(res, error);
  }
};

export default {
  getAllShifts,
  getActiveShift,
  createShift,
  updateShift,
  deleteShift,
  getShiftById,
};
