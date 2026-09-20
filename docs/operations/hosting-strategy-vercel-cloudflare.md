# Hosting Strategy — Vercel + Cloudflare

**Status:** Active source of truth for hosting/runtime ownership
**Owner:** Product / Engineering
**Last updated:** 2026-09-20
**Review cadence:** When production route ownership, cache ownership, runtime provider, or frontend ownership changes
**Scope:** Production responsibility boundary between Vercel, Cloudflare, and shared external services.

## 1. Decision

VisuTry uses a hybrid edge architecture with a strict ownership rule:

> **Vercel produces the Next.js application. Cloudflare provides the governed edge around it.**

The system is not a dual-frontend deployment.

The objective is no longer to answer "Vercel or Cloudflare?" as a provider-selection question. The validated direction is a hybrid execution model based on workload shape.

## Next frontend ownership (authoritative, 2026-08-19 cutover)

**Next frontend owner: Vercel.** Vercel is the SOLE producer of:

- Next HTML
- RSC / Flight responses
- the Next client artifact graph
- `/_next/static/*`

**Cloudflare owns:**

- non-Next public static assets (`/images/*`, `/home/*`, `/experience-heroes/*`, `/blog-covers/*`, `/assets/*`, `/favicon.ico`, `/robots.txt`, `/llms.txt`)
- approved lightweight edge APIs (`/api/health`, `/api/glasses/brands|categories|face-shapes`)
- public / direct-Neon lightweight reads
- proxy / CDN / WAF / traffic shaping
- cached final anonymous HTML responses produced by Vercel, but only for the exact reviewed Public HTML Offload allowlist

The `/_next/static` shared namespace must have exactly one producer. Serving a second (`CLOUDFLARE_BUILD=1` + OpenNext) client graph from it caused the 2026-08-19 production `ChunkLoadError`. The `www.visutry.com/_next/static/*` Worker Route is **FORBIDDEN** and hard-blocked in code (`cloudflare-router/b4-production-routes.ts`, `cloudflare-router/b4-production-public-slice.ts`).

Production Worker Routes are **REPO-MANAGED** in [`wrangler.production-traffic-layer.jsonc`](../../wrangler.production-traffic-layer.jsonc). Route changes require Git review; emergency Dashboard edits must be reconciled immediately. `npm run cf:routes:check` performs a read-only local-versus-live route drift check.

The production traffic-layer build/deploy explicitly selects
`cloudflare-router/app-host-worker.ts` through the dedicated Wrangler config;
it does not select an OpenNext Worker or a Next/Prisma application runtime.
The production boundary guard and CI run on this explicit configuration.

> Cloudflare must not independently render or produce production Next HTML, RSC/Flight, or client artifacts. It may serve a cached final anonymous HTML response produced by the canonical Vercel deployment for the exact reviewed Public HTML Offload allowlist.

Enforcement:

- Classifier `classifyB4ProductionPublicSlice` marks all Next HTML / RSC / `/_next/static` as `vercel-required`; the Worker (`app-host-worker.ts`) additionally hard-guards `/_next/*` and RSC to Vercel via `forceVercelForNextFrontend`.
- The production route generator emits only the approved non-Next routes; `assertSafeB4ProductionRoutes` fails on any `/_next/*` route.
- `scripts/production-smoke.mjs` fails the release on any Cloudflare-owned Next HTML/static/RSC, or any referenced `/_next/static` asset that 404s.
- `cloudflare-router/b4-static-asset-parity.ts` is now a forensic/regression guard only — a PASS does NOT authorize enabling Cloudflare `/_next/static`.

## Current Decision

VisuTry adopts a **Hybrid Edge Architecture**.

Operating principle:

> **Cloudflare for traffic scale; backend services for compute complexity.**

More specifically:

- **Cloudflare is the preferred traffic-scale/edge layer** for proven high-frequency, low-compute, stateless or narrowly stateful workloads.
- **Vercel remains the current backend execution environment** for Stripe, Blob, AI orchestration, cron/background, broad admin, full MCP OAuth/DCR/source intake, and other heavy or unverified paths.
- **Neon remains the shared relational source of truth.**
- Existing Vercel/Prisma paths may remain intact where appropriate; Cloudflare paths use lightweight direct-Neon repositories where proven.
- Production rollout will be capability-based and incremental. There is no approved big-bang migration.

