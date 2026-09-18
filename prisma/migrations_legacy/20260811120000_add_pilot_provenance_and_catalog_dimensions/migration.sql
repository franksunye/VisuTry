ALTER TABLE "Merchant" ADD COLUMN "pilotType" TEXT NOT NULL DEFAULT 'LIVE';
ALTER TABLE "Merchant" ADD COLUMN "referenceData" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "MerchantFrame" ADD COLUMN "variant" TEXT;
ALTER TABLE "MerchantFrame" ADD COLUMN "lensWidthMm" INTEGER;
ALTER TABLE "MerchantFrame" ADD COLUMN "bridgeWidthMm" INTEGER;
ALTER TABLE "MerchantFrame" ADD COLUMN "templeLengthMm" INTEGER;
ALTER TABLE "MerchantFrame" ADD COLUMN "frameWidthMm" INTEGER;
ALTER TABLE "MerchantFrame" ADD COLUMN "collectionTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "MerchantFrame" ADD COLUMN "sourceNotes" TEXT;

ALTER TABLE "MerchantSession" ADD COLUMN "referenceData" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "MerchantEvent" ADD COLUMN "referenceData" BOOLEAN NOT NULL DEFAULT false;
