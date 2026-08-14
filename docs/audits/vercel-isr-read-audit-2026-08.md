# Vercel ISR Reads Audit

## P0-A Implementation

The public Store/Campaign discovery invalidation boundary is now centralized in application services on the latest `main` baseline.

- `withPublicDiscoveryInvalidation` is the single semantic mutation-facing application boundary; callers provide only a Merchant/Catalog/Experience target and a successful mutation callback, never cache tags or `revalidateTag`.
- Successful Campaign create/update/frame/publish/archive writes, merchant profile updates, onboarding Store create/frame/publish writes, catalog imports, and Admin Experience/frames writes invalidate after the database write or transaction completes.
- MCP `import_frames`, Store mutations, and Campaign mutations are covered automatically because they delegate to those services.
- Seed/dev-only direct writers remain intentionally outside the runtime boundary and retain TTL as the safety net.
- No TTL, `revalidate`, `dynamicParams`, `generateStaticParams`, slug admission, sitemap architecture, SEO/UI, schema, migration, Stripe, or Auth behavior was changed.

Failure-path tests assert that invalidation is not called when validation or the database write fails. No old/new public Experience slug mutation path exists in the repository; slug-changing invalidation was therefore not added.

## P0-B Implementation

- Store/Campaign routes now perform a linear lowercase ASCII syntax guard before any discovery call, then consult a fixed-key bounded public route admission index.
- The index is built from ACTIVE merchants and the existing `resolveExperienceSearchVisibility` rule: `PUBLIC_INDEX` and `PUBLIC_NOINDEX` remain routable; `PRIVATE` remains rejected. Store admission follows the existing active-then-latest selection behavior, and Campaign admission uses slug membership.
- Persistent admission keyspace is bounded by the current merchant set: `['public-route-admission-index']`; arbitrary merchant or campaign probes do not create per-request negative keys. The index is invalidated through `withPublicDiscoveryInvalidation` via `public-discovery:route-admission`.
- Merchant grammar uses the existing 180-character provisioning bound; Campaign grammar uses the existing 240-character input bound. Store/Campaign `revalidate`, `dynamicParams`, and `generateStaticParams` remain unchanged.
- Local code/tests cannot confirm whether Vercel durably bills 404 ISR entries; deployment telemetry remains required.
