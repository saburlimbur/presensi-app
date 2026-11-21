import { validate } from "../../utils/validate.js";

import auditLogsService from "./audit_logs.service.js";
import { listAuditLogsQuerySchema } from "./audit_logs.model.js";
import { sendError } from "../../utils/error.js";
import logger from "../../utils/logger.js";

const list = async (req, res) => {
  try {
    const value = validate(listAuditLogsQuerySchema, req.query);
    const result = await auditLogsService.list(value);

    return res.status(200).json({
      success: true,
      message: "daftar audit log berhasil diambil",
      data: result.data,
      pagination: result.pagination,
    });
  } catch (err) {
    logger.error(`list audit logs error: ${err.message}`);
    return sendError(res, err);
  }
};

export default {
  list,
};
