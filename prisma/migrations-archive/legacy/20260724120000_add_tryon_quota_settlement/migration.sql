-- Add durable, idempotent quota settlement state for Try-On tasks.
ALTER TABLE "TryOnTask"
ADD COLUMN "quotaSettledAt" TIMESTAMP(3),
ADD COLUMN "quotaSource" TEXT;

-- Historical completed tasks were handled by the legacy completion routes.
-- Mark them settled during migration so they can never be charged again.
UPDATE "TryOnTask"
SET "quotaSettledAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
WHERE "status" = 'COMPLETED';

CREATE INDEX "TryOnTask_status_quotaSettledAt_idx"
ON "TryOnTask"("status", "quotaSettledAt");