This strategy is formalized by:

- `docs/decisions/ADR-010-hybrid-edge-architecture-for-store-campaign-scale.md`

ADR-009 remains the historical decision that initiated and justified Cloudflare optionality work.

ADR-010 remains valid at the architectural-principle level (Cloudflare for traffic scale; backend for compute complexity; Neon as relational source of truth). This document defines how that principle is executed as three traffic layers. It does not rewrite ADR-010.

## Current production state (2026-09-20)

The Consumer Public HTML Offload is **PRODUCTION PASS**. The active production
deployment identity and Worker version are verified by the release control
plane; exact route inventory remains code-authoritative. Seven exact Public
HTML URLs were purged and observed to transition from valid `MISS` to `HIT`
with HTTP 200; cache hits exposed both `x-visutry-edge-cache: HIT` and
`CF-Cache-Status: HIT`. Browser smoke passed for the seven Public pages, while
Try-On, Face Analysis, and Dashboard remained healthy.

This validation changed no Vercel configuration, DNS, D1 data, or unrelated Cloudflare rules. The exact seven-route inventory remains code-authoritative in `cloudflare-router/public-html-offload.ts`.

Store/Campaign Public Edge is now **PRODUCTION PASS** for the bounded EN `/store/*` and `/c/*` public families. These routes do not create a second Next producer: Vercel continues to produce canonical HTML, while Cloudflare may cache only safe final anonymous HTML and proxies every unsafe or unknown variant to Vercel. Store/Campaign freshness is write-driven through deterministic per-document Cache-Tag invalidation, not the Consumer seven-URL release warm-up list. The edge query contract allows only attribution and bounded client continuation keys whose values do not affect server HTML; unknown keys, RSC/Flight, cookies, authorization, preview, and personalization bypass to Vercel.

The production proof covered anonymous HTML `MISS → HIT`, canonical delivery,
hydration, query-variant coherence, and write-driven invalidation followed by
exact restoration. The public-to-interactive boundary is intentional: passive
delivery does not create a Store Session; the explicit privacy/interaction
boundary creates exactly the session required by the canonical application path,
with UTM attribution preserved. No image upload, AI, quota, or payment side
effect was part of the cutover proof. Exact route inventory remains owned by
the current code/generated manifest rather than this document.

## Three-Layer Traffic Execution Model

This is the canonical production traffic model. “Cloudflare traffic” does **not** mean every request invokes a Worker.

Preferred order:

> Static Asset → Worker only if necessary → Backend only if necessary

ADR-011 is authoritative: Vercel is the sole production producer of Next HTML, RSC/Flight, the browser client artifact graph, and `/_next/static/*`.

```text
Internet
   |
   v
Cloudflare
DNS / proxy / CDN / WAF / governed cache / approved non-Next capabilities
   |
   v
Vercel
sole Next.js producer + primary backend runtime
   |
   +---- PostgreSQL
   +---- AI providers
   +---- Stripe
   +---- Vercel Blob
   +---- Email / other integrations
```

## 2. Vercel ownership

Cloudflare Static Assets are served from the Workers Static Assets directory (`.open-next/assets`) when `run_worker_first` is `false` and the URL is an exact asset match. In the production traffic-layer build, this directory is populated from `public/`; the OpenNext output is reserved for staging/full-migration research. This layer is limited to explicitly assigned non-Next assets and does not make Cloudflare a producer of the Next frontend.

Vercel is the canonical production owner for:

- Next HTML;
- RSC / Flight responses;
- `/_next/static/*` and the browser client graph;
- Next runtime redirects and sitemap output;
- the primary Next.js application/API runtime;
- AI orchestration and heavy generation paths;
- Stripe/payment fulfillment;
- Vercel Blob workflows;
- cron/background work;
- broad Admin behavior;
- full MCP OAuth/DCR/source-intake behavior unless a narrower capability is separately classified.

A route being static, cacheable, or edge-eligible does not by itself transfer production ownership away from Vercel.

## 3. Cloudflare ownership

Cloudflare provides:

- DNS / reverse proxy;
- CDN and WAF/security controls;
- traffic shaping;
- explicitly approved non-Next public assets and lightweight edge APIs;
- the isolated MediaPipe asset path on `assets.visutry.com` backed by R2;
- a governed D1 cache rule for a bounded subset of anonymous SEO document HTML;
- direct-Neon capabilities where proven;
- capability classification (`cf-ready` vs `vercel-required` vs `unknown-fallback`);
- proxy routing for `vercel-required` and unknown requests to Vercel. These requests **count against** the Worker request quota.

