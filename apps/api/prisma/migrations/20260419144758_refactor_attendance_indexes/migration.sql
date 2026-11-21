/*
  Warnings:

  - A unique constraint covering the columns `[userId,date]` on the table `attendances` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "attendances_userId_date_idx";

-- DropIndex
DROP INDEX "attendances_workMode_date_idx";

-- CreateIndex
CREATE INDEX "idx_date_status" ON "attendances"("date", "status");

-- CreateIndex
CREATE INDEX "idx_permission" ON "attendances"("permissionId");

-- CreateIndex
CREATE UNIQUE INDEX "attendances_userId_date_key" ON "attendances"("userId", "date");

-- CreateIndex
CREATE INDEX "idx_user_permission_status" ON "permissions"("userId", "status");

-- CreateIndex
CREATE INDEX "idx_user_status_start" ON "permissions"("userId", "status", "startDate");
