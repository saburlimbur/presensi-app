import departmentsRepository from "./departments.repository.js";
import { paginationMeta } from "../../utils/pagination.js";
import {
  NotFoundError,
  ConflictError,
  isUniqueViolation,
} from "../../utils/error.js";

const rethrowHeadError = (err) => {
  if (isUniqueViolation(err, "headId")) {
    throw new ConflictError("user sudah menjadi kepala department lain");
  }
  if (err?.code === "P2003") {
    throw new NotFoundError("user kepala department");
  }
  throw err;
};

const getAllDepartments = async ({
  page = 1,
  limit = 10,
  search,
  code,
  name,
}) => {
  const skip = (page - 1) * limit;

  const { data, total } = await departmentsRepository.findAll({
    skip,
    take: limit,
    search,
    code,
    name,
  });

  return {
    data,
    pagination: paginationMeta({ total, page, limit }),
  };
};

const getDepartmentById = async (id) => {
  const department = await departmentsRepository.findById(id);
  if (!department) {
    throw new NotFoundError("department");
  }
  return department;
};

const getDepartmentByCode = async (code) => {
  const department = await departmentsRepository.findByCode(code);
  if (!department) {
    throw new NotFoundError("department");
  }
  return department;
};

const createDepartment = async (data) => {
  const existDepartmentCode = await departmentsRepository.findByCode(data.code);
  if (existDepartmentCode) {
    throw new ConflictError("kode department sudah terdaftar");
  }

  return await departmentsRepository.create(data).catch(rethrowHeadError);
};

const updateDepartment = async (id, data) => {
  const exist = await departmentsRepository.findById(id);
  if (!exist) {
    throw new NotFoundError("department");
  }

  if (data.code && data.code !== exist.code) {
    const existDepartmentCode = await departmentsRepository.findByCode(
      data.code,
      id,
    );
    if (existDepartmentCode) {
      throw new ConflictError("kode department sudah terdaftar");
    }
  }

  return await departmentsRepository.update(id, data).catch(rethrowHeadError);
};

const deleteDepartment = async (id) => {
  const exist = await departmentsRepository.findById(id);
  if (!exist) {
    throw new NotFoundError("department");
  }

  return await departmentsRepository.deleteById(id);
};

export default {
  getAllDepartments,
  getDepartmentById,
  getDepartmentByCode,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
