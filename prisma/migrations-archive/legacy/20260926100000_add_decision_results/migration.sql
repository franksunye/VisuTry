CREATE TABLE "DecisionResult" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "experienceId" TEXT,
    "merchantSessionId" TEXT NOT NULL,
    "schemaVersion" INTEGER NOT NULL DEFAULT 1,
    "payload" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "finalizedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionResult_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DecisionResultShare" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "decisionResultId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisionResultShare_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DecisionResult_merchantId_merchantSessionId_key" ON "DecisionResult"("merchantId", "merchantSessionId");
CREATE UNIQUE INDEX "DecisionResult_id_merchantId_key" ON "DecisionResult"("id", "merchantId");
CREATE INDEX "DecisionResult_merchantId_expiresAt_idx" ON "DecisionResult"("merchantId", "expiresAt");
CREATE INDEX "DecisionResult_merchantSessionId_idx" ON "DecisionResult"("merchantSessionId");
CREATE UNIQUE INDEX "DecisionResultShare_tokenHash_key" ON "DecisionResultShare"("tokenHash");
CREATE INDEX "DecisionResultShare_merchantId_decisionResultId_idx" ON "DecisionResultShare"("merchantId", "decisionResultId");
CREATE INDEX "DecisionResultShare_expiresAt_revokedAt_idx" ON "DecisionResultShare"("expiresAt", "revokedAt");

ALTER TABLE "DecisionResult" ADD CONSTRAINT "DecisionResult_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DecisionResult" ADD CONSTRAINT "DecisionResult_experienceId_merchantId_fkey" FOREIGN KEY ("experienceId", "merchantId") REFERENCES "Experience"("id", "merchantId") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DecisionResult" ADD CONSTRAINT "DecisionResult_merchantSessionId_merchantId_fkey" FOREIGN KEY ("merchantSessionId", "merchantId") REFERENCES "MerchantSession"("id", "merchantId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DecisionResultShare" ADD CONSTRAINT "DecisionResultShare_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DecisionResultShare" ADD CONSTRAINT "DecisionResultShare_decisionResultId_merchantId_fkey" FOREIGN KEY ("decisionResultId", "merchantId") REFERENCES "DecisionResult"("id", "merchantId") ON DELETE CASCADE ON UPDATE CASCADE;
