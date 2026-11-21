/*
  Warnings:

  - The values [SHIFT_ASSIGNED,SHIFT_UPDATED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `maxCapacity` on the `shifts` table. All the data in the column will be lost.
  - You are about to drop the `shift_assignments` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('ATTENDANCE_REMINDER', 'ATTENDANCE_CHECK_IN', 'ATTENDANCE_CHECK_OUT', 'PERMISSION_SUBMITTED', 'PERMISSION_APPROVED', 'PERMISSION_REJECTED', 'OVERTIME_SUBMITTED', 'OVERTIME_APPROVED', 'OVERTIME_REJECTED', 'ANNOUNCEMENT', 'SYSTEM');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "shift_assignments" DROP CONSTRAINT "shift_assignments_shiftId_fkey";

-- DropForeignKey
ALTER TABLE "shift_assignments" DROP CONSTRAINT "shift_assignments_userId_fkey";

-- AlterTable
ALTER TABLE "shifts" DROP COLUMN "maxCapacity";

-- DropTable
DROP TABLE "shift_assignments";

-- CreateIndex
CREATE INDEX "shifts_isActive_idx" ON "shifts"("isActive");