Layer 2 must not be used as a quota offload via Workers Caching. Cache hits still count as Worker requests and can bill otherwise-free Layer 1 assets.

The production traffic layer does not build or execute a peer Next/OpenNext frontend. Vercel remains responsible for producing Next HTML, RSC/Flight, redirects, sitemaps, and business/page-data execution; Cloudflare may only deliver the reviewed cached final HTML copy. OpenNext remains available only through explicit staging/research commands.

Exact production Worker route intent is code-authoritative in:

- `cloudflare-router/b4-production-routes.ts`
- `cloudflare-router/b4-production-routes.json`

Do not copy the route count into architecture decisions as a durable invariant; the generated manifest owns the exact current set.

Unknown/unapproved capabilities remain on/fall back to the canonical Vercel path.

## 4. D1 SEO HTML Cache Shield

The D1 cache rule is a **cache layer**, not a second Next renderer.

Vercel still produces the eligible HTML. Cloudflare may serve a cached copy only when the request satisfies the repository-owned eligibility contract.

Current contract is owned by:

- `cloudflare-router/d1-cache-governance.ts`
- `scripts/d1-cache-governance.ts`
- `.github/workflows/` deployment/purge governance associated with the rule

The governed rule currently limits caching to approved localized SEO detail families and excludes private or ambiguous requests, including requests carrying Cookie/Authorization, RSC/Flight signals, prefetch/prerender signals, query strings, or truncated headers.

The current code also owns the TTL, rule identity/order, purge prefixes, drift verification, and production-deployment proof requirements. Those values must not be duplicated here as permanent architecture constants.

The D1 shield remains **active and transitional** with the final P0.5E decision
`KEEP_FOR_NOW`. P0.5E did not prove the historical ISR/FOT root cause because
the observation window was contaminated by production changes and lacked
sufficiently comparable project- and route-level Vercel evidence. This does
not claim that current Public behavior is unhealthy; it means the historical
cause remains unproven. Removal requires a separate evidence-backed decision
after a clean production observation window.

### D1 invariant

> A Cloudflare cache hit does not change Next frontend ownership. The cached object must originate from the verified Vercel production deployment governed by the cache contract.

## 5. Public Web and Consumer App boundary

The Next App Router has an explicit runtime boundary between:

- **Public Web:** anonymous-first SEO, editorial, guide, and marketing surfaces with a deterministic public shell. These pages do not initialize `ConsumerSessionBoundary`, `SessionProvider`, or `PaymentConversionTracker`, and their normal anonymous load does not request `/api/auth/session`.
- **Consumer App:** session-aware application surfaces such as Try-On, Compare, Face Analysis, Style Explorer, Dashboard, payments, and related workflows. These retain the established Consumer session runtime and auth-aware navigation.

Public links may still lead to Consumer App functionality after intentional user navigation. The boundary changes runtime ownership, not public URL shape; exact route membership remains code-authoritative.

## 6. Public delivery and rendering guardrails

- Public high-link-density navigation defaults to no speculative prefetch for Public-to-Public and Public-to-Consumer links. Consumer App navigation retains normal application behavior.
- Fixed, sufficiently large repository-owned editorial/SEO assets may bypass runtime transformation through direct delivery. Mobile, compact, and responsive placements remain on Next Image optimization; user-uploaded and generated assets remain on their dynamic/runtime paths.
- Most Public Web content is static-first. Intentional runtime ISR remains for the runtime-mutable dynamic sitemap and public Store merchant / Campaign pages, because those surfaces can change between deployments. Successful public-discovery writes invalidate where implemented, while the time-based interval is a safety net. Exact routes and revalidation values remain in code.

## 7. Next frontend guardrail

While ADR-011 is active:

- Cloudflare/OpenNext must not emit production Next HTML.
- Cloudflare must not own production RSC/Flight.
- `www.visutry.com/_next/static/*` must not be a Cloudflare Worker Route.
- A same-commit Cloudflare build is not considered the same client artifact graph.
- A future frontend migration must move the complete Next ownership boundary atomically and supersede ADR-011.

