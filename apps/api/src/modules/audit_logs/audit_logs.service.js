import auditLogsRepository from "./audit_logs.repository.js";
import { getPagination, paginationMeta } from "../../utils/pagination.js";
import logger from "../../utils/logger.js";

const log = async ({ userId, action, details }) => {
  try {
    return await auditLogsRepository.create({
      userId: userId ?? null,
      action,
      details: details ?? null,
    });
  } catch (err) {
    logger.error(`audit log failed (${action}): ${err.message}`);
    return null;
  }
};

const list = async ({
  page = 1,
  limit = 20,
  userId,
  action,
  dateFrom,
  dateTo,
}) => {
  const paging = getPagination(page, limit);

  const { data, total } = await auditLogsRepository.findMany({
    skip: paging.skip,
    take: paging.take,
    userId,
    action,
    dateFrom,
    dateTo,
  });

  return {
    data,
    pagination: paginationMeta({ total, ...paging }),
  };
};

export default {
  log,
  list,
};
