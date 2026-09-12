# VisuTry Project Architecture

**Status:** Active source of truth for current technical architecture  
**Owner:** Engineering  
**Last reviewed:** 2026-09-12  
**Review cadence:** Monthly, and whenever a runtime, domain, persistence, or deployment boundary materially changes  
**Scope:** Current system shape, ownership boundaries, shared platform contracts, production runtime topology, persistence, and architectural guardrails.

## 1. Authority and scope

This document describes **current architecture**, not product priority, rollout history, or a file-by-file implementation inventory.

Use the following authorities for adjacent concerns:

- Product priority: `docs/product/product-plan.md`
- Product behavior: relevant specs under `docs/product/specs/`
- Durable architecture decisions: accepted ADRs under `docs/decisions/`
- Hosting/runtime ownership: ADR-011 + `docs/operations/hosting-strategy-vercel-cloudflare.md`
- Observability, analytics, attribution, and data-plane ownership: `docs/project/observability-and-analytics-contract.md`
- Exact implemented route/event/schema details: current code and generated manifests

Historical audits, migration plans, and dated operations evidence are useful context but are **not** current architecture authorities.

## 2. Architecture summary

VisuTry is a **modular monolith** built on Next.js App Router. Consumer, Store/Campaign, Merchant operator, Admin, and Agent surfaces share one application core and common platform services. There is no production microservice split today.

```text
Human / Agent traffic
        |
        v
Cloudflare edge
DNS / proxy / CDN / WAF / bounded cache / approved non-Next capabilities
        |
        v
Vercel Next.js application
Consumer | Store/Campaign | Merchant | Admin | MCP/Agent
        |
        +-------------------+
        | shared application|
        | + domain contracts|
        +-------------------+
          |       |       |
          v       v       v
     PostgreSQL  AI     Stripe / Blob / Email
       + Prisma  providers
```

The architectural objective is not to distribute code across providers for its own sake. The objective is to keep ownership explicit, preserve one source of truth per capability, and scale high-volume traffic without weakening product or data boundaries.

## 3. Product and domain boundaries

### Consumer

Standalone VisuTry decision journey:

```text
Face understanding
→ Advisor / recommendation
→ Try-On
→ Compare
→ paid continuation where applicable
```

Consumer routes may reuse shared generation, catalog, analytics, payment, and identity capabilities, but Consumer product behavior remains a separate domain boundary from Merchant commerce.

### Store / Commerce

`src/modules/store` is the current commerce application owner. It contains the Store/Campaign experience, catalog/frame use, shopper sessions, intent/events, analytics, public discovery, and commerce-facing try-on adapters.

The Storefront is a delivery surface; Campaign and commerce intelligence build on the same commerce domain rather than creating parallel product stacks.

### Merchant

`src/modules/merchant` owns the tenant/operator boundary: Merchant membership, onboarding, Control Center, Agent Keys, OAuth/MCP access, and merchant-facing operations.

`Merchant` is the tenant boundary. Tenant isolation must remain explicit in every read/write path.

### Business acquisition

`src/modules/business` is a narrow business-site / merchant-prospect boundary. It does not own merchant commerce runtime behavior.

### Admin

Admin is an operator surface over shared application contracts. It must not invent independent business rules, analytics formulas, campaign lifecycle rules, or persistence semantics.

## 4. Shared application contracts

Delivery surfaces must converge on shared application/domain contracts rather than duplicate logic.

Current examples include:

- generation orchestration and task/attempt telemetry;
- Experience/Store/Campaign lifecycle and readiness;
- Merchant analytics / commerce intelligence;
- attribution and intent/event semantics;
- tenant authorization and Merchant access rules;
- payment/credit/entitlement state transitions;
- public discovery invalidation.

A new UI, API, Admin screen, or Agent tool is another client of these contracts, not a reason to create a second business implementation.

Extraction into a new top-level domain/module is evidence-driven. Do not split the modular monolith merely to mirror product labels.

## 5. Technology baseline

