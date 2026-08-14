# Vercel ISR Reads Audit

## P0-A Implementation

The public Store/Campaign discovery invalidation boundary is now centralized in application services on the latest `main` baseline.

- `withPublicDiscoveryInvalidation` is the single semantic mutation-facing application boundary; callers provide only a Merchant/Catalog/Experience target and a successful mutation callback, never cache tags or `revalidateTag`.
- Successful Campaign create/update/frame/publish/archive writes, merchant profile updates, onboarding Store create/frame/publish writes, catalog imports, and Admin Experience/frames writes invalidate after the database write or transaction completes.
- MCP `import_frames`, Store mutations, and Campaign mutations are covered automatically because they delegate to those services.
- Seed/dev-only direct writers remain intentionally outside the runtime boundary and retain TTL as the safety net.
- No TTL, `revalidate`, `dynamicParams`, `generateStaticParams`, slug admission, sitemap architecture, SEO/UI, schema, migration, Stripe, or Auth behavior was changed.

Failure-path tests assert that invalidation is not called when validation or the database write fails. No old/new public Experience slug mutation path exists in the repository; slug-changing invalidation was therefore not added.
