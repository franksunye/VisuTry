-- G4-B: additive Merchant billing identity and verified event ledger.
-- No existing Merchant is backfilled or changed by this migration.
CREATE TABLE "MerchantBillingAccount" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'STRIPE',
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "subscriptionStatus" TEXT,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "lastEventCreatedAt" INTEGER,
    "lastEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MerchantBillingAccount_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MerchantBillingEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'STRIPE',
    "providerEventId" TEXT NOT NULL,
    "merchantId" TEXT,
    "billingAccountId" TEXT,
    "eventType" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "eventCreatedAt" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'PROCESSED',
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MerchantBillingEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantBillingAccount_stripeCustomerId_key" ON "MerchantBillingAccount"("stripeCustomerId");
CREATE UNIQUE INDEX "MerchantBillingAccount_stripeSubscriptionId_key" ON "MerchantBillingAccount"("stripeSubscriptionId");
CREATE UNIQUE INDEX "MerchantBillingAccount_stripeCheckoutSessionId_key" ON "MerchantBillingAccount"("stripeCheckoutSessionId");
CREATE UNIQUE INDEX "MerchantBillingAccount_merchantId_provider_key" ON "MerchantBillingAccount"("merchantId", "provider");
CREATE INDEX "MerchantBillingAccount_merchantId_idx" ON "MerchantBillingAccount"("merchantId");
CREATE INDEX "MerchantBillingAccount_stripeSubscriptionId_idx" ON "MerchantBillingAccount"("stripeSubscriptionId");
CREATE UNIQUE INDEX "MerchantBillingEvent_provider_providerEventId_key" ON "MerchantBillingEvent"("provider", "providerEventId");
CREATE INDEX "MerchantBillingEvent_merchantId_createdAt_idx" ON "MerchantBillingEvent"("merchantId", "createdAt");
CREATE INDEX "MerchantBillingEvent_billingAccountId_createdAt_idx" ON "MerchantBillingEvent"("billingAccountId", "createdAt");

ALTER TABLE "MerchantBillingAccount" ADD CONSTRAINT "MerchantBillingAccount_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MerchantBillingEvent" ADD CONSTRAINT "MerchantBillingEvent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MerchantBillingEvent" ADD CONSTRAINT "MerchantBillingEvent_billingAccountId_fkey" FOREIGN KEY ("billingAccountId") REFERENCES "MerchantBillingAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
