# Hosting Strategy — Hybrid Edge Architecture

**Status:** Active  
**Date:** 2026-08-17  
**Owner:** Product / Engineering

## Objective

Keep VisuTry infrastructure cost near zero / low fixed cost before break-even while building an architecture that can absorb materially larger Consumer, Store, and Campaign traffic without forcing every request through heavyweight backend execution.

The objective is no longer to answer "Vercel or Cloudflare?" as a provider-selection question. The validated direction is a hybrid execution model based on workload shape.

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

## Why This Changed

Earlier strategy was:

> Optimize for optionality: Vercel today, Cloudflare-ready tomorrow.

That was appropriate before the Cloudflare path was tested.

Phase A through B3.1 has now produced real staging evidence:

- OpenNext/Workers build and deployment are reproducible.
- The Cloudflare Worker fits the Workers Free compressed bundle limit without Prisma runtime/WASM.
- Public/localized routes and selected public reads work.
- Real Auth0 login/session/logout works.
- Protected direct-Neon reads work with ownership isolation.
- Merchant workspace reads and provisioning work with tenant isolation.
- Store DRAFT and Campaign DRAFT write paths work for the tested B2 scope.
- Narrow stateless MCP bearer/tool execution works.
- Several heavy integrations remain better suited to the current backend path.

The architecture question has therefore changed from:

> "Can VisuTry migrate away from Vercel?"

into:

> "Which workload should execute at the edge, and which workload requires heavier backend execution?"

That distinction is especially important for Store and Campaign.

## Store / Campaign Scale Model

Store/Campaign traffic is expected to create substantially more shopper requests than the current consumer application alone.

Most of that traffic should not require expensive server execution.

Typical high-frequency paths include:

- Store/Campaign landing and navigation;
- catalog/frame/configuration reads;
- attribution and session handling;
- lightweight merchant/public APIs;
- selected interaction/event ingestion;
- selected recommendation/read paths;
- narrow agent/MCP requests.

Heavy paths include:

- AI generation and orchestration;
- payment and Stripe fulfillment;
- object-storage lifecycle operations;
- long-running or retried background work;
- broad admin workflows;
- full OAuth/DCR/source-network operations.

Target traffic shape:

```text
Shopper / Agent
      |
      v
Cloudflare Edge / Capability Routing
      |
      +--> high-frequency / low-compute
      |      - Consumer public traffic
      |      - Store / Campaign landing
      |      - catalog/config reads
      |      - selected auth/read/write paths
      |      - direct Neon
      |
      +--> compute/integration-heavy backend
             - AI
             - Stripe
             - Blob/storage workflows
             - cron/background
             - full MCP OAuth/source intake
```

The architecture should ensure that Store/Campaign traffic growth does not cause heavyweight backend work to grow linearly with page views or shopper interactions.

## Architecture Responsibilities

| Capability | Direction |
| --- | --- |
| Public/static traffic | Cloudflare-preferred once route-level production rollout is approved |
| Public lightweight reads | Cloudflare + direct Neon where proven |
| Auth0/JWT session boundary | Cloudflare-capable for the tested path |
| Protected user reads | Cloudflare + direct Neon where proven |
| Merchant workspace/profile | Cloudflare + direct Neon where proven |
| Merchant provisioning | Cloudflare-capable for the tested scope |
| Store/Campaign DRAFT operations | Cloudflare-capable for the tested B2 scope |
| Narrow MCP bearer/tools | Cloudflare-capable; bundle budget remains monitored |
| Neon/PostgreSQL | Shared external relational source of truth |
| Stripe/payment fulfillment | Current Vercel/backend path |
| Blob/upload/cleanup | Current Vercel/backend path |
| AI generation/orchestration | Current Vercel/backend path |
| Cron/background work | Current Vercel/backend path |
| Full MCP OAuth/DCR/source intake | Current Vercel/backend path |
| Broad admin surface | Current Vercel/backend path until separately proven |

The canonical capability classification is maintained in:

- `docs/operations/cloudflare-production-route-boundary.md`

## Routing Principles

Production rollout must follow these rules:

1. **Explicit capability ownership.** Every route/capability has one authoritative runtime owner.
2. **Unknown defaults to the existing backend.** No broad wildcard migration of unverified APIs.
3. **One writer per capability.** Never dual-write between Cloudflare and Vercel.
4. **No automatic cross-runtime retry for mutations.** A failed write must not silently execute on both runtimes.
5. **Shared identity and database truth.** Auth0 remains the identity provider; Neon remains the relational source of truth.
6. **Security boundaries are preserved.** Tenant, ownership, role, webhook, and rate-limit semantics must survive routing changes.
7. **Rollback is route/capability based.** Reads should be able to return to the existing backend without database rollback; writes require drain/idempotency checks before ownership changes.

## Cloudflare Budget Discipline

Cloudflare Free is currently strategically useful because it can absorb meaningful edge traffic with minimal fixed infrastructure cost.

Current operational budgets include Worker bundle size, request count, CPU, and runtime limits. These must be measured as part of relevant changes.

However:

> The Free plan is a budget constraint, not the architecture itself.

Do not distort product or architecture solely to preserve a free-tier limit. Upgrade, split, or move a workload when the business economics justify it.

## Provider Independence

Keep provider-independent boundaries where practical:

- Neon remains external and shared.
- Stripe remains external.
- Auth0 remains external.
- AI providers remain external behind service interfaces.
- Storage remains on the current Blob path until an R2 or other migration is separately justified.

Do not migrate a component merely because Cloudflare offers an equivalent service.

A migration should materially improve at least one of:

- cost;
- latency;
- scalability;
- reliability;
- operational simplicity;
- portability;
- product capability.

## Implementation Roadmap

Architecture discovery is considered complete unless new evidence invalidates a core assumption.

The default work mode is now implementation and rollout.

### Stage 1 — Staging capability routing

Prove that a staging routing layer can send explicit Cloudflare-ready capabilities to the Worker and default unsupported capabilities to the existing Vercel/backend origin.

Validate auth/cookies, request bodies, redirects, security, write ownership, observability, and rollback behavior.

### Stage 2 — Public-read production slice

Move only individually proven public/static/read-heavy routes to Cloudflare ownership.

Keep the existing backend as the fallback/origin for unsupported capabilities.

### Stage 3 — Authenticated-read slice

Move already-proven Auth0/JWT and direct-Neon protected reads after production routing/cookie behavior is validated.

### Stage 4 — Proven write slice

Move only explicitly verified Store/Campaign/Merchant write capabilities. Maintain one authoritative writer and idempotent rollback procedures.

### Stage 5 — Retain heavy backend workloads

Keep Stripe, Blob, AI, cron/background, full MCP OAuth/source intake, and broad admin workloads on the existing backend until each has a separate economic and technical justification to move.

### Stage 6 — Scale Store / Campaign deliberately

As Store/Campaign traffic grows, prioritize edge delivery, caching, lightweight reads, attribution/session/event paths, and bounded request execution so traffic growth does not translate directly into heavyweight backend cost.

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
- `docs/operations/vercel-cpu-static-page-pilot.md`
