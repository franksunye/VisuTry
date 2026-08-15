# ADR-009: Keep Vercel Production While Preparing a Verified Cloudflare Migration Path

**Status:** Accepted  
**Date:** 2026-08-15  
**Owner:** Product / Engineering

## Context

VisuTry is still pre-break-even and has a deliberate objective to keep infrastructure cost near zero / low fixed cost for as long as this does not slow the business.

A sequence of Vercel resource optimizations has already moved many public routes from request-time rendering to static generation, reduced middleware invocations, and removed unnecessary SSR session dependencies. Those changes improved both cost efficiency and architecture.

As traffic grows, however, repeatedly changing application behavior only to fit hosting-plan resource ceilings would create an increasing engineering tax. VisuTry is also expanding from the consumer product into Store / Campaign workloads, which increases static, image, merchant, and campaign traffic.

Cloudflare is therefore no longer treated only as a hypothetical fallback. It should be a tested deployment option before Vercel becomes a constraint.

## Decision

1. **Vercel remains the production host in the near term.** There is no immediate production migration.
2. **Cloudflare becomes the prepared migration target.** Engineering should establish and maintain a reproducible Cloudflare/OpenNext staging deployment and compatibility audit.
3. Existing Vercel optimization work remains valid and should continue where it improves performance, cacheability, or architecture.
4. VisuTry should avoid unnecessary new Vercel-only coupling, while preserving product velocity.
5. Migration should occur only when both conditions are true:
   - there is a real economic, policy, resource, or operational reason to leave Vercel; and
   - Cloudflare has passed production-parity validation with a practical rollback path.
6. The objective is **not `$0` hosting at any cost**. Engineering time is part of infrastructure economics.

Operating principle:

> Optimize for optionality: Vercel today, Cloudflare-ready tomorrow.

## Consequences

### Required

- Create a Cloudflare/OpenNext staging path before migration becomes urgent.
- Audit auth, Stripe webhooks, Neon, Blob/storage, ISR/cache semantics, images, middleware, cron/background work, uploads, long-running generation, locale routing, and Store/Campaign boundaries.
- Treat Vercel Blob as an explicit migration coupling point and evaluate continued cross-cloud use versus R2 when needed.
- Keep migration criteria and parity checks documented.

### Easier

- Future hosting migration can be driven by economics and growth rather than urgency.
- Product teams can distinguish architecture/performance optimization from quota-driven work.
- Consumer SEO growth and Store/Campaign growth have a clearer infrastructure escape path.

### Harder / Cost

- A second deployment target introduces some maintenance and testing overhead.
- Full provider abstraction is not required; selective portability must be managed intentionally.

### Deferred

- No immediate production cutover.
- No forced migration of Neon, Stripe, authentication, or AI providers.
- No storage migration until Blob becomes a meaningful cost, performance, or portability issue.

## Migration Review Triggers

Re-evaluate cutover when:

- Vercel limits repeatedly drive engineering work;
- commercial-plan policy/pricing becomes a blocker;
- consumer or merchant traffic materially changes hosting economics;
- image/origin/function/ISR constraints affect growth;
- or Cloudflare staging reaches production parity.

A rough 10K–20K+ monthly-user level can be used as a review checkpoint, not as an automatic migration threshold.

## Related Documents

- `docs/operations/hosting-strategy-vercel-cloudflare.md`
- `docs/operations/vercel-cpu-static-page-pilot.md`
- `docs/decisions/ADR-005-ssr-to-client-gate.md`
