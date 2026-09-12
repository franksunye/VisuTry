# VisuTry Operations

**Status:** Active operations documentation index  
**Owner:** Product / Engineering  
**Last updated:** 2026-09-12

## Current production authority

**Next frontend owner: Vercel.** Vercel is the sole producer of Next HTML, RSC/Flight, the Next client artifact graph, and `/_next/static`.

**Cloudflare owns the governed edge boundary:** DNS/proxy/CDN/WAF, approved non-Next public assets/lightweight edge APIs, the isolated MediaPipe asset path, and the bounded D1 SEO HTML cache rule. A D1 cache hit serves Vercel-produced HTML and does not transfer Next frontend ownership to Cloudflare.

The frontend-ownership decision is recorded in `docs/decisions/ADR-011-vercel-sole-next-frontend-owner.md`.

> Cloudflare must not independently produce production Next HTML/RSC/client assets until the entire Next frontend, including `/_next/static`, is migrated as one self-consistent build/runtime and ADR-011 is superseded.

## Active source-of-truth documents

| Document | Status | Purpose |
| --- | --- | --- |
| `hosting-strategy-vercel-cloudflare.md` | **Canonical / Active** | Current hybrid architecture and Vercel/Cloudflare responsibility boundary. |
| `../project/observability-and-analytics-contract.md` | **Canonical / Active** | Operational telemetry, GA4, business-truth, attribution, and dataset ownership. |
| `hybrid-performance-benchmark.md` | **Active / Long-term baseline** | Performance discipline for Cloudflare proxy/cache/edge and Vercel paths. |
| `production-route-migration-performance-protocol.md` | **Active / Scoped** | Protocol for future **non-Next capability** migrations. It does not authorize Next ownership changes while ADR-011 is active. |
| `vercel-quota-emergency-reduction.md` | **Active playbook** | Emergency Vercel quota/resource reduction actions. |
| `try-on-generation-reliability-baseline.md` | **Active / Measurement** | Generation reliability request/attempt model, DB evidence, Axiom correlation, and measurement process. |
| `cloudflare-next-static-route-incident-2026-08-19.md` | **Resolved P0 / Permanent guardrail** | Incident evidence behind the single Next frontend owner rule. |

## Exact production edge contracts

Do not maintain hand-copied route/cache inventories in multiple docs.

- Worker route intent: `cloudflare-router/b4-production-routes.ts` + generated JSON.
- D1 SEO HTML cache behavior: `cloudflare-router/d1-cache-governance.ts`.
- D1 inspection/purge/deployment verification: `scripts/d1-cache-governance.ts` + the associated GitHub workflow.
- Production smoke protection: `scripts/production-smoke.mjs`.

These implementation contracts own exact current routes, cache-eligible families/locales, TTL, bypass conditions, and purge scope.

## Current production boundaries

### Vercel

- Next HTML / RSC / `/_next/static`
- primary Next.js API/backend runtime
- AI generation/orchestration
- Stripe/payment fulfillment
- Vercel Blob workflows
- cron/background
- broad Admin
- full MCP OAuth/DCR/source intake unless a narrower capability is explicitly classified

### Cloudflare

- DNS/proxy/CDN/WAF/traffic shaping
- approved non-Next assets and lightweight edge APIs
- `assets.visutry.com` MediaPipe Worker + R2 path
- governed D1 cache of eligible anonymous Vercel-produced SEO HTML

### Shared persistence

- PostgreSQL is the relational source of truth; current production provider is Neon.
- Application architecture is provider-neutral at the PostgreSQL contract boundary.

## Hard guardrails

1. `www.visutry.com/_next/static/*` is forbidden as a Cloudflare Worker Route while ADR-011 is active.
2. Production Next HTML/RSC/client artifacts have one producer: Vercel.
3. D1 caching does not make Cloudflare an HTML producer.
4. Private/authenticated/RSC/prefetch/otherwise ineligible traffic must bypass the D1 cache according to the repository-owned contract.
5. Unknown/unapproved capabilities remain on the canonical Vercel path.
6. OpenNext parity/staging evidence does not authorize production Next ownership changes.
7. Any full Next migration requires a superseding ADR and atomic ownership change across HTML + RSC + client artifacts.

## Historical / archived migration documents

Earlier Cloudflare migration phase documents remain evidence, not current routing instructions. Use `docs/operations/ARCHIVE.md` as the archive/status index.

Examples include the Phase A/B/B4 build, auth, write-parity, routing, DNS, SSL and cutover records. Historical documents lose to ADR-011, the canonical hosting strategy, generated route intent, and current cache-governance code if they conflict.

## Hosting source of truth

Read in this order:

1. `docs/decisions/ADR-011-vercel-sole-next-frontend-owner.md`
2. `docs/operations/hosting-strategy-vercel-cloudflare.md`
3. `cloudflare-router/b4-production-routes.ts` / generated JSON for exact Worker route intent
4. `cloudflare-router/d1-cache-governance.ts` for exact cache behavior
5. ADR-010 for broader hybrid-edge rationale
6. ADR-009 and archived phase records as historical context

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

Delete only duplicates or documents with no remaining audit/reference value. Completed migration evidence can remain archived-by-status without becoming an active instruction.

## Vercel docs-only build skip verification

`scripts/vercel-ignore-build.sh` is configured through `vercel.json` as the Vercel Ignored Build Step. A commit containing only `docs/**` changes should be cancelled before `vercel build`; any commit containing a non-doc path continues through the normal build pipeline.