| Layer | Current baseline |
| --- | --- |
| Web/application | Next.js 14 App Router, React 18, TypeScript |
| Localization | `next-intl` |
| Styling/UI | Tailwind CSS, Lucide |
| Authentication | NextAuth.js v4 + Auth0 |
| Relational persistence | PostgreSQL + Prisma 7 |
| Payments | Stripe |
| Object storage | Vercel Blob |
| AI generation / analysis | Gemini and configured generation-provider adapters, including asynchronous provider paths where enabled |
| Local face landmarks | MediaPipe Tasks Vision |
| Email | Resend / configured mail path |
| Operational telemetry | Axiom + Vercel runtime logs |
| Product/acquisition analytics | GA4 / GTM where configured |
| Primary application host | Vercel |
| Edge/security/cache | Cloudflare within explicitly governed boundaries |

Package versions and provider SDK versions are implementation facts and should be read from `package.json`, not duplicated here unless they define an architectural constraint.

## 6. Production runtime ownership

### Vercel owns the Next frontend

Per ADR-011, Vercel is the **sole production producer** of:

- Next HTML;
- RSC / Flight responses;
- the browser client artifact graph;
- `/_next/static/*`;
- Next runtime redirects and sitemap output.

Cloudflare must not independently produce production Next HTML/RSC/client artifacts while ADR-011 is active.

### Cloudflare is the governed edge layer

Cloudflare owns DNS/proxy/CDN/WAF/traffic shaping and may own explicitly approved non-Next capabilities. Current route intent is code-authoritative in `cloudflare-router/b4-production-routes.ts` and its generated manifest.

Cloudflare also has a narrowly governed **D1 SEO HTML Cache Shield** for eligible anonymous document HTML. This caches Vercel-produced HTML; it does **not** make Cloudflare a second Next frontend producer. Exact eligibility, TTL, bypass conditions, purge scope, and deployment verification are owned by `cloudflare-router/d1-cache-governance.ts` and `scripts/d1-cache-governance.ts`.

MediaPipe runtime/model assets use the isolated `assets.visutry.com` Cloudflare Worker + R2 delivery path.

### Heavy/backend capabilities

AI orchestration, Stripe fulfillment, Blob workflows, cron/background work, broad Admin behavior, and full MCP/OAuth/source-intake paths remain backend/Vercel-owned unless a separately governed capability is explicitly moved.

Unknown or unclassified production capabilities fail toward the canonical backend path rather than being silently reimplemented at the edge.

## 7. PostgreSQL and Prisma boundary

The architecture contract is **PostgreSQL**, not a database vendor SDK.

Current production PostgreSQL is hosted on Neon, but application architecture must remain provider-neutral where practical:

- `src/lib/prisma.ts` creates the shared Prisma client.
- `src/lib/postgres-runtime.ts` resolves runtime PostgreSQL connectivity from `POSTGRES_URL` or `DATABASE_URL` and applies runtime-specific connection behavior.
- Prisma CLI/migrations use a direct/unpooled connection path governed by `prisma.config.ts` and `DATABASE_URL_UNPOOLED` when required.

Provider-specific packages may exist for proven runtime/edge adapters, migration work, or fallback paths. Their presence does not make provider-specific behavior part of a domain contract.

### Persistence principles

1. PostgreSQL is the durable relational source of truth for application/business state.
2. Prisma is the primary application persistence layer on the canonical backend path.
3. Edge/raw-SQL adapters are alternate persistence adapters for explicitly proven capabilities, not alternate business logic.
4. One writer/transaction owner must exist for a given state transition.
5. No automatic cross-runtime write retry may create duplicate or divergent writes.
6. Schema migrations must use the governed migration path; runtime pool configuration must not leak into migration correctness.

## 8. Identity and session boundary

Consumer authentication uses NextAuth.js + Auth0 with JWT sessions. Authenticated UI should read session state through the established session contract rather than performing ad-hoc page-level database reads.

Merchant access adds tenant membership/authorization on top of user identity. A valid user session is not sufficient to authorize a Merchant resource; tenant ownership/membership must be checked by the owning application contract.

Agent authentication is a separate access path and must preserve the same Merchant tenant boundary and action-approval rules as human operator surfaces.

## 9. Generation architecture

Try-On and related AI generation use a shared orchestration path rather than surface-specific provider calls.

Durable reliability measurement separates the logical request from provider attempts so retries remain observable and reconstructable. `TryOnTask`, generation request/attempt telemetry, provider task identifiers, and Axiom correlation form the current reliability evidence chain where implemented.

