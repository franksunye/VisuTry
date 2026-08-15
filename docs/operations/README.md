# VisuTry Operations

**Status:** Active operations documentation index  
**Owner:** Product / Engineering

## Current Documents

| Document | Status | Purpose |
| --- | --- | --- |
| `hosting-strategy-vercel-cloudflare.md` | **Canonical / Active** | Current hosting strategy, Cloudflare readiness plan, migration triggers, and parity criteria |
| `vercel-cpu-static-page-pilot.md` | Historical + Active Reference | Detailed Vercel static-rendering, ISR, middleware, and CPU optimization work already completed |

## Hosting Source of Truth

For current hosting direction, use:

- `docs/operations/hosting-strategy-vercel-cloudflare.md`
- `docs/decisions/ADR-009-vercel-cloudflare-hosting-optionality.md`

The Vercel CPU static-page document remains an implementation/history reference. It should not be interpreted as a decision to optimize indefinitely around Vercel-specific resource limits.
