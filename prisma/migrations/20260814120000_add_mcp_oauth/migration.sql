CREATE TYPE "MerchantOAuthAuthorizationStatus" AS ENUM ('ACTIVE', 'REVOKED');

CREATE TABLE "MerchantOAuthClient" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "redirectUris" TEXT[] NOT NULL,
    "tokenEndpointAuthMethod" TEXT NOT NULL DEFAULT 'none',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MerchantOAuthClient_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MerchantOAuthClient_clientId_key" ON "MerchantOAuthClient"("clientId");
CREATE INDEX "MerchantOAuthClient_createdAt_idx" ON "MerchantOAuthClient"("createdAt");

CREATE TABLE "MerchantOAuthAuthorizationRequest" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "scopes" TEXT[] NOT NULL,
    "resource" TEXT,
    "state" TEXT,
    "codeChallenge" TEXT NOT NULL,
    "codeChallengeMethod" TEXT NOT NULL,
    "userId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MerchantOAuthAuthorizationRequest_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MerchantOAuthAuthorizationRequest_requestId_key" ON "MerchantOAuthAuthorizationRequest"("requestId");
CREATE INDEX "MerchantOAuthAuthorizationRequest_expiresAt_idx" ON "MerchantOAuthAuthorizationRequest"("expiresAt");
CREATE INDEX "MerchantOAuthAuthorizationRequest_userId_idx" ON "MerchantOAuthAuthorizationRequest"("userId");

CREATE TABLE "MerchantOAuthAuthorization" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "scopes" TEXT[] NOT NULL,
    "resource" TEXT NOT NULL,
    "status" "MerchantOAuthAuthorizationStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MerchantOAuthAuthorization_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "MerchantOAuthAuthorization_userId_merchantId_idx" ON "MerchantOAuthAuthorization"("userId", "merchantId");
CREATE INDEX "MerchantOAuthAuthorization_clientId_idx" ON "MerchantOAuthAuthorization"("clientId");
CREATE INDEX "MerchantOAuthAuthorization_merchantId_status_idx" ON "MerchantOAuthAuthorization"("merchantId", "status");

CREATE TABLE "MerchantOAuthAuthorizationCode" (
    "id" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "scopes" TEXT[] NOT NULL,
    "resource" TEXT,
    "codeChallenge" TEXT NOT NULL,
    "codeChallengeMethod" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MerchantOAuthAuthorizationCode_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MerchantOAuthAuthorizationCode_codeHash_key" ON "MerchantOAuthAuthorizationCode"("codeHash");
CREATE INDEX "MerchantOAuthAuthorizationCode_clientId_expiresAt_idx" ON "MerchantOAuthAuthorizationCode"("clientId", "expiresAt");
CREATE INDEX "MerchantOAuthAuthorizationCode_expiresAt_idx" ON "MerchantOAuthAuthorizationCode"("expiresAt");

CREATE TABLE "MerchantOAuthAccessToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "authorizationId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MerchantOAuthAccessToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MerchantOAuthAccessToken_tokenHash_key" ON "MerchantOAuthAccessToken"("tokenHash");
CREATE INDEX "MerchantOAuthAccessToken_authorizationId_idx" ON "MerchantOAuthAccessToken"("authorizationId");
CREATE INDEX "MerchantOAuthAccessToken_expiresAt_idx" ON "MerchantOAuthAccessToken"("expiresAt");

CREATE TABLE "MerchantOAuthRefreshToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "authorizationId" TEXT NOT NULL,
    "rotatedFromId" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MerchantOAuthRefreshToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "MerchantOAuthRefreshToken_tokenHash_key" ON "MerchantOAuthRefreshToken"("tokenHash");
CREATE INDEX "MerchantOAuthRefreshToken_authorizationId_idx" ON "MerchantOAuthRefreshToken"("authorizationId");
CREATE INDEX "MerchantOAuthRefreshToken_expiresAt_idx" ON "MerchantOAuthRefreshToken"("expiresAt");

ALTER TABLE "MerchantOAuthAuthorization"
  ADD CONSTRAINT "MerchantOAuthAuthorization_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MerchantOAuthAuthorization_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MerchantOAuthAccessToken"
  ADD CONSTRAINT "MerchantOAuthAccessToken_authorizationId_fkey"
  FOREIGN KEY ("authorizationId") REFERENCES "MerchantOAuthAuthorization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MerchantOAuthRefreshToken"
  ADD CONSTRAINT "MerchantOAuthRefreshToken_authorizationId_fkey"
  FOREIGN KEY ("authorizationId") REFERENCES "MerchantOAuthAuthorization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
