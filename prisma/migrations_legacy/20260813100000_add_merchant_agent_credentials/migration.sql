CREATE TYPE "MerchantAgentCredentialStatus" AS ENUM ('ACTIVE', 'REVOKED');

CREATE TABLE "MerchantAgentCredential" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "secretHash" TEXT NOT NULL,
    "scopes" TEXT[] NOT NULL,
    "status" "MerchantAgentCredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdByUserId" TEXT,
    "rotatedFromId" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantAgentCredential_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantAgentCredential_keyPrefix_key"
  ON "MerchantAgentCredential"("keyPrefix");
CREATE INDEX "MerchantAgentCredential_merchantId_status_idx"
  ON "MerchantAgentCredential"("merchantId", "status");
CREATE INDEX "MerchantAgentCredential_createdByUserId_idx"
  ON "MerchantAgentCredential"("createdByUserId");
CREATE INDEX "MerchantAgentCredential_rotatedFromId_idx"
  ON "MerchantAgentCredential"("rotatedFromId");

CREATE TABLE "MerchantOperationAudit" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT,
    "result" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MerchantOperationAudit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MerchantOperationAudit_merchantId_createdAt_idx"
  ON "MerchantOperationAudit"("merchantId", "createdAt");
CREATE INDEX "MerchantOperationAudit_actorType_actorId_createdAt_idx"
  ON "MerchantOperationAudit"("actorType", "actorId", "createdAt");

ALTER TABLE "MerchantAgentCredential"
  ADD CONSTRAINT "MerchantAgentCredential_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MerchantAgentCredential_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MerchantOperationAudit"
  ADD CONSTRAINT "MerchantOperationAudit_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
