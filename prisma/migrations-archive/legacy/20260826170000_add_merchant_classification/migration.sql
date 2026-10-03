-- G0: canonical Merchant classification for Admin/business analysis.
-- This metadata is additive. It is not an authorization boundary and does not
-- delete, rewrite, publish, or expose shopper/session/intent records.

CREATE TYPE "MerchantClassification" AS ENUM (
  'REAL',
  'POSSIBLE_EXTERNAL',
  'INTERNAL',
  'TEST',
  'AUTOMATION',
  'REFERENCE',
  'SUSPICIOUS',
  'UNKNOWN'
);

ALTER TABLE "Merchant"
  ADD COLUMN "classification" "MerchantClassification" NOT NULL DEFAULT 'UNKNOWN',
  ADD COLUMN "classificationSource" VARCHAR(80),
  ADD COLUMN "classificationReason" TEXT;

CREATE INDEX "Merchant_classification_idx" ON "Merchant"("classification");

-- The mapping is keyed by stable Merchant IDs and uses only audit evidence;
-- no raw email or other PII is stored in the reason text.
UPDATE "Merchant" SET "classification" = 'REFERENCE', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Seeded REFERENCE pilot with referenceData=true and no ownership membership.' WHERE "id" = 'cmsoere1s0000n5fy1kbvpecs';
UPDATE "Merchant" SET "classification" = 'REFERENCE', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Seeded REFERENCE pilot with referenceData=true and no ownership membership.' WHERE "id" = 'cmsor0lvi00006wi81kr12rkw';
UPDATE "Merchant" SET "classification" = 'REFERENCE', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Seeded REFERENCE pilot with referenceData=true and no ownership membership.' WHERE "id" = 'cmsos85wx0000goi856lvrqq4';
UPDATE "Merchant" SET "classification" = 'REFERENCE', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Seeded REFERENCE pilot with referenceData=true and no ownership membership.' WHERE "id" = 'cmsotuyga0000xzi8ed15j0sk';
UPDATE "Merchant" SET "classification" = 'REFERENCE', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Seeded REFERENCE pilot with referenceData=true and no ownership membership.' WHERE "id" = 'cmsovc43q00003ai87qtpyf2r';

UPDATE "Merchant" SET "classification" = 'INTERNAL', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'VisuTry-owned internal demo seed with pilotType=INTERNAL and demo activity.' WHERE "id" = 'cmsq1vcg3000049fy2ngsqplk';
UPDATE "Merchant" SET "classification" = 'TEST', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Golden Path test fixture with example.test and test credential lifecycle activity.' WHERE "id" = 'cmsrbe9qc000b04jotskfikmz';
UPDATE "Merchant" SET "classification" = 'AUTOMATION', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'VisuTry-owned agent automation with repeated source inspection, import, and Store writes.' WHERE "id" = 'cmsspfn70000704jm5j3z10uk';
UPDATE "Merchant" SET "classification" = 'TEST', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Cloudflare B1 test fixture with VisuTry-owned test operations.' WHERE "id" = 'adcf6c19-0d1d-4013-8903-4d7a86da0662';
UPDATE "Merchant" SET "classification" = 'TEST', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Cloudflare B1 test fixture with repeated agent audit writes.' WHERE "id" = '60317b20-ed05-42dc-aa71-b7c763e3bc0b';
UPDATE "Merchant" SET "classification" = 'TEST', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Cloudflare B1 test fixture with invalid website marker.' WHERE "id" = 'b8a61016-5811-41a2-b0a6-8252a1551563';
UPDATE "Merchant" SET "classification" = 'TEST', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Staging routing test fixture.' WHERE "id" = '3f1d3aff-4dfa-4ff7-a0f8-fc12788a125c';
UPDATE "Merchant" SET "classification" = 'AUTOMATION', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Reconciliation smoke automation fixture.' WHERE "id" = 'b7233205-5856-449b-b710-69bbcabbd859';

UPDATE "Merchant" SET "classification" = 'POSSIBLE_EXTERNAL', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Owner-linked self-service workspace; no verified commercial activation evidence.' WHERE "id" = 'cmsrptoun000704kwepb7ajcu';
UPDATE "Merchant" SET "classification" = 'POSSIBLE_EXTERNAL', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Owner-linked self-service workspace; no verified commercial activation evidence.' WHERE "id" = 'cmsrtj25p000h04lazbei4rbn';
UPDATE "Merchant" SET "classification" = 'POSSIBLE_EXTERNAL', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Owner-linked self-service workspace with credential audit only; activation not verified.' WHERE "id" = 'cmst4djr9000504jzup5jixo8';
UPDATE "Merchant" SET "classification" = 'POSSIBLE_EXTERNAL', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Owner-linked self-service workspace with credential audit only; activation not verified.' WHERE "id" = 'cmstfbgvi000804kwqu1w79v3';
UPDATE "Merchant" SET "classification" = 'POSSIBLE_EXTERNAL', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Owner-linked self-service workspace; no verified commercial activation evidence.' WHERE "id" = 'cmsvf5dqt000b04jrflnt3vcd';
UPDATE "Merchant" SET "classification" = 'POSSIBLE_EXTERNAL', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Owner-linked self-service workspace with credential audit only; activation not verified.' WHERE "id" = 'cmsxcaolm000704lh6tabe15j';
UPDATE "Merchant" SET "classification" = 'POSSIBLE_EXTERNAL', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Owner-linked self-service workspace; no verified commercial activation evidence.' WHERE "id" = '41545ca7-0649-41a1-a589-cdfedb675e41';
UPDATE "Merchant" SET "classification" = 'POSSIBLE_EXTERNAL', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Owner-linked self-service workspace; no verified commercial activation evidence.' WHERE "id" = '28c61131-f0af-4250-a3e2-4f5eb651b956';
UPDATE "Merchant" SET "classification" = 'POSSIBLE_EXTERNAL', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Owner-linked self-service workspace; no verified commercial activation evidence.' WHERE "id" = '40ef9b58-776d-442e-8fa7-126cc2d9de6f';
UPDATE "Merchant" SET "classification" = 'POSSIBLE_EXTERNAL', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Owner-linked self-service workspace; no verified commercial activation evidence.' WHERE "id" = 'fb143c70-0419-4003-a8dd-de0bd8a35464';
UPDATE "Merchant" SET "classification" = 'POSSIBLE_EXTERNAL', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Owner-linked self-service workspace with an insights view; activation not verified.' WHERE "id" = 'f3b74bbb-ab32-4941-a77f-7a55eabeaeca';
UPDATE "Merchant" SET "classification" = 'POSSIBLE_EXTERNAL', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'External eyewear URL observed; business ownership and commercial activation are not verified.' WHERE "id" = 'b36b8d37-9bef-41a9-8095-6661c4d57b5e';

UPDATE "Merchant" SET "classification" = 'SUSPICIOUS', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Placeholder merchant identity with a VisuTry route URL and no activation evidence.' WHERE "id" = '4c1a5910-d46a-4f0a-a083-e4ddc5b99f93';
UPDATE "Merchant" SET "classification" = 'SUSPICIOUS', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Slug derived from a third-party product URL with no activation evidence.' WHERE "id" = '7340124d-5f8c-49da-be62-2fc162ea8445';
UPDATE "Merchant" SET "classification" = 'SUSPICIOUS', "classificationSource" = 'G0_AUDIT_2026-08-26', "classificationReason" = 'Placeholder name and malformed website URL with no activation evidence.' WHERE "id" = 'ab557de8-79a8-444e-b8a3-b5ca781a3df0';
