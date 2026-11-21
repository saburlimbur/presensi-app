import leaveBalanceRepository from "./leave-balance.repository.js";
import { paginationMeta } from "../../utils/pagination.js";
import { inJakarta } from "../../utils/date.js";
import { DEFAULT_ANNUAL_QUOTA } from "./leave-balance.model.js";
import {
  LeaveBalanceNotFoundError,
  LeaveBalanceAlreadyExistsError,
} from "./errors/leave-balance.error.js";
import { BadRequestError } from "../../utils/error.js";

const currentJakartaYear = () => inJakarta(new Date()).year();

const getMyBalance = async (userId, year) => {
  const targetYear = year ?? currentJakartaYear();
  let balance = await leaveBalanceRepository.findByUserAndYear(
    userId,
    targetYear,
  );

  if (!balance && targetYear === currentJakartaYear()) {
    balance = await initForUser(userId, targetYear);
  }

  if (!balance) throw new LeaveBalanceNotFoundError(targetYear);
  return balance;
};

const getAllBalances = async ({ page, limit, search, userId, year }) => {
  const skip = (page - 1) * limit;
  const { data, total } = await leaveBalanceRepository.findAll({
    skip,
    take: limit,
    search,
    userId,
    year,
  });

  return {
    data,
    pagination: paginationMeta({ total, page, limit }),
  };
};

const getBalancesByUserId = async (userId) => {
  return await leaveBalanceRepository.findManyByUser(userId);
};

const createBalance = async (payload) => {
  const { userId, year, annualQuota, carryOverDays } = payload;
  const remainingDays = annualQuota + carryOverDays;

  return await leaveBalanceRepository.create({
    userId,
    year,
    annualQuota,
    carryOverDays,
    usedDays: 0,
    remainingDays,
  });
};

const updateBalance = async (id, payload) => {
  const existing = await leaveBalanceRepository.findById(id);
  if (!existing) throw new LeaveBalanceNotFoundError();

  const annualQuota = payload.annualQuota ?? existing.annualQuota;
  const carryOverDays = payload.carryOverDays ?? existing.carryOverDays;

  const remainingDays = annualQuota + carryOverDays - existing.usedDays;
  if (remainingDays < 0) {
    throw new BadRequestError(
      `kuota tidak boleh di bawah cuti yang sudah terpakai (${existing.usedDays} hari)`,
    );
  }

  return await leaveBalanceRepository.update(id, {
    annualQuota,
    carryOverDays,
    remainingDays,
  });
};

const initForUser = async (userId, year) => {
  const targetYear = year ?? currentJakartaYear();
  const existing = await leaveBalanceRepository.findByUserAndYear(
    userId,
    targetYear,
  );
  if (existing) return existing;

  try {
    return await leaveBalanceRepository.create({
      userId,
      year: targetYear,
      annualQuota: DEFAULT_ANNUAL_QUOTA,
      usedDays: 0,
      remainingDays: DEFAULT_ANNUAL_QUOTA,
      carryOverDays: 0,
    });
  } catch (err) {
    if (err instanceof LeaveBalanceAlreadyExistsError) {
      return await leaveBalanceRepository.findByUserAndYear(userId, targetYear);
    }
    throw err;
  }
};

export default {
  getMyBalance,
  getAllBalances,
  getBalancesByUserId,
  createBalance,
  updateBalance,
  initForUser,
};
