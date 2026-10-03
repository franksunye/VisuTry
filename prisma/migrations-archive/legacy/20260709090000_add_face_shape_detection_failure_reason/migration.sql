-- AlterTable
ALTER TABLE "FaceShapeDetection" ADD COLUMN "failureReason" TEXT;

-- CreateIndex
CREATE INDEX "FaceShapeDetection_failureReason_createdAt_idx"
ON "FaceShapeDetection"("failureReason", "createdAt");
