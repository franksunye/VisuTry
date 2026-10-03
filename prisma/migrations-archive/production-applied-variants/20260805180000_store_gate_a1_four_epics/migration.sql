-- Gate A1 Four Epics: retention state machine, orphan blobs, abuse counters

DO $$ BEGIN
  CREATE TYPE "RetentionStatus" AS ENUM ('ACTIVE', 'PENDING_DELETE', 'DELETE_BLOCKED', 'DELETED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "TryOnTask" ADD COLUMN IF NOT EXISTS "retentionStatus" "RetentionStatus" NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE "TryOnTask" ADD COLUMN IF NOT EXISTS "deleteFailCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "TryOnTask" ADD COLUMN IF NOT EXISTS "lastDeleteError" TEXT;
ALTER TABLE "TryOnTask" ADD COLUMN IF NOT EXISTS "lastDeleteAttemptAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "TryOnTask_retentionStatus_expiresAt_idx"
  ON "TryOnTask"("retentionStatus", "expiresAt");
CREATE INDEX IF NOT EXISTS "TryOnTask_retentionStatus_deleteFailCount_lastDeleteAttemptAt_idx"
  ON "TryOnTask"("retentionStatus", "deleteFailCount", "lastDeleteAttemptAt");

ALTER TABLE "StoreAsset" ADD COLUMN IF NOT EXISTS "retentionStatus" "RetentionStatus" NOT NULL DEFAULT 'ACTIVE';
CREATE INDEX IF NOT EXISTS "StoreAsset_retentionStatus_expiresAt_idx"
  ON "StoreAsset"("retentionStatus", "expiresAt");
CREATE INDEX IF NOT EXISTS "StoreAsset_retentionStatus_deleteFailCount_lastDeleteAttemptAt_idx"
  ON "StoreAsset"("retentionStatus", "deleteFailCount", "lastDeleteAttemptAt");

CREATE TABLE IF NOT EXISTS "StoreOrphanBlob" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "pathname" TEXT,
  "merchantId" TEXT,
  "tryOnTaskId" TEXT,
  "failCount" INTEGER NOT NULL DEFAULT 0,
  "lastError" TEXT,
  "lastDeleteAttemptAt" TIMESTAMP(3),
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreOrphanBlob_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StoreOrphanBlob_url_key" ON "StoreOrphanBlob"("url");
CREATE INDEX IF NOT EXISTS "StoreOrphanBlob_deletedAt_failCount_lastDeleteAttemptAt_idx"
  ON "StoreOrphanBlob"("deletedAt", "failCount", "lastDeleteAttemptAt");
CREATE INDEX IF NOT EXISTS "StoreOrphanBlob_merchantId_idx" ON "StoreOrphanBlob"("merchantId");

DO $$ BEGIN
  ALTER TABLE "StoreOrphanBlob"
    ADD CONSTRAINT "StoreOrphanBlob_merchantId_fkey"
    FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "StoreAbuseCounter" (
  "id" TEXT NOT NULL,
  "merchantId" TEXT NOT NULL,
  "bucket" TEXT NOT NULL,
  "windowStart" TIMESTAMP(3) NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 0,
  "bytes" BIGINT NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StoreAbuseCounter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "StoreAbuseCounter_merchantId_bucket_windowStart_key"
  ON "StoreAbuseCounter"("merchantId", "bucket", "windowStart");
CREATE INDEX IF NOT EXISTS "StoreAbuseCounter_merchantId_bucket_idx"
  ON "StoreAbuseCounter"("merchantId", "bucket");

DO $$ BEGIN
  ALTER TABLE "StoreAbuseCounter"
    ADD CONSTRAINT "StoreAbuseCounter_merchantId_fkey"
    FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
