ALTER TABLE "Merchant" ADD COLUMN "tryOnEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Merchant" ADD COLUMN "compareEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Merchant" ADD COLUMN "maxCompareFrames" INTEGER NOT NULL DEFAULT 2;
ALTER TABLE "Merchant" ADD COLUMN "inquiryEnabled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Merchant"
  ADD CONSTRAINT "Merchant_maxCompareFrames_check"
  CHECK ("maxCompareFrames" IN (2, 3, 4));
