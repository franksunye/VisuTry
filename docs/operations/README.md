# VisuTry Operations

**Status:** Active operations documentation index  
**Owner:** Product / Engineering

## Current Documents

| Document | Status | Purpose |
| --- | --- | --- |
| `hosting-strategy-vercel-cloudflare.md` | **Canonical / Active** | Hybrid hosting strategy and canonical three-layer traffic model (Static Assets → Worker → Vercel/backend) |
| `vercel-quota-emergency-reduction.md` | **Active** | Hobby ISR Reads / Fast Origin Transfer emergency reductions (static SEO, middleware, public GET cache) |
| `cloudflare-phase-b3-integration-audit.md` | **Active milestone** | Compatibility, dependency, cost, bundle, architecture, and production-gate audit for remaining Cloudflare integrations |
| `cloudflare-production-route-boundary.md` | **Active milestone** | B3.1 bundle-drift diagnosis and definitive Cloudflare/Vercel production route boundary |
| `cloudflare-b3-2-capability-routing.md` | **Active milestone** | B3.2 same-host staging capability router, reconciled onto current main, explicit Vercel fallback |
| `cloudflare-b4-production-cutover-readiness.md` | **Active milestone** | B4.1 production cutover readiness: first public slice, Static Asset vs Worker audit, corrected Free-plan quota model (no DNS / no production traffic) |
| `cloudflare-b4-2a-staging-public-slice.md` | **Active milestone** | B4.2A staging public-slice activation, three-layer proof, DNS inventory, scoped-route B4.2B gate (no production DNS / no merge) |
| `cloudflare-b4-2b-scoped-production-routes.md` | **Active milestone** | B4.2B scoped production Worker Routes: 286-pattern allowlist, P0–P2 ramp, cutover gates (merged in PR #95; routes not activated) |
| `cloudflare-b4-2c-phase-a-dns-zone.md` | **Closed / PASS** | B4.2C Phase A: inactive Cloudflare zone created, DNS mirror PASS, www DNS_ONLY (historical; NS cutover is B1) |
| `cloudflare-b4-2c-phase-b1-ns-cutover.md` | **Closed / PASS** | B4.2C Phase B checkpoint B1: Namecheap NS → Cloudflare; www remains DNS_ONLY; Worker Routes 0 |
| `cloudflare-b4-2c-phase-b2-universal-ssl.md` | **Closed / PASS** | B4.2C Phase B checkpoint B2: Universal SSL ACTIVE; SSL mode Full (strict); www remains DNS_ONLY; B3 not executed |
| `cloudflare-b4-2c-phase-b3-www-proxy.md` | **Closed / PASS** | B4.2C Phase B checkpoint B3: www DNS_ONLY → PROXIED; apex still DNS_ONLY; Worker Routes 0; Auth0 E2E operator-confirmed |
| `cloudflare-b4-2d-p0-production-cutover.md` | **Closed / PASS** | B4.2D: 12 ungated P0 production Worker Routes; `/_next/static/*` not activated; P1 not executed |
| `cloudflare-phase-b2-write-parity.md` | **Active milestone** | Scoped Cloudflare Free-plan Auth, merchant, Store DRAFT, and Campaign DRAFT write parity evidence |
| `vercel-cpu-static-page-pilot.md` | Historical + Active Reference | Detailed Vercel static-rendering, ISR, middleware, and CPU optimization work already completed |

## Hosting Source of Truth

For current hosting direction, use:

- `docs/operations/hosting-strategy-vercel-cloudflare.md` (canonical three-layer execution model)
- `docs/decisions/ADR-010-hybrid-edge-architecture-for-store-campaign-scale.md` (architectural principles; not rewritten by B4)
- `docs/decisions/ADR-009-vercel-cloudflare-hosting-optionality.md`

The Vercel CPU static-page document remains an implementation/history reference. It should not be interpreted as a decision to optimize indefinitely around Vercel-specific resource limits.