Principles:

- product surfaces consume a shared generation capability;
- provider adapters are replaceable implementation details;
- retry/terminal-state behavior must be deterministic;
- quota/usage settlement must be durable and exactly-once for successful billable work;
- provider/runtime telemetry is operational evidence, not payment/business truth.

See `docs/operations/try-on-generation-reliability-baseline.md` for the active measurement contract.

## 10. Analytics and observability boundary

VisuTry intentionally separates three data planes:

1. **Operational telemetry** — Axiom + Vercel runtime logs.
2. **Product/acquisition analytics** — GA4/GTM where configured.
3. **Durable business truth** — PostgreSQL.

Merchant shopper truth is first-party and durable through MerchantSession / MerchantEvent / MerchantIntent contracts. GA4 does not replace those records. Axiom is not a business warehouse.

All detailed event ownership, Consumer/Commerce separation, attribution, Axiom dataset governance, and test/reference exclusion rules are owned by `docs/project/observability-and-analytics-contract.md`.

## 11. Agent-native boundary

Current agent entry points include:

- Remote MCP: `POST /api/mcp`
- Agent HTTP: `/api/agent/v1/**`
- Merchant Skill: `/skills/merchant`

The live MCP path uses the canonical Merchant/Store application contracts. Cloudflare-specific adapters may exist for bounded edge builds, but alternate adapters must preserve the same authorization and business invariants and must not become a second product implementation.

Agent actions that mutate merchant state must obey the same tenant isolation, readiness, approval, and lifecycle rules as human-operated surfaces.

## 12. Data ownership model

The following is a conceptual ownership map, not an exhaustive Prisma model list:

| Area | Durable ownership |
| --- | --- |
| Consumer identity / entitlement | User, payment/credit/subscription state |
| Consumer AI work | Try-On / Face Analysis / generation task state |
| Tenant | Merchant + membership/operator relationships |
| Commerce surface | Store/Experience/Campaign + catalog/frame relationships |
| Shopper behavior | MerchantSession → MerchantEvent → MerchantIntent |
| Activation / operator milestones | Merchant activation / onboarding state |
| Reliability evidence | generation request/attempt/task correlation + operational telemetry |

Exact fields and model names remain schema/code-authoritative.

## 13. Architectural guardrails

1. **Modular monolith first.** No microservice split without demonstrated ownership, scale, or deployment need.
2. **One capability, one authoritative business implementation.** Delivery surfaces reuse it.
3. **One Next frontend producer.** Vercel remains sole producer while ADR-011 is active.
4. **Caching is not ownership.** Cloudflare may cache governed Vercel output without becoming a second frontend runtime.
5. **Provider-neutral domain contracts.** Neon, Vercel, Cloudflare, Axiom, or AI-provider mechanics do not leak into business-domain semantics unless an ADR explicitly makes them architectural.
6. **PostgreSQL is business truth.** Logs/GA4 do not substitute for durable state.
7. **Tenant isolation is mandatory.** Merchant identity is an authorization boundary, not a reporting label.
8. **Consumer and Commerce remain isolated product domains** while sharing explicit platform services/contracts.
9. **Historical docs cannot override active authorities.** Migrations/audits remain evidence only.
10. **Volatile implementation inventories belong in code/generated manifests.** Architecture docs link to them instead of copying lists that drift.

## 14. Review triggers

Review this document when any of the following occurs:

- Next frontend ownership changes;
- Cloudflare gains or loses a production capability class;
- PostgreSQL provider or connection architecture materially changes;
- a new top-level application/domain module is introduced;
- Consumer/Commerce/Merchant ownership changes;
- MCP/Agent execution ownership changes;
- generation orchestration/provider ownership changes;
- a new data plane becomes authoritative for a class of facts;
- a new ADR supersedes a guardrail above.

Documentation-only implementation details, route counts, model fields, and package version bumps should normally update their local authority rather than expanding this document.

## Change log

| Date | Change |
| --- | --- |
| 2026-09-12 | Rebuilt the architecture authority around the current modular-monolith/domain boundaries; corrected PostgreSQL/Prisma provider abstraction; aligned Vercel/Cloudflare ownership with ADR-011 and the D1 cache shield; moved volatile route/event/schema detail back to code and specialized authorities. |
