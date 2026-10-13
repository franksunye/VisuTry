-- Factory #406: bounded tenant-scoped, durable idempotency reservations.
-- No automatic replay or implicit authorization of an external mutation.
CREATE TABLE "MerchantFactoryOperation" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "operationId" VARCHAR(96) NOT NULL,
    "actorId" VARCHAR(120) NOT NULL,
    "action" VARCHAR(60) NOT NULL,
    "targetType" VARCHAR(20) NOT NULL,
    "targetId" VARCHAR(120) NOT NULL,
    "fingerprint" VARCHAR(64) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
    "beforeState" JSONB,
    "receipt" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MerchantFactoryOperation_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MerchantFactoryOperation_merchantId_operationId_key"
    ON "MerchantFactoryOperation"("merchantId", "operationId");
CREATE INDEX "MerchantFactoryOperation_merchantId_status_updatedAt_idx"
    ON "MerchantFactoryOperation"("merchantId", "status", "updatedAt");
ALTER TABLE "MerchantFactoryOperation" ADD CONSTRAINT "MerchantFactoryOperation_merchantId_fkey"
    FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
