-- Store dispatch and result-persistence leases must be first-class columns so
-- acquisition and stale-owner fencing can be expressed in one atomic UPDATE.
ALTER TABLE "TryOnTask"
  ADD COLUMN "dispatchLeaseOwner" TEXT,
  ADD COLUMN "dispatchLeaseUntil" TIMESTAMP(3),
  ADD COLUMN "dispatchVersion" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "resultPersistLeaseOwner" TEXT,
  ADD COLUMN "resultPersistLeaseUntil" TIMESTAMP(3),
  ADD COLUMN "resultPersistVersion" INTEGER NOT NULL DEFAULT 0;

-- Preserve leases held by requests that started before this migration. New
-- application writes stop using JSON as the source of truth.
UPDATE "TryOnTask"
SET
  "dispatchLeaseOwner" = 'legacy:' || "id",
  -- A short conservative grace window avoids parsing malformed legacy JSON
  -- and prevents an in-flight pre-deploy request from being reclaimed.
  "dispatchLeaseUntil" =
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + INTERVAL '2 minutes',
  "dispatchVersion" = 1
WHERE jsonb_typeof("metadata"->'dispatchLeaseUntil') = 'string';

UPDATE "TryOnTask"
SET
  "resultPersistLeaseOwner" = 'legacy:' || "id",
  "resultPersistLeaseUntil" =
    (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') + INTERVAL '1 minute',
  "resultPersistVersion" = 1
WHERE jsonb_typeof("metadata"->'resultPersistLeaseUntil') = 'string';

CREATE INDEX "TryOnTask_origin_status_dispatchLeaseUntil_idx"
  ON "TryOnTask"("origin", "status", "dispatchLeaseUntil");
