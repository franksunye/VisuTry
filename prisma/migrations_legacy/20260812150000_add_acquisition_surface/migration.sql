ALTER TABLE "MerchantSession" ADD COLUMN "acquisitionSurface" TEXT;

CREATE INDEX "MerchantSession_merchantId_acquisitionSurface_idx"
  ON "MerchantSession"("merchantId", "acquisitionSurface");
