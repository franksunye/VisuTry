-- ello is a VisuTry-owned Reference Experience. Backfill the explicit
-- merchant-sponsored policy for rows created before the delivery-kit field
-- existed. The predicates keep this tenant-scoped and fail closed if the row
-- no longer matches the approved Reference configuration.
UPDATE "Merchant"
SET "sponsoredUsagePolicyKey" = 'VISUTRY_OWNED'
WHERE "slug" = 'ello-sunglasses'
  AND "pilotType" = 'REFERENCE'
  AND "referenceData" = true
  AND "sponsoredUsagePolicyKey" IS NULL;

-- Preserve the rolling-window contract across the cutover. Before the policy
-- key was present, eligible ello renders were charged as merchant_allowance;
-- those successful renders still represent merchant-sponsored usage for this
-- delivery. Tasks with an explicit consumer_quota policy are excluded.
INSERT INTO "MerchantSponsoredUsage" (
  "id",
  "merchantId",
  "merchantSessionId",
  "experienceId",
  "userId",
  "shopperIdentityHash",
  "usageType",
  "status",
  "reservedAt",
  "consumedAt",
  "idempotencyKey",
  "createdAt",
  "updatedAt"
)
SELECT
  'legacy-backfill-' || t."id",
  m."id",
  t."merchantSessionId",
  s."experienceId",
  t."userId",
  COALESCE(s."anonymousVisitorId", s."capabilityTokenHash"),
  'SPONSORED_GENERATION',
  'CONSUMED',
  t."createdAt",
  t."updatedAt",
  'legacy-backfill:' || t."id",
  t."createdAt",
  t."updatedAt"
FROM "TryOnTask" t
JOIN "Merchant" m ON m."id" = t."merchantId"
JOIN "MerchantSession" s ON s."id" = t."merchantSessionId"
WHERE m."slug" = 'ello-sunglasses'
  AND m."pilotType" = 'REFERENCE'
  AND m."referenceData" = true
  AND t."origin" = 'STORE_PILOT'
  AND t."status" = 'COMPLETED'
  AND t."createdAt" >= NOW() - INTERVAL '24 hours'
  AND COALESCE(t."metadata" ->> 'usagePolicyKind', 'merchant_allowance') <> 'consumer_quota'
  AND NOT EXISTS (
    SELECT 1
    FROM "MerchantSponsoredUsage" existing
    WHERE existing."idempotencyKey" = 'legacy-backfill:' || t."id"
  );
