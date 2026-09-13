-- G4-A: provider-independent commercial state and idempotent AI Commerce Session meter.
-- This migration is additive. It does not alter or delete Merchant, Store,
-- Campaign, Catalog, shopper, or analytics records.

ALTER TYPE "MerchantUsageKind" ADD VALUE 'AI_COMMERCE_SESSION';

ALTER TABLE "Merchant"
  ADD COLUMN "commercialStatus" TEXT;

ALTER TABLE "MerchantUsageLedger"
  ADD COLUMN "dedupeKey" TEXT;

CREATE UNIQUE INDEX "MerchantUsageLedger_dedupeKey_key"
  ON "MerchantUsageLedger"("dedupeKey");

CREATE INDEX "MerchantUsageLedger_merchantId_kind_createdAt_idx"
  ON "MerchantUsageLedger"("merchantId", "kind", "createdAt");

CREATE INDEX "Merchant_commercialStatus_idx"
  ON "Merchant"("commercialStatus");

ALTER TABLE "MerchantSession"
  ADD COLUMN "billableAICommerceSession" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "billableAICommerceSessionAt" TIMESTAMP(3);

CREATE INDEX "MerchantSession_merchantId_billableAICommerceSession_idx"
  ON "MerchantSession"("merchantId", "billableAICommerceSession");
