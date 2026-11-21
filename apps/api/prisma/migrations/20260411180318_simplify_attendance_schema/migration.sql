/*
  Warnings:

  - You are about to drop the column `attendanceLocationId` on the `attendances` table. All the data in the column will be lost.
  - You are about to drop the column `shiftAssignmentId` on the `attendances` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_attendanceLocationId_fkey";

-- DropForeignKey
ALTER TABLE "attendances" DROP CONSTRAINT "attendances_shiftAssignmentId_fkey";

-- AlterTable
ALTER TABLE "attendance_locations" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "attendances" DROP COLUMN "attendanceLocationId",
DROP COLUMN "shiftAssignmentId",
ADD COLUMN     "shiftName" "ShiftName";

-- CreateIndex
CREATE INDEX "attendance_locations_isActive_idx" ON "attendance_locations"("isActive");

-- CreateIndex
CREATE INDEX "attendances_userId_date_idx" ON "attendances"("userId", "date");

-- CreateIndex
CREATE INDEX "attendances_workMode_date_idx" ON "attendances"("workMode", "date");
