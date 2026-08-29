-- Add the provider-independent commercial identity to the verified billing
-- event ledger. This is additive and does not mutate existing billing data.
ALTER TABLE "MerchantBillingEvent"
  ADD COLUMN "planCode" TEXT;

CREATE INDEX "MerchantBillingEvent_merchantId_planCode_status_idx"
  ON "MerchantBillingEvent"("merchantId", "planCode", "status");

-- Existing rows intentionally remain NULL. The pre-migration projection does
-- not safely distinguish a historical one-time Pilot checkout from a
-- subscription checkout after a Stripe Price rotation. A later, explicitly
-- audited operator migration may populate planCode only from verified receipt
-- evidence; this migration never guesses or rewrites provider events.
