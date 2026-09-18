-- Try-On generation reliability baseline (Phase 1).
-- Additive telemetry tables. Independent of TryOnTask retention.
-- Does not alter provider selection, retry, timeout, or async behavior.
-- Unique (tryOnTaskId) and (requestId, attemptNumber) prevent duplicate telemetry rows.
-- Rollback: DROP TABLE "GenerationAttempt"; DROP TABLE "GenerationRequest"; DROP TYPE ...
-- Safe at current production volume: new empty tables, no rewrite of TryOnTask.

CREATE TYPE "GenerationTelemetryOrigin" AS ENUM ('CONSUMER', 'STORE', 'CAMPAIGN');
CREATE TYPE "GenerationRequestFinalStatus" AS ENUM ('STARTED', 'COMPLETED', 'FAILED');
CREATE TYPE "GenerationAttemptStatus" AS ENUM ('STARTED', 'SUBMITTED', 'COMPLETED', 'FAILED', 'TIMEOUT');
CREATE TYPE "GenerationErrorCode" AS ENUM (
  'PROVIDER_REJECTED',
  'PROVIDER_FAILED',
  'PROVIDER_TIMEOUT',
  'NETWORK_ERROR',
  'INVALID_INPUT',
  'CONTENT_POLICY',
  'UPLOAD_OR_ASSET_ERROR',
  'CALLBACK_ERROR',
  'INTERNAL_ERROR',
  'UNKNOWN'
);

CREATE TABLE "GenerationRequest" (
  "id" TEXT NOT NULL,
  "tryOnTaskId" TEXT NOT NULL,
  "origin" "GenerationTelemetryOrigin" NOT NULL,
  "userId" TEXT,
  "merchantId" TEXT,
  "storeId" TEXT,
  "campaignId" TEXT,
  "clientSubmissionId" TEXT,
  "generationType" TEXT NOT NULL,
  "requestedModel" TEXT,
  "requestedProvider" TEXT,
  "finalStatus" "GenerationRequestFinalStatus" NOT NULL DEFAULT 'STARTED',
  "startedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "endToEndDurationMs" INTEGER,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "finalErrorCode" "GenerationErrorCode",
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GenerationRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GenerationRequest_tryOnTaskId_key" ON "GenerationRequest"("tryOnTaskId");
CREATE INDEX "GenerationRequest_startedAt_idx" ON "GenerationRequest"("startedAt");
CREATE INDEX "GenerationRequest_origin_startedAt_idx" ON "GenerationRequest"("origin", "startedAt");
CREATE INDEX "GenerationRequest_finalStatus_startedAt_idx" ON "GenerationRequest"("finalStatus", "startedAt");
CREATE INDEX "GenerationRequest_requestedProvider_startedAt_idx" ON "GenerationRequest"("requestedProvider", "startedAt");
CREATE INDEX "GenerationRequest_requestedModel_startedAt_idx" ON "GenerationRequest"("requestedModel", "startedAt");
CREATE INDEX "GenerationRequest_finalErrorCode_startedAt_idx" ON "GenerationRequest"("finalErrorCode", "startedAt");
CREATE INDEX "GenerationRequest_merchantId_startedAt_idx" ON "GenerationRequest"("merchantId", "startedAt");

CREATE TABLE "GenerationAttempt" (
  "id" TEXT NOT NULL,
  "requestId" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "provider" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "providerTaskId" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "submitDurationMs" INTEGER,
  "providerDurationMs" INTEGER,
  "status" "GenerationAttemptStatus" NOT NULL DEFAULT 'STARTED',
  "errorCode" "GenerationErrorCode",
  "errorMessageNormalized" TEXT,
  "isTimeout" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GenerationAttempt_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GenerationAttempt_requestId_attemptNumber_key" ON "GenerationAttempt"("requestId", "attemptNumber");
CREATE INDEX "GenerationAttempt_requestId_status_idx" ON "GenerationAttempt"("requestId", "status");
CREATE INDEX "GenerationAttempt_provider_submittedAt_idx" ON "GenerationAttempt"("provider", "submittedAt");
CREATE INDEX "GenerationAttempt_status_submittedAt_idx" ON "GenerationAttempt"("status", "submittedAt");
CREATE INDEX "GenerationAttempt_providerTaskId_idx" ON "GenerationAttempt"("providerTaskId");
CREATE INDEX "GenerationAttempt_isTimeout_submittedAt_idx" ON "GenerationAttempt"("isTimeout", "submittedAt");

ALTER TABLE "GenerationAttempt"
  ADD CONSTRAINT "GenerationAttempt_requestId_fkey"
  FOREIGN KEY ("requestId") REFERENCES "GenerationRequest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
