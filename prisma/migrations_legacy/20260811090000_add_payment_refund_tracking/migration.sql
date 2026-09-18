-- Track Stripe refunds and the credits adjustment performed by the support refund tool.
ALTER TABLE "Payment"
ADD COLUMN "refundId" TEXT,
ADD COLUMN "refundedAt" TIMESTAMP(3),
ADD COLUMN "creditsRevoked" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "Payment_refundId_key" ON "Payment"("refundId");
