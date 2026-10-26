-- M1a: additive, OFF-by-default Merchant Commercial v2 period reservation.
-- No existing merchant is enrolled, no data backfill, no live routing change.
CREATE TYPE "MerchantAiRenderReservationStatus" AS ENUM ('RESERVED', 'SETTLED', 'RELEASED');

CREATE TABLE "MerchantAiRenderReservation" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantSessionId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "pricingVersion" TEXT NOT NULL,
    "entitlementVersion" TEXT NOT NULL,
    "includedRenderLimit" INTEGER NOT NULL,
    "status" "MerchantAiRenderReservationStatus" NOT NULL DEFAULT 'RESERVED',
    "tryOnTaskId" TEXT,
    "reservedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "settledAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MerchantAiRenderReservation_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "MerchantAiRenderReservation_period_order_check" CHECK ("periodStart" < "periodEnd"),
    CONSTRAINT "MerchantAiRenderReservation_allowance_positive_check" CHECK ("includedRenderLimit" > 0)
);

CREATE UNIQUE INDEX "MerchantAiRenderReservation_idempotencyKey_key"
ON "MerchantAiRenderReservation"("idempotencyKey");

CREATE UNIQUE INDEX "MerchantAiRenderReservation_tryOnTaskId_key"
ON "MerchantAiRenderReservation"("tryOnTaskId");

CREATE INDEX "MerchantAiRenderReservation_merchantId_periodStart_periodEnd_status_idx"
ON "MerchantAiRenderReservation"("merchantId", "periodStart", "periodEnd", "status");

CREATE INDEX "MerchantAiRenderReservation_merchantId_merchantSessionId_status_idx"
ON "MerchantAiRenderReservation"("merchantId", "merchantSessionId", "status");

ALTER TABLE "MerchantAiRenderReservation"
ADD CONSTRAINT "MerchantAiRenderReservation_merchantId_fkey"
FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MerchantAiRenderReservation"
ADD CONSTRAINT "MerchantAiRenderReservation_merchantSessionId_merchantId_fkey"
FOREIGN KEY ("merchantSessionId","merchantId") REFERENCES "MerchantSession"("id","merchantId")
ON DELETE RESTRICT ON UPDATE CASCADE;
