# ADR-010: Adopt a Hybrid Edge Architecture for Store / Campaign Scale

**Status:** Accepted  
**Date:** 2026-08-17  
**Owner:** Product / Engineering

## Context

ADR-009 established Cloudflare as a verified migration option while keeping Vercel as the production host. Since then, Phase A through B3.1 has produced concrete staging evidence rather than only compatibility assumptions.

The validated result is no longer a simple provider-replacement plan. VisuTry can run a meaningful subset of public, authenticated, merchant, Store, Campaign, and MCP workloads on Cloudflare Workers Free while keeping Prisma runtime/WASM out of the Worker bundle and continuing to use Neon as the relational source of truth.

At the same time, several capabilities remain materially better suited to the existing Vercel/backend path: Stripe payment execution and fulfillment, Vercel Blob workflows, AI orchestration, cron/background execution, broad admin capabilities, and full MCP OAuth/DCR/source-intake paths.

This distinction becomes more important as Store and Campaign grow. Store/Campaign traffic is expected to be high-frequency and predominantly low-compute at the shopper edge, while only a smaller subset of requests requires payment, AI, storage, long-running work, or integration-heavy execution.

The architecture therefore needs to optimize for traffic scale and workload shape rather than for a single hosting provider.

## Decision

VisuTry adopts a **Hybrid Edge Architecture** as the long-term hosting and runtime direction.

Operating principle:

> **Cloudflare for traffic scale; backend services for compute complexity.**

More explicitly:

> High-frequency, low-compute shopper traffic should execute at the Cloudflare edge where proven. Low-frequency, compute-heavy or integration-heavy workloads should remain on dedicated backend execution paths. Neon remains the shared relational source of truth.

### 1. Cloudflare is the traffic-scale layer

Cloudflare is the preferred execution surface for capabilities that are:

- high-frequency;
- latency-sensitive;
- stateless or narrowly stateful;
- low CPU;
- compatible with direct Neon access or static/cacheable delivery;
- proven through staging evidence;
- able to remain within the selected Workers Free budget while that constraint remains strategically useful.

Current proven examples include:

- localized static/public pages and assets;
- selected public catalog/glasses reads;
- Auth0/JWT callback, session, refresh, and logout behavior;
- protected direct-Neon user reads;
- merchant workspace/profile reads and provisioning;
- tested Store DRAFT and Campaign DRAFT operations;
- narrow stateless MCP bearer/tool execution;
- associated tenant isolation, rate limiting, credential, and audit paths.

### 2. Backend execution remains authoritative for heavy capabilities

Vercel is the current backend execution environment for capabilities that are compute-heavy, integration-heavy, long-running, or not yet proven on Workers.

Current examples include:

- Stripe checkout, portal, webhook fulfillment, refund, and payment writes;
- Vercel Blob upload, signed/private access, compensation, and cleanup;
- AI submit/poll/result orchestration and task/quota settlement;
- cron/background jobs;
- full MCP OAuth/DCR/CIMD/source intake;
- broad admin Prisma/Blob paths;
- consumer and Store writes that remain coupled to Prisma/Blob/AI workflows.

Vercel is not defined as the permanent backend provider. It is the current backend runtime. These workloads may later move to another backend or Cloudflare service only when evidence shows a material improvement in cost, performance, reliability, or operational simplicity.

### 3. Neon remains the relational source of truth

Neon/PostgreSQL remains the shared relational database across execution environments.

Cloudflare runtime paths should use lightweight, explicit direct-Neon repositories where needed. Existing Vercel paths may continue using Prisma where it remains appropriate.

There is no current architectural requirement to migrate to D1.

### 4. Store / Campaign is a primary architecture driver

Store and Campaign are expected to create significantly more shopper traffic than the current consumer application alone.

The intended traffic model is:

```text
Shopper / Agent
      |
      v
Cloudflare Edge / Capability Routing
      |
      +--> high-frequency / low-compute
      |      - Store / Campaign landing
      |      - catalog and configuration reads
      |      - attribution/session
      |      - selected interaction/event paths
      |      - proven merchant/agent operations
      |      - direct Neon
      |
      +--> compute/integration-heavy backend
             - AI generation/orchestration
             - Stripe/payment
             - object storage workflows
             - background jobs
             - full OAuth/source intake
```

