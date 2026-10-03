ALTER TABLE "MerchantBillingEvent"
  ADD COLUMN "stripePriceId" TEXT,
  ADD COLUMN "processingReason" TEXT,
  ADD COLUMN "duplicateCount" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lastDuplicateAt" TIMESTAMP(3);
