-- Architecture consolidation P0: session acquisition + merchant commercial entitlement.

-- Merchant commercial entitlement (provider-independent, versionable)
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "planCode" TEXT;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "commercialStage" TEXT;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "pricingVersion" TEXT;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "entitlementVersion" TEXT;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "commerceSessionAllowance" INTEGER;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "standardRenderAllowance" INTEGER;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "premiumRenderAllowance" INTEGER;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "campaignAllowance" INTEGER;
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "entitlementEffectiveFrom" TIMESTAMP(3);
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "billingPeriodEnd" TIMESTAMP(3);
ALTER TABLE "Merchant" ADD COLUMN IF NOT EXISTS "commercialExceptionCode" TEXT;

CREATE INDEX IF NOT EXISTS "Merchant_planCode_idx" ON "Merchant"("planCode");

-- MerchantSession acquisition / campaign context
ALTER TABLE "MerchantSession" ADD COLUMN IF NOT EXISTS "source" TEXT;
ALTER TABLE "MerchantSession" ADD COLUMN IF NOT EXISTS "medium" TEXT;
ALTER TABLE "MerchantSession" ADD COLUMN IF NOT EXISTS "campaign" TEXT;
ALTER TABLE "MerchantSession" ADD COLUMN IF NOT EXISTS "referrer" TEXT;
ALTER TABLE "MerchantSession" ADD COLUMN IF NOT EXISTS "landingUrl" TEXT;
ALTER TABLE "MerchantSession" ADD COLUMN IF NOT EXISTS "aiAgentSource" TEXT;

CREATE INDEX IF NOT EXISTS "MerchantSession_merchantId_source_idx" ON "MerchantSession"("merchantId", "source");
CREATE INDEX IF NOT EXISTS "MerchantSession_merchantId_campaign_idx" ON "MerchantSession"("merchantId", "campaign");
