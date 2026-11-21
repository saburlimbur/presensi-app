import bus, { EVENTS } from "./events.js";
import logger from "../utils/logger.js";

const userClients = new Map();
const adminClients = new Set();

const writeEvent = (res, eventName, payload) => {
  try {
    res.write(`event: ${eventName}\n`);
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  } catch (err) {
    logger.warn(`SSE write failed: ${err.message}`);
  }
};

const writeHeartbeat = (res) => {
  try {
    res.write(`:\n\n`);
  } catch {
  }
};

export const registerUserClient = (userId, res) => {
  let pool = userClients.get(userId);
  if (!pool) {
    pool = new Set();
    userClients.set(userId, pool);
  }
  pool.add(res);
  logger.info(`SSE connect: user=${userId} (pool=${pool.size})`);
};

export const registerAdminClient = (res) => {
  adminClients.add(res);
  logger.info(`SSE connect: admin (pool=${adminClients.size})`);
};

export const removeClient = (userId, res) => {
  const pool = userClients.get(userId);
  if (pool) {
    pool.delete(res);
    if (pool.size === 0) userClients.delete(userId);
  }
  adminClients.delete(res);
};

export const sendToUser = (userId, eventName, payload) => {
  const pool = userClients.get(userId);
  if (!pool || pool.size === 0) return 0;
  for (const res of pool) writeEvent(res, eventName, payload);
  return pool.size;
};

export const sendToAdmins = (eventName, payload) => {
  if (adminClients.size === 0) return 0;
  for (const res of adminClients) writeEvent(res, eventName, payload);
  return adminClients.size;
};

setInterval(() => {
  for (const pool of userClients.values()) {
    for (const res of pool) writeHeartbeat(res);
  }
  for (const res of adminClients) writeHeartbeat(res);
}, 25_000).unref();

bus.on(EVENTS.PERMISSION_SUBMITTED, (payload) => {
  sendToAdmins(EVENTS.PERMISSION_SUBMITTED, payload);
});

bus.on(EVENTS.PERMISSION_DECIDED, (payload) => {
  if (payload?.userId) sendToUser(payload.userId, EVENTS.PERMISSION_DECIDED, payload);
});

bus.on(EVENTS.PERMISSION_CANCELLED, (payload) => {
  sendToAdmins(EVENTS.PERMISSION_CANCELLED, payload);
});

bus.on(EVENTS.ATTENDANCE_CHECKED_IN, (payload) => {
  sendToAdmins(EVENTS.ATTENDANCE_CHECKED_IN, payload);
});

bus.on(EVENTS.ATTENDANCE_CHECKED_OUT, (payload) => {
  sendToAdmins(EVENTS.ATTENDANCE_CHECKED_OUT, payload);
});

export default {
  registerUserClient,
  registerAdminClient,
  removeClient,
  sendToUser,
  sendToAdmins,
};
