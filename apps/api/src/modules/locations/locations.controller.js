import { validate } from "../../utils/validate.js";

import locationsService from "./locations.service.js";
import {
  createLocationSchema,
  updateLocationSchema,
  listLocationQuerySchema,
} from "./locations.model.js";
import { sendError } from "../../utils/error.js";
import logger from "../../utils/logger.js";

const getAllLocations = async (req, res) => {
  try {
    const value = validate(listLocationQuerySchema, req.query);
    const result = await locationsService.getAllLocations(value);

    return res.status(200).json({
      success: true,
      message: "daftar lokasi berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    logger.error(`get all locations error: ${error.message}`);
    return sendError(res, error);
  }
};

const getLocationById = async (req, res) => {
  try {
    const { id } = req.params;
    const location = await locationsService.getLocationById(id);

    return res.status(200).json({
      success: true,
      message: "detail lokasi berhasil diambil",
      data: location,
    });
  } catch (error) {
    logger.error(`get location by id error: ${error.message}`);
    return sendError(res, error);
  }
};

const createLocation = async (req, res) => {
  try {
    const value = validate(createLocationSchema, req.body);
    const location = await locationsService.createLocation(value);

    return res.status(201).json({
      success: true,
      message: "lokasi berhasil dibuat",
      data: location,
    });
  } catch (error) {
    logger.error(`create location error: ${error.message}`);
    return sendError(res, error);
  }
};

const updateLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const value = validate(updateLocationSchema, req.body);
    const location = await locationsService.updateLocation(id, value);

    return res.status(200).json({
      success: true,
      message: "lokasi berhasil diperbarui",
      data: location,
    });
  } catch (error) {
    logger.error(`update location error: ${error.message}`);
    return sendError(res, error);
  }
};

const deleteLocation = async (req, res) => {
  try {
    const { id } = req.params;
    await locationsService.deleteLocation(id);

    return res.status(200).json({
      success: true,
      message: "lokasi berhasil dihapus",
    });
  } catch (error) {
    logger.error(`delete location error: ${error.message}`);
    return sendError(res, error);
  }
};

export default {
  getAllLocations,
  getLocationById,
  createLocation,
  updateLocation,
  deleteLocation,
};
