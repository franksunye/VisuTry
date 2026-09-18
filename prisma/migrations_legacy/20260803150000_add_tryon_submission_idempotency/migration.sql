-- Persist client submission IDs outside JSON metadata so retries and concurrent
-- requests cannot create duplicate billable TryOnTask records.
ALTER TABLE "TryOnTask"
ADD COLUMN "clientSubmissionId" TEXT;

CREATE UNIQUE INDEX "TryOnTask_userId_clientSubmissionId_key"
ON "TryOnTask"("userId", "clientSubmissionId");
