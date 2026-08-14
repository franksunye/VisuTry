CREATE TABLE "MerchantOAuthDcrCounter" (
    "id" TEXT NOT NULL,
    "bucketHash" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "MerchantOAuthDcrCounter_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MerchantOAuthDcrCounter_bucketHash_windowStart_key"
  ON "MerchantOAuthDcrCounter"("bucketHash", "windowStart");
CREATE INDEX "MerchantOAuthDcrCounter_windowStart_idx"
  ON "MerchantOAuthDcrCounter"("windowStart");
