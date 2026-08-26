-- Reconcile the VisuTry-owned ello Reference Experience after the initial
-- sponsored-usage migration. This is intentionally idempotent: production
-- data may have been seeded or corrected after the first backfill ran.
UPDATE "Merchant"
SET "sponsoredUsagePolicyKey" = 'VISUTRY_OWNED'
WHERE "slug" = 'ello-sunglasses'
  AND "pilotType" = 'REFERENCE'
  AND "referenceData" = true
  AND "sponsoredUsagePolicyKey" IS DISTINCT FROM 'VISUTRY_OWNED';

-- Any successful legacy Store task created during the cutover window is
-- already merchant-sponsored usage for this Reference Experience. Preserve
-- that consumption before the authoritative policy starts admitting new
-- reservations, while excluding explicit consumer-quota tasks.
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
  'legacy-reconcile-' || t."id",
  m."id",
  t."merchantSessionId",
  s."experienceId",
  t."userId",
  COALESCE(s."anonymousVisitorId", s."capabilityTokenHash"),
  'SPONSORED_GENERATION',
  'CONSUMED',
  t."createdAt",
  t."updatedAt",
  'legacy-reconcile:' || t."id",
  t."createdAt",
  t."updatedAt"
FROM "TryOnTask" t
JOIN "Merchant" m ON m."id" = t."merchantId"
JOIN "MerchantSession" s ON s."id" = t."merchantSessionId"
WHERE m."slug" = 'ello-sunglasses'
  AND m."pilotType" = 'REFERENCE'
  AND m."referenceData" = true
  AND m."sponsoredUsagePolicyKey" = 'VISUTRY_OWNED'
  AND t."origin" = 'STORE_PILOT'
  AND t."status" = 'COMPLETED'
  AND t."createdAt" >= NOW() - INTERVAL '24 hours'
  AND COALESCE(t."metadata" ->> 'usagePolicyKind', 'merchant_allowance') <> 'consumer_quota'
  AND NOT EXISTS (
    SELECT 1
    FROM "MerchantSponsoredUsage" existing
    WHERE existing."idempotencyKey" IN (
      'legacy-backfill:' || t."id",
      'legacy-reconcile:' || t."id"
    )
  );
