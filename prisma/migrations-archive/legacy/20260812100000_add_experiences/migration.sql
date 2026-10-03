CREATE TYPE "ExperienceType" AS ENUM ('STORE', 'CAMPAIGN');
CREATE TYPE "ExperienceStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ENDED', 'ARCHIVED');

CREATE TABLE "Experience" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "type" "ExperienceType" NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "ExperienceStatus" NOT NULL DEFAULT 'DRAFT',
    "headline" TEXT,
    "description" TEXT,
    "heroAssetUrl" TEXT,
    "primaryCtaType" TEXT,
    "primaryCtaLabel" TEXT,
    "primaryCtaUrl" TEXT,
    "secondaryCtaType" TEXT,
    "secondaryCtaLabel" TEXT,
    "secondaryCtaUrl" TEXT,
    "offerLabel" TEXT,
    "offerCode" TEXT,
    "offerTerms" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "referenceData" BOOLEAN NOT NULL DEFAULT false,
    "defaultSource" TEXT,
    "defaultCampaign" TEXT,
    "referenceMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Experience_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ExperienceFrame" (
    "experienceId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantFrameId" TEXT NOT NULL,
    "sortOrder" INTEGER,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceFrame_pkey" PRIMARY KEY ("experienceId", "merchantFrameId")
);

ALTER TABLE "MerchantSession" ADD COLUMN "experienceId" TEXT;
ALTER TABLE "MerchantIntent" ADD COLUMN "experienceId" TEXT;
ALTER TABLE "MerchantEvent" ADD COLUMN "experienceId" TEXT;

UPDATE "MerchantIntent" AS intent
SET "experienceId" = session."experienceId"
FROM "MerchantSession" AS session
WHERE intent."merchantSessionId" = session."id";

UPDATE "MerchantEvent" AS event
SET "experienceId" = session."experienceId"
FROM "MerchantSession" AS session
WHERE event."merchantSessionId" = session."id";

CREATE UNIQUE INDEX "MerchantFrame_id_merchantId_key" ON "MerchantFrame"("id", "merchantId");
CREATE UNIQUE INDEX "Experience_merchantId_slug_key" ON "Experience"("merchantId", "slug");
CREATE UNIQUE INDEX "Experience_id_merchantId_key" ON "Experience"("id", "merchantId");
CREATE UNIQUE INDEX "Experience_one_active_store_per_merchant_idx"
  ON "Experience"("merchantId")
  WHERE "type" = 'STORE' AND "status" = 'ACTIVE';
CREATE INDEX "Experience_merchantId_type_status_idx" ON "Experience"("merchantId", "type", "status");
CREATE INDEX "ExperienceFrame_merchantId_experienceId_active_sortOrder_idx" ON "ExperienceFrame"("merchantId", "experienceId", "active", "sortOrder");
CREATE INDEX "MerchantSession_merchantId_experienceId_idx" ON "MerchantSession"("merchantId", "experienceId");
CREATE INDEX "MerchantIntent_merchantId_experienceId_idx" ON "MerchantIntent"("merchantId", "experienceId");
CREATE INDEX "MerchantEvent_merchantId_experienceId_idx" ON "MerchantEvent"("merchantId", "experienceId");

ALTER TABLE "Experience"
  ADD CONSTRAINT "Experience_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ExperienceFrame"
  ADD CONSTRAINT "ExperienceFrame_experienceId_merchantId_fkey"
  FOREIGN KEY ("experienceId", "merchantId") REFERENCES "Experience"("id", "merchantId") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ExperienceFrame_merchantFrameId_merchantId_fkey"
  FOREIGN KEY ("merchantFrameId", "merchantId") REFERENCES "MerchantFrame"("id", "merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MerchantSession"
  ADD CONSTRAINT "MerchantSession_experienceId_fkey"
  FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MerchantIntent"
  ADD CONSTRAINT "MerchantIntent_experienceId_fkey"
  FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MerchantEvent"
  ADD CONSTRAINT "MerchantEvent_experienceId_fkey"
  FOREIGN KEY ("experienceId") REFERENCES "Experience"("id") ON DELETE SET NULL ON UPDATE CASCADE;
