-- Store D0-0 foundation: merchant tenant models + TryOnTask attribution.
-- CHECK constraints enforce consumer vs Store actor invariants (Prisma cannot express these).

-- CreateEnum
CREATE TYPE "TryOnOrigin" AS ENUM ('CONSUMER', 'STORE_DEMO', 'STORE_PILOT');
CREATE TYPE "MerchantStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'INACTIVE');
CREATE TYPE "MerchantFrameStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');
CREATE TYPE "MerchantFrameSource" AS ENUM ('SEED', 'MANUAL', 'CSV', 'EXTERNAL');
CREATE TYPE "EnrichmentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'REVIEW_REQUIRED', 'APPROVED');
CREATE TYPE "MerchantSessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'EXPIRED');
CREATE TYPE "MerchantIntentType" AS ENUM ('FAVORITE', 'PRODUCT_CLICK', 'INQUIRY');
CREATE TYPE "StoreEventSource" AS ENUM ('CLIENT', 'SERVER');
CREATE TYPE "StoreAssetPurpose" AS ENUM ('SHOPPER_PHOTO', 'FRAME_INPUT', 'GENERATED_RESULT');
CREATE TYPE "StoreAssetAccessMode" AS ENUM ('PUBLIC_TEMPORARY', 'PRIVATE_SIGNED');
CREATE TYPE "MerchantUsageKind" AS ENUM ('RENDER_ATTEMPT', 'RENDER_SUCCESS', 'RENDER_FAILURE', 'SESSION');

-- CreateTable Merchant
CREATE TABLE "Merchant" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "contactEmail" TEXT,
    "accentColor" TEXT,
    "status" "MerchantStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Merchant_slug_key" ON "Merchant"("slug");
CREATE INDEX "Merchant_status_idx" ON "Merchant"("status");
CREATE INDEX "Merchant_updatedAt_idx" ON "Merchant"("updatedAt");

-- CreateTable StoreAsset (before MerchantSession due to photoAsset FK)
CREATE TABLE "StoreAsset" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantSessionId" TEXT,
    "ownerType" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "purpose" "StoreAssetPurpose" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "accessMode" "StoreAssetAccessMode" NOT NULL DEFAULT 'PUBLIC_TEMPORARY',
    "providerUrl" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreAsset_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "StoreAsset_merchantId_purpose_idx" ON "StoreAsset"("merchantId", "purpose");
CREATE INDEX "StoreAsset_expiresAt_deletedAt_idx" ON "StoreAsset"("expiresAt", "deletedAt");
CREATE INDEX "StoreAsset_merchantSessionId_idx" ON "StoreAsset"("merchantSessionId");
CREATE INDEX "StoreAsset_storageKey_idx" ON "StoreAsset"("storageKey");

-- CreateTable MerchantFrame
CREATE TABLE "MerchantFrame" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "sku" TEXT,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT,
    "imageAssetId" TEXT,
    "productUrl" TEXT,
    "price" INTEGER,
    "currency" TEXT,
    "shape" TEXT NOT NULL,
    "material" TEXT,
    "color" TEXT,
    "widthClass" TEXT,
    "styleTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "source" "MerchantFrameSource" NOT NULL DEFAULT 'SEED',
    "externalId" TEXT,
    "enrichmentStatus" "EnrichmentStatus" NOT NULL DEFAULT 'APPROVED',
    "status" "MerchantFrameStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantFrame_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantFrame_merchantId_sku_key" ON "MerchantFrame"("merchantId", "sku");
CREATE UNIQUE INDEX "MerchantFrame_merchantId_source_externalId_key" ON "MerchantFrame"("merchantId", "source", "externalId");
CREATE INDEX "MerchantFrame_merchantId_status_idx" ON "MerchantFrame"("merchantId", "status");
CREATE INDEX "MerchantFrame_merchantId_updatedAt_idx" ON "MerchantFrame"("merchantId", "updatedAt");

-- CreateTable MerchantSession
CREATE TABLE "MerchantSession" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "anonymousVisitorId" TEXT,
    "photoAssetId" TEXT,
    "capabilityTokenHash" TEXT NOT NULL,
    "locale" TEXT,
    "status" "MerchantSessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantSession_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MerchantSession_merchantId_status_idx" ON "MerchantSession"("merchantId", "status");
CREATE INDEX "MerchantSession_merchantId_createdAt_idx" ON "MerchantSession"("merchantId", "createdAt" DESC);
CREATE INDEX "MerchantSession_expiresAt_idx" ON "MerchantSession"("expiresAt");
CREATE INDEX "MerchantSession_capabilityTokenHash_idx" ON "MerchantSession"("capabilityTokenHash");

-- CreateTable MerchantIntent
CREATE TABLE "MerchantIntent" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantSessionId" TEXT NOT NULL,
    "merchantFrameId" TEXT,
    "type" "MerchantIntentType" NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantIntent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantIntent_idempotencyKey_key" ON "MerchantIntent"("idempotencyKey");
CREATE INDEX "MerchantIntent_merchantId_createdAt_idx" ON "MerchantIntent"("merchantId", "createdAt" DESC);
CREATE INDEX "MerchantIntent_merchantId_type_idx" ON "MerchantIntent"("merchantId", "type");
CREATE INDEX "MerchantIntent_merchantSessionId_idx" ON "MerchantIntent"("merchantSessionId");

-- CreateTable MerchantEvent
CREATE TABLE "MerchantEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantSessionId" TEXT,
    "merchantFrameId" TEXT,
    "tryOnTaskId" TEXT,
    "source" "StoreEventSource" NOT NULL,
    "locale" TEXT,
    "deviceType" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantEvent_eventId_key" ON "MerchantEvent"("eventId");
