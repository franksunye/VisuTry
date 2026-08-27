# Merchant Readiness Contract

This is the shared G0–G2 contract for Merchant catalog records. It is intentionally separate from the future G3 Store publishing UX.

## Three independent eligibility decisions

- **Catalog eligible**: the frame has a stable identity (`sku`, `externalId`, or product URL), a usable name, a usable image URL, and a valid product URL when present. It may exist in the Merchant Catalog even when enrichment is incomplete.
- **Recommendation eligible**: the frame is active, catalog eligible, has the required eyewear attributes (currently a non-empty shape), and its `enrichmentStatus` is `APPROVED` or `NOT_REQUIRED`.
- **Try-on eligible**: a later Store/Recommendation contract may add try-on-specific requirements. It must not be inferred from catalog eligibility alone.

The canonical implementation is `validateMerchantFrameReadiness` and `isMerchantFrameRecommendationReady` in `src/modules/merchant/domain/merchant-frame-readiness.ts`. Both Prisma and Cloudflare onboarding paths delegate to it.

## Enrichment status

- `APPROVED`: required recommendation attributes are present and trusted, including high-confidence automatic enrichment.
- `PENDING`: the frame is importable but required enrichment has not been resolved yet.
- `REVIEW_REQUIRED`: enrichment exists but confidence or provenance requires review.
- `NOT_REQUIRED`: the frame is explicitly exempt from the enrichment workflow; it does not waive required recommendation attributes.

Missing SKU never blocks a stable URL/external-id import. Missing shape never blocks catalog import; it always prevents recommendation readiness and is persisted as `PENDING` unless an explicit exemption remains `NOT_REQUIRED` or a lower-confidence inference is explicitly marked `REVIEW_REQUIRED`. `NOT_REQUIRED` does not make a frame with missing shape recommendation-ready.

## Self-service workspace scope

Human self-service provisions the authenticated user's first Merchant workspace only. Existing membership is the idempotency record for retries and callback replays. Agency and multi-brand workspace creation remain deferred.

## Migration boundary

`npm run build` and Preview/CI builds never run database migrations. Production migration is a separate, explicitly authorized path:

```bash
VERCEL_ENV=production \
VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1 \
npm run build:production
```

The migration script fails closed unless both production environment and explicit authorization are present.
