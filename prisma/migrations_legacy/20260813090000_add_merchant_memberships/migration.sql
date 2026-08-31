CREATE TYPE "MerchantMembershipRole" AS ENUM ('OWNER', 'ADMIN');

CREATE TABLE "MerchantMembership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "role" "MerchantMembershipRole" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MerchantMembership_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantMembership_userId_merchantId_key"
  ON "MerchantMembership"("userId", "merchantId");
CREATE INDEX "MerchantMembership_userId_idx"
  ON "MerchantMembership"("userId");
CREATE INDEX "MerchantMembership_merchantId_idx"
  ON "MerchantMembership"("merchantId");

ALTER TABLE "MerchantMembership"
  ADD CONSTRAINT "MerchantMembership_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "MerchantMembership_merchantId_fkey"
  FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
