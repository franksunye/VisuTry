-- Additive Merchant activation observation ledger. Historical merchants are
-- intentionally not backfilled; only post-instrumentation state changes write
-- these milestones.
CREATE TABLE "MerchantActivationEvent" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "eventType" VARCHAR(80) NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" VARCHAR(16) NOT NULL,
    "correlationId" VARCHAR(96),
    "sessionId" VARCHAR(96),
    "dedupeKey" VARCHAR(240) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantActivationEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantActivationEvent_merchantId_dedupeKey_key"
    ON "MerchantActivationEvent"("merchantId", "dedupeKey");

CREATE INDEX "MerchantActivationEvent_merchantId_eventType_occurredAt_idx"
    ON "MerchantActivationEvent"("merchantId", "eventType", "occurredAt");

CREATE INDEX "MerchantActivationEvent_merchantId_sessionId_occurredAt_idx"
    ON "MerchantActivationEvent"("merchantId", "sessionId", "occurredAt");

ALTER TABLE "MerchantActivationEvent"
    ADD CONSTRAINT "MerchantActivationEvent_merchantId_fkey"
    FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
