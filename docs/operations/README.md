# VisuTry Operations

**Status:** Active operations documentation index  
**Owner:** Product / Engineering

## Current Documents

| Document | Status | Purpose |
| --- | --- | --- |
| `hosting-strategy-vercel-cloudflare.md` | **Canonical / Active** | Current hosting strategy, Cloudflare readiness plan, migration triggers, and parity criteria |
| `vercel-quota-emergency-reduction.md` | **Active** | Hobby ISR Reads / Fast Origin Transfer emergency reductions (static SEO, middleware, public GET cache) |
| `cloudflare-phase-b3-integration-audit.md` | **Active milestone** | Compatibility, dependency, cost, bundle, architecture, and production-gate audit for remaining Cloudflare integrations |
| `cloudflare-production-route-boundary.md` | **Active milestone** | B3.1 bundle-drift diagnosis and definitive Cloudflare/Vercel production route boundary |
| `cloudflare-b3-2-capability-routing.md` | **Active milestone** | B3.2 same-host staging capability router, reconciled onto current main, explicit Vercel fallback |
| `cloudflare-b4-production-cutover-readiness.md` | **Active milestone** | B4.1 production cutover readiness and first public slice plan (no DNS / no production traffic) |
| `cloudflare-phase-b2-write-parity.md` | **Active milestone** | Scoped Cloudflare Free-plan Auth, merchant, Store DRAFT, and Campaign DRAFT write parity evidence |
| `vercel-cpu-static-page-pilot.md` | Historical + Active Reference | Detailed Vercel static-rendering, ISR, middleware, and CPU optimization work already completed |

## Hosting Source of Truth

For current hosting direction, use:

- `docs/operations/hosting-strategy-vercel-cloudflare.md`
- `docs/decisions/ADR-009-vercel-cloudflare-hosting-optionality.md`

The Vercel CPU static-page document remains an implementation/history reference. It should not be interpreted as a decision to optimize indefinitely around Vercel-specific resource limits.
