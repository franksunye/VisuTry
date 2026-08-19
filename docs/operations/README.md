# VisuTry Operations

**Status:** Active operations documentation index  
**Owner:** Product / Engineering  
**Last updated:** 2026-08-19

## Current production authority

**Next frontend owner: Vercel.** Vercel is the sole producer of Next HTML, RSC/Flight, the Next client artifact graph, and `/_next/static`.

**Cloudflare owns:** DNS/proxy/CDN/WAF, approved non-Next public static assets, and the 4 approved lightweight edge APIs. Current production Worker Routes are exactly 12 non-Next routes.

The architectural decision is recorded in `docs/decisions/ADR-011-vercel-sole-next-frontend-owner.md`.

> Cloudflare must not serve production Next HTML/RSC/client assets until the entire Next frontend, including `/_next/static`, is migrated as one self-consistent build/runtime and ADR-011 is superseded.

## Active source-of-truth documents

| Document | Status | Purpose |
| --- | --- | --- |
| `hosting-strategy-vercel-cloudflare.md` | **Canonical / Active** | Current hybrid architecture, runtime ownership, and Cloudflare/Vercel responsibility boundary. |
| `hybrid-performance-benchmark.md` | **Active / Long-term baseline** | Synthetic/RUM performance discipline for Cloudflare proxy/static/Worker and Vercel paths. |
| `production-route-migration-performance-protocol.md` | **Active / Scoped** | Performance protocol for future **non-Next capability** migrations. It does not authorize Next HTML or `/_next/static` migration while ADR-011 is active. |
| `vercel-quota-emergency-reduction.md` | **Active playbook** | Emergency Vercel quota/resource reduction actions. |
| `cloudflare-next-static-route-incident-2026-08-19.md` | **Resolved P0 / Permanent guardrail** | Incident evidence behind the single Next frontend owner rule. |

## Current production Worker Route set

Only these 12 routes are approved:

### Non-Next static/control

- `www.visutry.com/blog-covers/*`
- `www.visutry.com/assets/*`
- `www.visutry.com/images/*`
- `www.visutry.com/home/*`
- `www.visutry.com/experience-heroes/*`
- `www.visutry.com/favicon.ico`
- `www.visutry.com/robots.txt`
- `www.visutry.com/llms.txt`

### Lightweight edge APIs

- `www.visutry.com/api/health`
- `www.visutry.com/api/glasses/brands`
- `www.visutry.com/api/glasses/categories`
- `www.visutry.com/api/glasses/face-shapes`

The code/generated manifest is authoritative for exact production route intent:

- `cloudflare-router/b4-production-routes.ts`
- `cloudflare-router/b4-production-routes.json`

Any remote route outside this set is configuration drift and must be reconciled.

## Hard guardrails

1. `www.visutry.com/_next/static/*` is **FORBIDDEN** as a Cloudflare Worker Route while ADR-011 is active.
2. Production Next HTML must not be emitted by OpenNext/Cloudflare.
3. RSC/Flight belongs to the same Next frontend owner as HTML and client chunks: Vercel.
4. Unknown/unapproved capabilities fall back to Vercel.
5. `cloudflare-router/b4-static-asset-parity.ts` is forensic/regression tooling only; parity does not authorize production Next ownership changes.
6. Any future full Next frontend migration requires a new/superseding ADR and an atomic ownership change covering HTML + RSC + `/_next/static`.

## Historical / archived migration documents

The earlier Cloudflare migration produced many phase documents. They remain valuable evidence but are **not current routing instructions**.

Use `docs/operations/ARCHIVE.md` as the archive index and status authority.

Important examples now classified as historical/superseded include:

- `cloudflare-phase-a-build-parity.md`
- `cloudflare-phase-a3-prisma-import-inventory.md`
- `cloudflare-phase-b1-auth-prisma-dependency-matrix.md`
- `cloudflare-phase-b1-auth-read-parity.md`
- `cloudflare-phase-b2-write-parity.md`
- `cloudflare-phase-b3-integration-audit.md`
- `cloudflare-production-route-boundary.md`
- `cloudflare-b3-2-capability-routing.md`
- `cloudflare-b4-production-cutover-readiness.md`
- `cloudflare-b4-2a-staging-public-slice.md`
- `cloudflare-b4-2b-scoped-production-routes.md` — **superseded; do not execute the old 286-route plan**
- `cloudflare-b4-2c-*`
- `cloudflare-b4-2d-p0-production-cutover.md`

Historical documents lose to ADR-011, the canonical hosting strategy, and the current generated route manifest if they conflict.

## Hosting source of truth

Read in this order for current infrastructure decisions:

1. `docs/decisions/ADR-011-vercel-sole-next-frontend-owner.md`
2. `docs/operations/hosting-strategy-vercel-cloudflare.md`
3. `cloudflare-router/b4-production-routes.ts` / generated JSON for exact route intent
4. `docs/decisions/ADR-010-hybrid-edge-architecture-for-store-campaign-scale.md` for the broader hybrid-edge principle
5. `docs/decisions/ADR-009-vercel-cloudflare-hosting-optionality.md` as historical architectural context

## Performance source of truth

Use:

- `hybrid-performance-benchmark.md` for the long-term benchmark model.
- `production-route-migration-performance-protocol.md` for non-Next route/capability experiments.
- `hosting-strategy-vercel-cloudflare.md` for the architecture being measured.

Do not infer architecture quality from a single Lighthouse run, provider dashboard metric, or stale migration milestone.

## Documentation lifecycle

Operations documents use these lifecycle classes:

- **Canonical / Active** — current authority.
- **Active playbook/protocol** — current bounded operational procedure.
- **Resolved incident / guardrail** — retained as evidence and permanent safety rationale.
- **Archived historical evidence** — retained for audit/context; not execution authority.
- **Superseded** — explicitly replaced; never use for current production changes.

Deletion is reserved for duplicates or documents with no remaining audit/reference value. The 2026-08-19 governance pass found no Cloudflare migration evidence document that justified destructive deletion; obsolete plans are therefore archived-by-status rather than removed.

## Vercel docs-only build skip verification

2026-08-19: `scripts/vercel-ignore-build.sh` is configured through `vercel.json` as the Vercel Ignored Build Step. A commit containing only `docs/**` changes must be canceled before `vercel build` runs; any commit containing a non-doc path must continue to the normal build pipeline.
