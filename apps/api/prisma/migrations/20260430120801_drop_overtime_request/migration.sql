/*
  Warnings:

  - The values [OVERTIME_SUBMITTED,OVERTIME_APPROVED,OVERTIME_REJECTED] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `overtime_requests` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('ATTENDANCE_REMINDER', 'ATTENDANCE_CHECK_IN', 'ATTENDANCE_CHECK_OUT', 'PERMISSION_SUBMITTED', 'PERMISSION_APPROVED', 'PERMISSION_REJECTED', 'ANNOUNCEMENT', 'SYSTEM');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "overtime_requests" DROP CONSTRAINT "overtime_requests_approvedBy_fkey";

-- DropForeignKey
ALTER TABLE "overtime_requests" DROP CONSTRAINT "overtime_requests_userId_fkey";

-- DropTable
DROP TABLE "overtime_requests";

-- DropEnum
DROP TYPE "OvertimeStatus";
