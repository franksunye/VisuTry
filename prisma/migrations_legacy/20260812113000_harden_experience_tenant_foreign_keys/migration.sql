-- Keep the experience scope tenant-consistent for all nullable Experience references.
-- PostgreSQL MATCH SIMPLE permits legacy rows where experienceId is NULL.

ALTER TABLE "MerchantSession"
  DROP CONSTRAINT IF EXISTS "MerchantSession_experienceId_fkey";

ALTER TABLE "MerchantIntent"
  DROP CONSTRAINT IF EXISTS "MerchantIntent_experienceId_fkey";

ALTER TABLE "MerchantEvent"
  DROP CONSTRAINT IF EXISTS "MerchantEvent_experienceId_fkey";

ALTER TABLE "MerchantSession"
  ADD CONSTRAINT "MerchantSession_experienceId_merchantId_fkey"
  FOREIGN KEY ("experienceId", "merchantId")
  REFERENCES "Experience"("id", "merchantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MerchantIntent"
  ADD CONSTRAINT "MerchantIntent_experienceId_merchantId_fkey"
  FOREIGN KEY ("experienceId", "merchantId")
  REFERENCES "Experience"("id", "merchantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MerchantEvent"
  ADD CONSTRAINT "MerchantEvent_experienceId_merchantId_fkey"
  FOREIGN KEY ("experienceId", "merchantId")
  REFERENCES "Experience"("id", "merchantId")
  ON DELETE RESTRICT ON UPDATE CASCADE;
