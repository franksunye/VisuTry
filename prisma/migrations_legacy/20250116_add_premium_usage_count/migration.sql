-- Add premiumUsageCount field to User table
-- This field tracks Premium users' usage within their current billing cycle
ALTER TABLE "User" ADD COLUMN "premiumUsageCount" INTEGER NOT NULL DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN "User"."premiumUsageCount" IS 'Premium subscription usage count (resets on billing cycle renewal)';

