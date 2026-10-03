-- Add creditsBalance field to User table
ALTER TABLE "User" ADD COLUMN "creditsBalance" INTEGER NOT NULL DEFAULT 0;

-- Fix existing users with negative freeTrialsUsed (caused by old Credits Pack logic)
-- Convert negative freeTrialsUsed to positive creditsBalance
UPDATE "User" 
SET "creditsBalance" = ABS("freeTrialsUsed"),
    "freeTrialsUsed" = 0
WHERE "freeTrialsUsed" < 0;

