-- CreateEnum
CREATE TYPE "WorkMode" AS ENUM ('WFO', 'WFA');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ATTENDANCE_REMINDER', 'ATTENDANCE_CHECK_IN', 'ATTENDANCE_CHECK_OUT', 'PERMISSION_SUBMITTED', 'PERMISSION_APPROVED', 'PERMISSION_REJECTED', 'OVERTIME_SUBMITTED', 'OVERTIME_APPROVED', 'OVERTIME_REJECTED', 'SHIFT_ASSIGNED', 'SHIFT_UPDATED', 'ANNOUNCEMENT', 'SYSTEM');

-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "workMode" "WorkMode" NOT NULL DEFAULT 'WFO';

-- AlterTable
ALTER TABLE "shift_assignments" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "shifts" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- CreateTable
CREATE TABLE "notifications" (
    "id" CHAR(36) NOT NULL,
    "userId" CHAR(36) NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "data" JSONB,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_userId_readAt_idx" ON "notifications"("userId", "readAt");

-- CreateIndex
CREATE INDEX "notifications_userId_createdAt_idx" ON "notifications"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