OpenNext/Cloudflare builds remain useful for staging, compatibility testing, and future optionality; they are not an independent production Next frontend.

## 8. Capability allocation

| Capability | Current production owner/path |
| --- | --- |
| Next HTML / RSC / client artifacts | Vercel |
| Eligible anonymous SEO HTML cache | Cloudflare D1 cache of Vercel-produced HTML |
| Non-Next public assets explicitly routed at edge | Cloudflare |
| MediaPipe WASM/model assets | `assets.visutry.com` Cloudflare Worker + R2 |
| Approved lightweight edge APIs | Cloudflare, only where generated route intent allows |
| Primary application/API runtime | Vercel |
| AI generation/orchestration | Vercel/backend |
| Stripe/payment fulfillment | Vercel/backend |
| Blob lifecycle | Vercel/backend |
| Cron/background work | Vercel/backend |
| Broad Admin | Vercel/backend |
| Full MCP OAuth/DCR/source intake | Vercel/backend |
| Relational business state | PostgreSQL (current production provider: Neon) |

Capability-specific edge adapters may exist, but each must have a single authoritative business contract and explicit production routing classification.

## 9. PostgreSQL boundary

PostgreSQL is the relational architecture contract. Neon is the current production provider, not a required business-domain dependency.

Canonical backend application access uses Prisma. Runtime connection resolution is centralized in `src/lib/postgres-runtime.ts`; CLI/migrations use the direct/unpooled path governed by `prisma.config.ts` when required.

Cloudflare/direct-SQL adapters may be used only for explicitly proven edge capabilities. They must preserve the same tenant isolation and business invariants as the canonical backend path.

## 10. Scale model

The scale strategy is:

1. avoid unnecessary dynamic/server work on public traffic;
2. let Cloudflare absorb safe proxy/CDN/cache/static traffic within governed boundaries;
3. keep the canonical Next producer and heavy stateful/compute work on Vercel;
4. keep durable business state in PostgreSQL;
5. move a capability only when production evidence justifies a new owner.

Store/Campaign growth must not automatically imply a second application runtime or duplicate business implementation. High-frequency read/cache paths can be optimized independently from AI/payment/write paths.

## 11. Safety invariants

1. One authoritative runtime/business implementation per capability.
2. One Next frontend producer.
3. One durable writer/transaction owner for a state transition.
4. Unknown/unclassified production traffic stays on the canonical path.
5. No cross-runtime automatic write retry that can duplicate state changes.
6. Cache layers must preserve privacy/auth bypass rules.
7. Cache invalidation must be tied to verified production deployment state where required by the governed contract.
8. Provider-specific edge optimizations must not redefine domain semantics.

## 12. Operational authority

Read current hosting decisions in this order:

1. `docs/decisions/ADR-011-vercel-sole-next-frontend-owner.md`
2. this document
3. `cloudflare-router/b4-production-routes.ts` + generated route manifest for exact Worker route intent
4. `cloudflare-router/d1-cache-governance.ts` for exact D1 cache behavior
5. `docs/operations/README.md` for current operational navigation
6. ADR-010 for the broader hybrid-edge rationale
7. historical Cloudflare migration/incident documents only for evidence and rationale

## 13. Historical migration material

The Cloudflare Phase A/B/B4 documents are retained as migration/incident evidence. They do not authorize current production routing when they conflict with ADR-011, this strategy, the generated route manifest, or the D1 cache governance contract.

Do not reintroduce old route-count plans, dual Next builds, or phase-specific topology diagrams into the active architecture authority.

## Implementation Roadmap

Architecture discovery is considered complete unless new evidence invalidates a core assumption.

The default work mode is now implementation and rollout.

### Stage 1 — Staging capability routing

Prove that a staging routing layer can send explicit Cloudflare-ready capabilities to the Worker and default unsupported capabilities to the existing Vercel/backend origin.

Validate auth/cookies, request bodies, redirects, security, write ownership, observability, and rollback behavior.

### Stage 2 — Public-read production slice

Move only individually proven public/static/read-heavy routes to Cloudflare ownership.

Keep the existing backend as the fallback/origin for unsupported capabilities.

The Consumer Public HTML Offload and bounded EN Store/Campaign public edge are
the validated public-read production slices. Keep them stable while observing
cache correctness, freshness, attribution, and resource behavior. This does
not change additional locales, `/_next`, RSC, API, or interactive ownership.

