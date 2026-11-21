-- AlterTable
ALTER TABLE "attendances" ADD COLUMN     "gpsAccuracyIn" DOUBLE PRECISION,
ADD COLUMN     "gpsAccuracyOut" DOUBLE PRECISION,
ADD COLUMN     "permissionId" CHAR(36);

-- AddForeignKey
ALTER TABLE "attendances" ADD CONSTRAINT "attendances_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;
