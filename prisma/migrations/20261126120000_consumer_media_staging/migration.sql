CREATE TABLE "ConsumerMediaStaging" (
    "reference" TEXT NOT NULL,
    "cleanupAfter" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ConsumerMediaStaging_pkey" PRIMARY KEY ("reference")
);

CREATE INDEX "ConsumerMediaStaging_cleanupAfter_idx" ON "ConsumerMediaStaging"("cleanupAfter");

ALTER TABLE "User" ADD COLUMN "retentionDeletedEmailPendingAt" TIMESTAMP(3);