### Stage 3 — Authenticated-read slice

Move already-proven Auth0/JWT and direct-Neon protected reads after production routing/cookie behavior is validated.

### Stage 4 — Proven write slice

Move only explicitly verified Store/Campaign/Merchant write capabilities. Maintain one authoritative writer and idempotent rollback procedures.

### Stage 5 — Retain heavy backend workloads

Keep Stripe, Blob, AI, cron/background, full MCP OAuth/source intake, and broad admin workloads on the existing backend until each has a separate economic and technical justification to move.

### Stage 6 — Scale Store / Campaign deliberately

As Store/Campaign traffic grows, prioritize edge delivery, caching, lightweight reads, attribution/session/event paths, and bounded request execution so traffic growth does not translate directly into heavyweight backend cost.

Near-term work is limited to operating and reviewing Release Engineering v1 and
the live bounded public-edge contracts. Later work may consider a verified
Vercel Production trigger, additional locales, and more granular invalidation
only when production evidence justifies it. Store/Campaign offload itself is
no longer a future or proposed capability.

## Production Migration Gate

There is no requirement to complete a full provider migration before production can use Cloudflare.

Production adoption should occur by capability only after:

- real staging evidence exists;
- security and tenant isolation pass;
- SEO/cache/cookie behavior is acceptable;
- bundle and runtime budgets are acceptable;
- observability exists;
- rollback is documented and practical;
- the workload has one authoritative execution owner.

The production domain/DNS must not be changed as a big-bang migration solely to achieve architectural purity.

## Non-Goals

- Reopening a broad Vercel-vs-Cloudflare provider comparison without new evidence.
- Achieving `$0` infrastructure cost at any engineering cost.
- Moving every VisuTry capability to Cloudflare.
- Migrating Neon to D1 without a separate business/technical justification.
- Migrating Blob to R2 simply for provider consistency.
- Running long or heavy AI/background workloads in a Free Worker merely because it is technically possible.
- Maintaining two independent application truths or two writers for the same capability.

## Review Triggers

Revisit this architecture only when material evidence changes, for example:

- Store/Campaign traffic changes the workload profile materially;
- Workers Free/paid economics become materially different from the current assumptions;
- the current Vercel/backend path becomes a cost, policy, reliability, or capability blocker;
- a major integration can no longer operate safely in the selected runtime;
- Neon or another shared dependency becomes the actual scaling bottleneck;
- operational complexity of the hybrid architecture exceeds its economic benefit.

Routine implementation work should not reopen the architecture decision.

## Related Documents

- `docs/decisions/ADR-009-vercel-cloudflare-hosting-optionality.md`
- `docs/decisions/ADR-010-hybrid-edge-architecture-for-store-campaign-scale.md`
- `docs/operations/cloudflare-phase-a-build-parity.md`
- `docs/operations/cloudflare-phase-b1-auth-read-parity.md`
- `docs/operations/cloudflare-phase-b2-write-parity.md`
- `docs/operations/cloudflare-phase-b3-integration-audit.md`
- `docs/operations/cloudflare-production-route-boundary.md`
- `docs/operations/cloudflare-b4-production-cutover-readiness.md`
- `docs/operations/vercel-cpu-static-page-pilot.md`

## Change log

| Date | Change |
| --- | --- |
| 2026-08-19 | Established Vercel as the sole production Next frontend owner after the dual-client-graph incident. |
| 2026-09-12 | Consolidated the hosting authority around current ownership; removed obsolete Layer-1/Layer-2 wording that implied Cloudflare could produce production Next HTML/assets; incorporated the governed D1 SEO HTML Cache Shield without changing Vercel frontend ownership; made route/cache detail code-authoritative. |
| 2026-09-13 | Added the P0.5A Public Web / Consumer App boundary and P0.5B–D delivery/rendering guardrails; kept D1 active but transitional pending P0.5E evidence. |
| 2026-09-17 | Reconciled current production traffic-layer build/route governance; recorded P0.5E as unresolved and retained the D1 ownership boundary as `KEEP_FOR_NOW` pending a clean observation window. |
| 2026-09-20 | Recorded the bounded EN Store/Campaign Public Edge as `PRODUCTION PASS`; preserved Vercel as sole Next producer and documented write-driven Cache-Tag freshness plus the public-to-interactive session boundary. |
