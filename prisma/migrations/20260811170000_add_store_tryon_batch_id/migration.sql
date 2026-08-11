ALTER TABLE "TryOnTask" ADD COLUMN "batchId" TEXT;

UPDATE "TryOnTask"
SET "batchId" = "metadata"->>'batchId'
WHERE "metadata" IS NOT NULL
  AND "metadata" ? 'batchId'
  AND "batchId" IS NULL;

CREATE INDEX "TryOnTask_merchantSessionId_batchId_idx"
  ON "TryOnTask"("merchantSessionId", "batchId");
