import locationsRepository from "./locations.repository.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import { NotFoundError, ConflictError } from "../../utils/error.js";

const getAllLocations = async (query) => {
  const paging = getPagination(query.page, query.limit);

  const { data, total } = await locationsRepository.findAll({
    skip: paging.skip,
    take: paging.take,
    search: query.search,
    isActive: query.isActive,
  });

  return {
    data,
    pagination: paginationMeta({ total, ...paging }),
  };
};

const getLocationById = async (id) => {
  const location = await locationsRepository.findById(id);
  if (!location) {
    throw new NotFoundError("lokasi");
  }
  return location;
};

const createLocation = async (data) => {
  const duplicate = await locationsRepository.findByName(data.name);
  if (duplicate) {
    throw new ConflictError(`lokasi dengan nama "${data.name}" sudah ada`);
  }
  return await locationsRepository.create(data);
};

const updateLocation = async (id, data) => {
  const existing = await locationsRepository.findById(id);
  if (!existing) {
    throw new NotFoundError("lokasi");
  }

  if (data.name && data.name !== existing.name) {
    const duplicate = await locationsRepository.findByName(data.name, id);
    if (duplicate) {
      throw new ConflictError(`lokasi dengan nama "${data.name}" sudah ada`);
    }
  }

  return await locationsRepository.update(id, data);
};

const deleteLocation = async (id) => {
  const existing = await locationsRepository.findById(id);
  if (!existing) {
    throw new NotFoundError("lokasi");
  }
  return await locationsRepository.softDelete(id);
};

export default {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
};
