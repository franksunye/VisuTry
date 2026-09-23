-- Persist the complete Stripe Checkout lifecycle, including report context.
ALTER TABLE "Payment"
ADD COLUMN "unlockTaskId" TEXT,
ADD COLUMN "statusReason" TEXT,
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "failedAt" TIMESTAMP(3);

CREATE INDEX "Payment_unlockTaskId_idx" ON "Payment"("unlockTaskId");
