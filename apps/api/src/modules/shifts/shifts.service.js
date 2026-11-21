import shiftsRepository from "./shifts.repository.js";
import {
  NotFoundError,
  ConflictError,
  BadRequestError,
} from "../../utils/error.js";
import { minutesOfDayFromDbTime } from "../../utils/date.js";

const getAllShifts = async () => {
  return await shiftsRepository.findAll();
};

const getShiftById = async (id) => {
  return await shiftsRepository.findById(id);
};

const getActiveShift = async () => {
  return await shiftsRepository.findActiveShift();
};

const createNewShift = async (data) => {
  if (new Date(data.startTime) >= new Date(data.endTime)) {
    throw new BadRequestError(
      "waktu mulai tidak boleh lebih besar atau sama dengan waktu selesai",
    );
  }

  const existing = await shiftsRepository.findByName(data.name);
  if (existing) {
    throw new ConflictError(`shift dengan nama "${data.name}" sudah ada`);
  }

  const created = await shiftsRepository.create(data);

  if (created.isActive) {
    return await shiftsRepository.updateAndSetActive(created.id, {});
  }
  return created;
};

const updateShift = async (id, data) => {
  const existing = await shiftsRepository.findById(id);
  if (!existing) {
    throw new NotFoundError(`shift dengan id ${id}`);
  }

  const startsBeforeEnd =
    data.startTime && data.endTime
      ? new Date(data.startTime) < new Date(data.endTime)
      : minutesOfDayFromDbTime(data.startTime ?? existing.startTime) <
        minutesOfDayFromDbTime(data.endTime ?? existing.endTime);

  if (!startsBeforeEnd) {
    throw new BadRequestError(
      "waktu mulai tidak boleh lebih besar atau sama dengan waktu selesai",
    );
  }

  if (data.name) {
    const duplicate = await shiftsRepository.findByName(data.name, id);
    if (duplicate) {
      throw new ConflictError(`shift dengan nama "${data.name}" sudah ada`);
    }
  }

  if (data.isActive === true) {
    return await shiftsRepository.updateAndSetActive(id, data);
  }

  return await shiftsRepository.update(id, data);
};

const deleteShift = async (id) => {
  const existing = await shiftsRepository.findById(id);
  if (!existing) {
    throw new NotFoundError(`shift dengan id ${id}`);
  }

  return await shiftsRepository.destroy(id);
};

export default {
  getAllShifts,
  getShiftById,
  getActiveShift,
  createNewShift,
  updateShift,
  deleteShift,
};
