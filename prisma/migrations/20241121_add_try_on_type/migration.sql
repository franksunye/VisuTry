-- CreateEnum
CREATE TYPE "TryOnType" AS ENUM ('GLASSES', 'OUTFIT', 'SHOES', 'ACCESSORIES');

-- AlterTable
ALTER TABLE "TryOnTask" ADD COLUMN "type" "TryOnType" NOT NULL DEFAULT 'GLASSES';
ALTER TABLE "TryOnTask" ADD COLUMN "itemImageUrl" TEXT;
ALTER TABLE "TryOnTask" ALTER COLUMN "glassesImageUrl" DROP NOT NULL;

-- Update existing records to populate itemImageUrl
UPDATE "TryOnTask" SET "itemImageUrl" = "glassesImageUrl" WHERE "itemImageUrl" IS NULL;

-- Make itemImageUrl required after populating
ALTER TABLE "TryOnTask" ALTER COLUMN "itemImageUrl" SET NOT NULL;

-- CreateIndex
CREATE INDEX "TryOnTask_type_idx" ON "TryOnTask"("type");
CREATE INDEX "TryOnTask_userId_type_createdAt_idx" ON "TryOnTask"("userId", "type", "createdAt" DESC);

