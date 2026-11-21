import express from "express";

import leaveBalanceController from "./leave-balance.controller.js";
import { authMiddleware } from "../../middleware/auth.middleware.js";
import { adminMiddleware } from "../../middleware/admin.middleware.js";

const leaveBalanceRoutes = express.Router();

leaveBalanceRoutes.get(
  "/leave-balances/my-balance",
  authMiddleware,
  leaveBalanceController.getMyBalance,
);

leaveBalanceRoutes.get(
  "/leave-balances",
  authMiddleware,
  adminMiddleware,
  leaveBalanceController.getAllBalances,
);

leaveBalanceRoutes.post(
  "/leave-balances",
  authMiddleware,
  adminMiddleware,
  leaveBalanceController.createBalance,
);

leaveBalanceRoutes.get(
  "/leave-balances/by-user/:userId",
  authMiddleware,
  adminMiddleware,
  leaveBalanceController.getBalancesByUserId,
);

leaveBalanceRoutes.patch(
  "/leave-balances/:id",
  authMiddleware,
  adminMiddleware,
  leaveBalanceController.updateBalance,
);

export default leaveBalanceRoutes;
