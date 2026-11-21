/*
  Warnings:

  - A unique constraint covering the columns `[token]` on the table `user_password_resets` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `expiresAt` to the `user_password_resets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "user_password_resets" DROP CONSTRAINT "user_password_resets_userId_fkey";

-- AlterTable
ALTER TABLE "user_password_resets" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expiresAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "usedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "audit_logs_userId_createdAt_idx" ON "audit_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "user_password_resets_token_key" ON "user_password_resets"("token");

-- CreateIndex
CREATE INDEX "user_password_resets_userId_idx" ON "user_password_resets"("userId");

-- AddForeignKey
ALTER TABLE "user_password_resets" ADD CONSTRAINT "user_password_resets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
