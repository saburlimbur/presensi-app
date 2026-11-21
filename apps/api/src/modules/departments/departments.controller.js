import { validate } from "../../utils/validate.js";
import departmentsService from "./departments.service.js";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  listDepartmentQuerySchema,
} from "./departments.model.js";
import { sendError } from "../../utils/error.js";

const getAllDepartments = async (req, res) => {
  try {
    const value = validate(listDepartmentQuerySchema, req.query);
    const result = await departmentsService.getAllDepartments(value);

    res.status(200).json({
      success: true,
      message: "daftar department berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await departmentsService.getDepartmentById(id);

    res.status(200).json({
      success: true,
      message: "detail department berhasil diambil",
      data: department,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const getDepartmentByCode = async (req, res) => {
  try {
    const code = String(req.params.code).toUpperCase();
    const department = await departmentsService.getDepartmentByCode(code);

    res.status(200).json({
      success: true,
      message: "detail department berhasil diambil",
      data: department,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const createDepartment = async (req, res) => {
  try {
    const value = validate(createDepartmentSchema, req.body);
    const department = await departmentsService.createDepartment(value);

    res.status(201).json({
      success: true,
      message: "department berhasil dibuat",
      data: department,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const value = validate(updateDepartmentSchema, req.body);
    const department = await departmentsService.updateDepartment(id, value);

    res.status(200).json({
      success: true,
      message: "department berhasil diperbarui",
      data: department,
    });
  } catch (error) {
    return sendError(res, error);
  }
};

const deleteDepartment = async (req, res) => {
  try {
    await departmentsService.deleteDepartment(req.params.id);
    res.status(200).json({
      success: true,
      message: "department berhasil dihapus",
    });
  } catch (error) {
    return sendError(res, error);
  }
};

export default {
  getAllDepartments,
  getDepartmentById,
  getDepartmentByCode,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
