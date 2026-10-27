-- Additive v2 experience setting. Historical sessions and plans remain untouched.
ALTER TABLE "Experience" ADD COLUMN "sessionTryOnLimit" INTEGER;
ALTER TABLE "Experience" ADD CONSTRAINT "Experience_session_tryon_limit_check"
CHECK ("sessionTryOnLimit" IS NULL OR "sessionTryOnLimit" IN (1,2,4));
