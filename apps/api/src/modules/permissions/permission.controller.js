import { validate } from "../../utils/validate.js";
import { safeUnlink } from "../../utils/safe-unlink.js";
import fsp from "fs/promises";

import { sendError } from "../../utils/error.js";
import {
  submitPermissionSchema,
  approvePermissionSchema,
  rejectPermissionSchema,
  listPermissionsQuerySchema,
} from "./permission.model.js";
import permissionService from "./permission.service.js";
import auditLogsService from "../audit_logs/audit_logs.service.js";
import { AUDIT_ACTIONS } from "../audit_logs/audit_logs.model.js";
import logger from "../../utils/logger.js";
import { env } from "../../config/env.js";
import { uploadObject, removeObject } from "../../lib/storage.js";

const createUserPermission = async (req, res) => {
  let uploadedKey = null;
  try {
    const value = validate(submitPermissionSchema, req.body);

    if (req.file) {
      const buffer = await fsp.readFile(req.file.path);
      uploadedKey = await uploadObject(
        env.supabase.bucketDocs,
        req.file.filename,
        buffer,
        req.file.mimetype,
      );
    }

    const reqPermission = await permissionService.createPermission(
      req.user.id,
      {
        ...value,
        attachmentUrl: uploadedKey,
      },
    );

    return res.status(201).json({
      success: true,
      message: "pengajuan izin berhasil dibuat",
      data: reqPermission,
    });
  } catch (err) {
    if (uploadedKey) {
      await removeObject(env.supabase.bucketDocs, uploadedKey).catch(() => {});
    }
    logger.error(`create permission error: ${err.message}`);
    return sendError(res, err);
  } finally {
    if (req.file) await safeUnlink(req.file.path);
  }
};

const getMyPermission = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await permissionService.findPermissionByUserId(userId);

    return res.status(200).json({
      success: true,
      message: "data izin berhasil diambil",
      data,
    });
  } catch (err) {
    logger.error(`find permission error: ${err.message}`);
    return sendError(res, err);
  }
};

const getAllUserPermissions = async (req, res) => {
  try {
    const value = validate(listPermissionsQuerySchema, req.query);

    const result = await permissionService.findAllPermissions(value);

    return res.status(200).json({
      success: true,
      message: "daftar izin emloyee berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    logger.error(`all user permission error: ${err.message}`);
    return sendError(res, err);
  }
};

const getPermissionDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await permissionService.findPermissionById(id);

    return res.status(200).json({
      success: true,
      message: "detail izin berhasil diambil",
      data,
    });
  } catch (err) {
    logger.error(`get permission detail error: ${err.message}`);
    return sendError(res, err);
  }
};

const approvePermission = async (req, res) => {
  try {
    const { id } = req.params;
    const value = validate(approvePermissionSchema, req.body);
    const adminId = req.user.id;

    const data = await permissionService.approvePermission(
      adminId,
      id,
      value.note ?? null,
    );

    auditLogsService.log({
      userId: adminId,
      action: AUDIT_ACTIONS.PERMISSION_APPROVED,
      details: `approved permission ${id}${value.note ? ` — note: ${value.note}` : ""}`,
    });

    return res.status(200).json({
      success: true,
      message: "izin berhasil disetujui",
      data,
    });
  } catch (err) {
    logger.error(`approve permission error: ${err.message}`);
    return sendError(res, err);
  }
};

const rejectPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const value = validate(rejectPermissionSchema, req.body);
    const adminId = req.user.id;

    const data = await permissionService.rejectPermission(
      adminId,
      id,
      value.note,
    );

    auditLogsService.log({
      userId: adminId,
      action: AUDIT_ACTIONS.PERMISSION_REJECTED,
      details: `rejected permission ${id} — reason: ${value.note}`,
    });

    return res.status(200).json({
      success: true,
      message: "izin berhasil ditolak",
      data,
    });
  } catch (err) {
    logger.error(`reject permission error: ${err.message}`);
    return sendError(res, err);
  }
};

const cancelPermission = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const data = await permissionService.cancelPermission(userId, id);

    auditLogsService.log({
      userId,
      action: AUDIT_ACTIONS.PERMISSION_CANCELLED,
      details: `cancelled own permission ${id}`,
    });

    return res.status(200).json({
      success: true,
      message: "izin berhasil dibatalkan",
      data,
    });
  } catch (err) {
    logger.error(`cancel permission error: ${err.message}`);
    return sendError(res, err);
  }
};

export default {
  createUserPermission,
  getMyPermission,
  getAllUserPermissions,
  getPermissionDetail,
  approvePermission,
  rejectPermission,
  cancelPermission,
};
