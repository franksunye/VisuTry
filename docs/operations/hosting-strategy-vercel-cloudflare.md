# Hosting Strategy — Vercel + Cloudflare

**Status:** Active source of truth for hosting/runtime ownership  
**Owner:** Product / Engineering  
**Last updated:** 2026-09-12  
**Review cadence:** When production route ownership, cache ownership, runtime provider, or frontend ownership changes  
**Scope:** Production responsibility boundary between Vercel, Cloudflare, and shared external services.

## 1. Decision

VisuTry uses a hybrid edge architecture with a strict ownership rule:

> **Vercel produces the Next.js application. Cloudflare provides the governed edge around it.**

The system is not a dual-frontend deployment.

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
- a governed D1 cache rule for a bounded subset of anonymous SEO document HTML.

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

### D1 invariant

> A Cloudflare cache hit does not change Next frontend ownership. The cached object must originate from the verified Vercel production deployment governed by the cache contract.

## 5. Next frontend guardrail

While ADR-011 is active:

- Cloudflare/OpenNext must not emit production Next HTML.
- Cloudflare must not own production RSC/Flight.
- `www.visutry.com/_next/static/*` must not be a Cloudflare Worker Route.
- A same-commit Cloudflare build is not considered the same client artifact graph.
- A future frontend migration must move the complete Next ownership boundary atomically and supersede ADR-011.

OpenNext/Cloudflare builds remain useful for staging, compatibility testing, and future optionality; they are not an independent production Next frontend.

## 6. Capability allocation

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

## 7. PostgreSQL boundary

PostgreSQL is the relational architecture contract. Neon is the current production provider, not a required business-domain dependency.

Canonical backend application access uses Prisma. Runtime connection resolution is centralized in `src/lib/postgres-runtime.ts`; CLI/migrations use the direct/unpooled path governed by `prisma.config.ts` when required.

Cloudflare/direct-SQL adapters may be used only for explicitly proven edge capabilities. They must preserve the same tenant isolation and business invariants as the canonical backend path.

## 8. Scale model

The scale strategy is:

1. avoid unnecessary dynamic/server work on public traffic;
2. let Cloudflare absorb safe proxy/CDN/cache/static traffic within governed boundaries;
3. keep the canonical Next producer and heavy stateful/compute work on Vercel;
4. keep durable business state in PostgreSQL;
5. move a capability only when production evidence justifies a new owner.

Store/Campaign growth must not automatically imply a second application runtime or duplicate business implementation. High-frequency read/cache paths can be optimized independently from AI/payment/write paths.

## 9. Safety invariants

1. One authoritative runtime/business implementation per capability.
2. One Next frontend producer.
3. One durable writer/transaction owner for a state transition.
4. Unknown/unclassified production traffic stays on the canonical path.
5. No cross-runtime automatic write retry that can duplicate state changes.
6. Cache layers must preserve privacy/auth bypass rules.
7. Cache invalidation must be tied to verified production deployment state where required by the governed contract.
8. Provider-specific edge optimizations must not redefine domain semantics.

## 10. Operational authority

Read current hosting decisions in this order:

1. `docs/decisions/ADR-011-vercel-sole-next-frontend-owner.md`
2. this document
3. `cloudflare-router/b4-production-routes.ts` + generated route manifest for exact Worker route intent
4. `cloudflare-router/d1-cache-governance.ts` for exact D1 cache behavior
5. `docs/operations/README.md` for current operational navigation
6. ADR-010 for the broader hybrid-edge rationale
7. historical Cloudflare migration/incident documents only for evidence and rationale

## 11. Historical migration material

The Cloudflare Phase A/B/B4 documents are retained as migration/incident evidence. They do not authorize current production routing when they conflict with ADR-011, this strategy, the generated route manifest, or the D1 cache governance contract.

Do not reintroduce old route-count plans, dual Next builds, or phase-specific topology diagrams into the active architecture authority.

## Change log

| Date | Change |
| --- | --- |
| 2026-08-19 | Established Vercel as the sole production Next frontend owner after the dual-client-graph incident. |
| 2026-09-12 | Consolidated the hosting authority around current ownership; removed obsolete Layer-1/Layer-2 wording that implied Cloudflare could produce production Next HTML/assets; incorporated the governed D1 SEO HTML Cache Shield without changing Vercel frontend ownership; made route/cache detail code-authoritative. |
