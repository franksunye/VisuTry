-- Phase 1 validation: additive measurement columns only.
-- Does not alter provider selection, retry, timeout, or async behavior.
-- Safe at current production volume: new nullable/defaulted columns + indexes,
-- no table rewrite of existing business data, no FK to TryOnTask.

-- Rollback (manual, after deploy if needed):
--   DROP INDEX IF EXISTS "GenerationAttempt_failureStage_submittedAt_idx";
--   DROP INDEX IF EXISTS "GenerationRequest_failureStage_startedAt_idx";
--   DROP INDEX IF EXISTS "GenerationRequest_environment_startedAt_idx";
--   DROP INDEX IF EXISTS "GenerationRequest_isTest_startedAt_idx";
--   ALTER TABLE "GenerationAttempt" DROP COLUMN IF EXISTS "failureStage";
--   ALTER TABLE "GenerationAttempt" DROP COLUMN IF EXISTS "attemptDurationMs";
--   ALTER TABLE "GenerationRequest" DROP COLUMN IF EXISTS "failureStage";
--   ALTER TABLE "GenerationRequest" DROP COLUMN IF EXISTS "environment";
--   ALTER TABLE "GenerationRequest" DROP COLUMN IF EXISTS "isTest";
--   DROP TYPE IF EXISTS "GenerationFailureStage";

CREATE TYPE "GenerationFailureStage" AS ENUM (
  'SUBMIT',
  'PROVIDER_PROCESSING',
  'POLL_NETWORK',
  'STALE_DISPATCH',
  'ASSET_UPLOAD',
  'INTERNAL',
  'UNKNOWN'
);

ALTER TABLE "GenerationRequest"
  ADD COLUMN "failureStage" "GenerationFailureStage",
  ADD COLUMN "isTest" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "environment" TEXT;

ALTER TABLE "GenerationAttempt"
  ADD COLUMN "attemptDurationMs" INTEGER,
  ADD COLUMN "failureStage" "GenerationFailureStage";

CREATE INDEX "GenerationRequest_isTest_startedAt_idx"
  ON "GenerationRequest"("isTest", "startedAt");
CREATE INDEX "GenerationRequest_environment_startedAt_idx"
  ON "GenerationRequest"("environment", "startedAt");
CREATE INDEX "GenerationRequest_failureStage_startedAt_idx"
  ON "GenerationRequest"("failureStage", "startedAt");
CREATE INDEX "GenerationAttempt_failureStage_submittedAt_idx"
  ON "GenerationAttempt"("failureStage", "submittedAt");
