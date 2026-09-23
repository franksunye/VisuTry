ALTER TABLE "Merchant" ADD COLUMN "sponsoredUsagePolicyKey" TEXT;

CREATE TYPE "MerchantSponsoredUsageType" AS ENUM ('SPONSORED_GENERATION', 'SPONSORED_COMPARE');
CREATE TYPE "MerchantSponsoredUsageStatus" AS ENUM ('RESERVED', 'CONSUMED', 'RELEASED');

CREATE TABLE "MerchantSponsoredUsage" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantSessionId" TEXT,
    "experienceId" TEXT,
    "userId" TEXT,
    "shopperIdentityHash" TEXT NOT NULL,
    "usageType" "MerchantSponsoredUsageType" NOT NULL,
    "status" "MerchantSponsoredUsageStatus" NOT NULL DEFAULT 'RESERVED',
    "idempotencyKey" TEXT NOT NULL,
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "consumedAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantSponsoredUsage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantSponsoredUsage_idempotencyKey_key"
  ON "MerchantSponsoredUsage"("idempotencyKey");
CREATE INDEX "MerchantSponsoredUsage_merchantId_shopperIdentityHash_usageType_createdAt_idx"
  ON "MerchantSponsoredUsage"("merchantId", "shopperIdentityHash", "usageType", "createdAt");
CREATE INDEX "MerchantSponsoredUsage_merchantId_userId_usageType_createdAt_idx"
  ON "MerchantSponsoredUsage"("merchantId", "userId", "usageType", "createdAt");
CREATE INDEX "MerchantSponsoredUsage_status_reservedAt_idx"
  ON "MerchantSponsoredUsage"("status", "reservedAt");

ALTER TABLE "MerchantSponsoredUsage"
  ADD CONSTRAINT "MerchantSponsoredUsage_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "MerchantSponsoredUsage_merchantSessionId_fkey"
  FOREIGN KEY ("merchantSessionId") REFERENCES "MerchantSession"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "MerchantSponsoredUsage_experienceId_fkey"
  FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "MerchantSponsoredUsage_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
