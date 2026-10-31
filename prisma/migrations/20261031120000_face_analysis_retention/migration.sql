ALTER TABLE "FaceAnalysisTask"
  ADD COLUMN "retentionStatus" "RetentionStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN "deleteFailCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastDeleteError" TEXT,
  ADD COLUMN "lastDeleteAttemptAt" TIMESTAMP(3);

CREATE INDEX "FaceAnalysisTask_retentionStatus_expiresAt_idx"
  ON "FaceAnalysisTask"("retentionStatus", "expiresAt");