CREATE INDEX "MerchantEvent_merchantId_createdAt_idx" ON "MerchantEvent"("merchantId", "createdAt" DESC);
CREATE INDEX "MerchantEvent_merchantId_type_idx" ON "MerchantEvent"("merchantId", "type");
CREATE INDEX "MerchantEvent_merchantSessionId_idx" ON "MerchantEvent"("merchantSessionId");
CREATE INDEX "MerchantEvent_tryOnTaskId_idx" ON "MerchantEvent"("tryOnTaskId");

-- CreateTable MerchantUsageLedger
CREATE TABLE "MerchantUsageLedger" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "merchantSessionId" TEXT,
    "tryOnTaskId" TEXT,
    "kind" "MerchantUsageKind" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantUsageLedger_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MerchantUsageLedger_merchantId_kind_idx" ON "MerchantUsageLedger"("merchantId", "kind");
CREATE INDEX "MerchantUsageLedger_merchantId_merchantSessionId_kind_idx" ON "MerchantUsageLedger"("merchantId", "merchantSessionId", "kind");
CREATE INDEX "MerchantUsageLedger_tryOnTaskId_idx" ON "MerchantUsageLedger"("tryOnTaskId");

-- AlterTable TryOnTask: attribution + optional userId
ALTER TABLE "TryOnTask" ADD COLUMN "origin" "TryOnOrigin" NOT NULL DEFAULT 'CONSUMER';
ALTER TABLE "TryOnTask" ADD COLUMN "merchantId" TEXT;
ALTER TABLE "TryOnTask" ADD COLUMN "merchantSessionId" TEXT;
ALTER TABLE "TryOnTask" ADD COLUMN "merchantFrameId" TEXT;
ALTER TABLE "TryOnTask" ADD COLUMN "idempotencyKey" TEXT;

-- Drop FK temporarily to make userId optional
ALTER TABLE "TryOnTask" DROP CONSTRAINT "TryOnTask_userId_fkey";
ALTER TABLE "TryOnTask" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "TryOnTask" ADD CONSTRAINT "TryOnTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "TryOnTask_idempotencyKey_key" ON "TryOnTask"("idempotencyKey");
CREATE INDEX "TryOnTask_origin_idx" ON "TryOnTask"("origin");
CREATE INDEX "TryOnTask_merchantId_createdAt_idx" ON "TryOnTask"("merchantId", "createdAt" DESC);
CREATE INDEX "TryOnTask_merchantSessionId_idx" ON "TryOnTask"("merchantSessionId");
CREATE INDEX "TryOnTask_merchantFrameId_idx" ON "TryOnTask"("merchantFrameId");

-- Foreign keys for Store tables
ALTER TABLE "StoreAsset" ADD CONSTRAINT "StoreAsset_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MerchantFrame" ADD CONSTRAINT "MerchantFrame_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MerchantSession" ADD CONSTRAINT "MerchantSession_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MerchantSession" ADD CONSTRAINT "MerchantSession_photoAssetId_fkey" FOREIGN KEY ("photoAssetId") REFERENCES "StoreAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "StoreAsset" ADD CONSTRAINT "StoreAsset_merchantSessionId_fkey" FOREIGN KEY ("merchantSessionId") REFERENCES "MerchantSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MerchantIntent" ADD CONSTRAINT "MerchantIntent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MerchantIntent" ADD CONSTRAINT "MerchantIntent_merchantSessionId_fkey" FOREIGN KEY ("merchantSessionId") REFERENCES "MerchantSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MerchantIntent" ADD CONSTRAINT "MerchantIntent_merchantFrameId_fkey" FOREIGN KEY ("merchantFrameId") REFERENCES "MerchantFrame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MerchantEvent" ADD CONSTRAINT "MerchantEvent_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MerchantEvent" ADD CONSTRAINT "MerchantEvent_merchantSessionId_fkey" FOREIGN KEY ("merchantSessionId") REFERENCES "MerchantSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MerchantEvent" ADD CONSTRAINT "MerchantEvent_merchantFrameId_fkey" FOREIGN KEY ("merchantFrameId") REFERENCES "MerchantFrame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MerchantUsageLedger" ADD CONSTRAINT "MerchantUsageLedger_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "MerchantUsageLedger" ADD CONSTRAINT "MerchantUsageLedger_merchantSessionId_fkey" FOREIGN KEY ("merchantSessionId") REFERENCES "MerchantSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TryOnTask" ADD CONSTRAINT "TryOnTask_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TryOnTask" ADD CONSTRAINT "TryOnTask_merchantSessionId_fkey" FOREIGN KEY ("merchantSessionId") REFERENCES "MerchantSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "TryOnTask" ADD CONSTRAINT "TryOnTask_merchantFrameId_fkey" FOREIGN KEY ("merchantFrameId") REFERENCES "MerchantFrame"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Actor invariants
ALTER TABLE "TryOnTask" ADD CONSTRAINT "try_on_task_actor_check" CHECK (
  (
    "origin" = 'CONSUMER'
    AND "userId" IS NOT NULL
    AND "merchantId" IS NULL
    AND "merchantSessionId" IS NULL
    AND "merchantFrameId" IS NULL
  )
  OR
  (
    "origin" IN ('STORE_DEMO', 'STORE_PILOT')
    AND "merchantId" IS NOT NULL
    AND "merchantSessionId" IS NOT NULL
    AND "merchantFrameId" IS NOT NULL
  )
);
