-- Store Gate A1: asset delete retry fields + usage ledger uniqueness

ALTER TABLE "StoreAsset" ADD COLUMN IF NOT EXISTS "deleteFailCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "StoreAsset" ADD COLUMN IF NOT EXISTS "lastDeleteError" TEXT;
ALTER TABLE "StoreAsset" ADD COLUMN IF NOT EXISTS "lastDeleteAttemptAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "StoreAsset_deletedAt_deleteFailCount_lastDeleteAttemptAt_idx"
  ON "StoreAsset"("deletedAt", "deleteFailCount", "lastDeleteAttemptAt");

-- Deduplicate ledger rows that would violate the new unique constraint (keep oldest).
DELETE FROM "MerchantUsageLedger" a
USING "MerchantUsageLedger" b
WHERE a."tryOnTaskId" IS NOT NULL
  AND a."tryOnTaskId" = b."tryOnTaskId"
  AND a."kind" = b."kind"
  AND a."createdAt" > b."createdAt";

CREATE UNIQUE INDEX IF NOT EXISTS "MerchantUsageLedger_tryOnTaskId_kind_key"
  ON "MerchantUsageLedger"("tryOnTaskId", "kind");