The objective is to prevent Store/Campaign traffic growth from forcing every shopper request through a heavyweight dynamic application path.

### 5. Routing is capability-based, not provider-wide

Future production rollout should use an explicit capability/route boundary.

Each capability must have one authoritative execution owner at a time.

Required rules:

- `CLOUDFLARE_READY` capabilities may execute at Cloudflare only after staging evidence exists.
- `VERCEL_REQUIRED` capabilities remain on the current backend.
- `HYBRID` capabilities may use Cloudflare as the request/traffic boundary while backend execution remains elsewhere, but only after forwarding, auth, cookie, body, retry, and security behavior is proven.
- Unknown or unverified capabilities default to the existing backend.
- Writes must never be implicitly retried across both runtimes.
- No split-brain or dual-writer design is permitted for the same capability.

The canonical route/capability boundary is maintained in:

- `docs/operations/cloudflare-production-route-boundary.md`

### 6. Cloudflare Free is a budget constraint, not the architecture itself

Workers Free is currently useful because it allows VisuTry to absorb high-frequency low-compute traffic with minimal fixed infrastructure cost before break-even.

However, the architecture must not be distorted solely to preserve a free-plan limit.

Bundle size, request count, CPU time, and other platform limits are operational budgets. They should be measured continuously, but a future plan upgrade or backend change may be justified when business economics support it.

### 7. Provider migrations are evidence-driven

Do not migrate Neon, Stripe, Auth0, AI providers, Blob, or other external services simply to make the architecture more Cloudflare-centric.

A component should move only when the change materially improves one or more of:

- cost;
- latency;
- traffic scalability;
- reliability;
- operational simplicity;
- portability;
- product capability.

## Consequences

### Required

- Treat the hybrid Cloudflare/backend boundary as the default architecture for future Store/Campaign scale work.
- Implement capability routing and rollout incrementally rather than using a big-bang hosting cutover.
- Maintain a single relational source of truth in Neon.
- Preserve one authoritative writer per capability.
- Measure Cloudflare bundle/CPU/request budgets as part of relevant changes.
- Keep heavy external/async workloads behind explicit service boundaries.
- Design new Store/Campaign public traffic paths to be edge-friendly by default where practical.

### Easier

- Store/Campaign traffic can grow without proportionally increasing heavyweight backend execution.
- Public/read-heavy traffic can be scaled independently from AI/payment/background workloads.
- Vercel-specific limits no longer determine the whole application architecture.
- Individual integrations can be migrated independently when justified.
- Rollout and rollback can occur by capability rather than by replacing the entire application host.

### Harder / Cost

- Two execution environments require clear route ownership, observability, deployment discipline, and regression testing.
- Auth/cookie/header semantics must remain consistent across Cloudflare and backend paths.
- Bundle budgets and direct-Neon repositories add an additional engineering constraint.
- Hybrid routing must avoid caching, security, retry, and split-brain mistakes.

### Deferred

- No production DNS cutover is approved by this ADR.
- No full Cloudflare migration is required.
- No D1, R2, KV, Queues, Workflows, or Cloudflare Images adoption is required unless separately justified.
- Stripe, Blob, AI orchestration, cron/background, full MCP OAuth/DCR, and broad admin migration remain capability-specific future decisions.

## Implementation Direction

The architecture exploration phase is considered complete unless new evidence invalidates a core assumption.

Future work should primarily be implementation and rollout:

1. prove staging capability routing between Cloudflare and the current backend;
2. establish a lightweight production routing/fallback mechanism;
3. roll out public/read-heavy Cloudflare slices first;
4. add authenticated reads and already-proven writes incrementally;
5. retain heavyweight capabilities on the backend;
6. expand the Cloudflare boundary only when each capability passes explicit parity, security, cost, and rollback gates.

Do not reopen a broad "Vercel vs Cloudflare" provider comparison unless business economics, platform constraints, or technical evidence materially changes.

## Related Documents

- `docs/decisions/ADR-009-vercel-cloudflare-hosting-optionality.md`
- `docs/operations/hosting-strategy-vercel-cloudflare.md`
- `docs/operations/cloudflare-phase-b3-integration-audit.md`
- `docs/operations/cloudflare-production-route-boundary.md`
- `docs/operations/cloudflare-phase-b2-write-parity.md`
- `docs/operations/cloudflare-phase-b1-auth-read-parity.md`
