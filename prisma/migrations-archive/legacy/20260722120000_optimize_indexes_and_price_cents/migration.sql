-- Convert GlassesFrame.price from Float (dollars) to Integer (cents)
-- Existing dollar values are multiplied by 100 to preserve correctness.
-- NULL values remain NULL.
ALTER TABLE "GlassesFrame" ALTER COLUMN "price" TYPE INTEGER USING CASE WHEN "price" IS NOT NULL THEN ROUND("price" * 100)::INTEGER ELSE NULL END;

-- Add missing FK indexes (Prisma does not auto-index foreign keys)
CREATE INDEX "Account_userId_idx" ON "Account"("userId");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- Add Payment composite index for user history queries
CREATE INDEX "Payment_userId_createdAt_idx" ON "Payment"("userId", "createdAt" DESC);

-- Add GlassesFrame composite indexes for admin and public filtering
CREATE INDEX "GlassesFrame_style_idx" ON "GlassesFrame"("style");
CREATE INDEX "GlassesFrame_material_idx" ON "GlassesFrame"("material");
CREATE INDEX "GlassesFrame_isActive_category_idx" ON "GlassesFrame"("isActive", "category");
CREATE INDEX "GlassesFrame_isActive_brand_idx" ON "GlassesFrame"("isActive", "brand");
CREATE INDEX "GlassesFrame_isActive_createdAt_idx" ON "GlassesFrame"("isActive", "createdAt");
