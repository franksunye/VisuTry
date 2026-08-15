# Hosting Strategy — Vercel Today, Cloudflare-Ready Tomorrow

**Status:** Active  
**Date:** 2026-08-15  
**Owner:** Product / Engineering

## Objective

Keep VisuTry infrastructure cost near zero / low fixed cost before break-even without allowing hosting-plan limits to dictate product architecture or consume disproportionate engineering time.

## Current Decision

- **Vercel remains the production host for now.**
- **Cloudflare becomes the prepared migration target**, not merely a theoretical fallback.
- Do **not** perform an immediate production migration only to avoid a small monthly hosting bill.
- Start compatibility work now so that a future migration is an operational switch, not a new research project.

The operating principle is:

> Optimize for optionality: Vercel today, Cloudflare-ready tomorrow.

## Why This Changed

The Vercel optimization work has already removed substantial avoidable runtime work through static rendering, ISR reduction, middleware narrowing, and client-side auth gates. See:

- `docs/operations/vercel-cpu-static-page-pilot.md`
- `docs/decisions/ADR-005-ssr-to-client-gate.md`

Those optimizations remain valid regardless of hosting provider. However, growing consumer traffic, SEO / visual assets, Store traffic, and Campaign workloads increase the probability that continued Vercel-specific quota optimization becomes a recurring engineering tax.

The infrastructure strategy therefore shifts from **"optimize Vercel indefinitely"** to **"keep Vercel efficient while maintaining a verified Cloudflare exit path."**

## Architecture Direction

### Keep provider-independent where practical

| Capability | Current / Near-Term Direction |
| --- | --- |
| Next.js application | Continue on Vercel production; validate OpenNext / Cloudflare Workers compatibility |
| Static assets / edge delivery | Keep CDN-friendly and cacheable; avoid unnecessary runtime execution |
| Database | Neon remains external and provider-independent |
| Payments | Stripe remains external and provider-independent |
| Authentication | Current auth stack remains external; verify Cloudflare runtime parity |
| Object storage | Vercel Blob is a migration coupling point; evaluate continued cross-cloud use vs Cloudflare R2 |
| AI generation | Keep behind application/service interfaces; do not couple inference to hosting provider |

### Avoid new provider coupling

New product work should not introduce Vercel-only primitives unless they materially simplify the product and have an explicit migration path.

This is a guardrail, not a ban: product velocity still outranks theoretical portability.

## Cloudflare Compatibility Audit

Before any cutover, verify production-equivalent behavior for:

1. Next.js App Router build through OpenNext / Workers.
2. Static generation, ISR / revalidation, cache semantics, and dynamic routes.
3. `next/image` or replacement image-delivery behavior.
4. Auth flows, cookies, session refresh, redirects, and protected admin paths.
5. Stripe checkout and webhook handling.
6. Neon connectivity and Prisma / driver compatibility.
7. Vercel Blob reads/writes and the R2 migration option.
8. Middleware and locale routing across all supported locales.
9. Cron / scheduled jobs and any background work.
10. Upload/body-size limits and large image flows.
11. Long-running AI generation / polling paths.
12. Store / Campaign public routes, attribution, and merchant isolation.

## Rollout Plan

### Phase 0 — Continue Vercel optimization

- Keep production stable on Vercel.
- Continue measuring runtime, origin transfer, image optimization, ISR, and cache behavior.
- Only pursue optimizations that improve architecture/performance or remove meaningful cost risk.

### Phase 1 — Cloudflare build parity

- Maintain a dedicated migration branch or reproducible deployment configuration.
- Make the current Next.js app build and deploy successfully through Cloudflare/OpenNext.
- Record incompatibilities rather than silently changing production behavior.

### Phase 2 — Staging parity audit

Validate the compatibility checklist above using a Cloudflare staging domain.

Minimum acceptance:

- core consumer funnel works end-to-end;
- Store public and merchant-admin boundaries remain correct;
- auth and payments are safe;
- SEO metadata, canonical URLs, locale routing, sitemap behavior, and rendered content remain equivalent;
- no material regression in image quality or page performance.

### Phase 3 — Shadow observation

Run Cloudflare staging for at least 1–2 weeks with production-like builds and smoke tests. Capture deployment, runtime, cache, and operational differences.

### Phase 4 — Production cutover when justified

Cut over only after the migration triggers and acceptance criteria are both satisfied. Keep a documented rollback path to Vercel during the initial cutover window.

## Migration Triggers

Cloudflare migration becomes an execution priority when one or more of the following are true:

- engineering work is repeatedly being done primarily to remain inside Vercel plan/resource limits;
- Vercel commercial-plan policy or pricing becomes a practical blocker for the live business;
- sustained consumer / merchant traffic makes the Vercel cost curve materially worse than the Cloudflare alternative;
- image, origin-transfer, ISR, function, or related limits materially constrain growth;
- Store / Campaign traffic makes low-cost edge/static delivery strategically important;
- Cloudflare staging has already passed production-parity validation.

Traffic volume alone is not an automatic trigger. A rough **10K–20K+ monthly-user / materially growing merchant-traffic** range should be treated as a review point, not a hard migration threshold.

## Success Criteria

A migration is successful only if:

- consumer and merchant workflows have functional parity;
- SEO/indexability and locale behavior do not regress;
- auth, payments, tenant isolation, and webhooks remain correct;
- page and image performance are acceptable or better;
- operational debugging and rollback are practical;
- infrastructure cost remains small relative to revenue and grows more slowly than the business.

## Non-Goals

- Achieving `$0` infrastructure cost at any engineering cost.
- Rewriting stable product architecture solely to avoid a small Vercel bill.
- Migrating Neon, Stripe, Auth, or AI providers simply because the web host changes.
- Introducing Cloudflare-specific coupling before the migration path is validated.

## Review Cadence

Review this decision when:

- a new Vercel resource ceiling becomes material;
- Store / Campaign traffic changes the workload profile;
- a Cloudflare staging milestone is completed;
- hosting spend becomes meaningful relative to monthly revenue;
- or at least once per quarter while VisuTry remains pre-break-even.

## Related Documents

- `docs/operations/vercel-cpu-static-page-pilot.md`
- `docs/decisions/ADR-005-ssr-to-client-gate.md`
- `docs/decisions/ADR-009-vercel-cloudflare-hosting-optionality.md`
