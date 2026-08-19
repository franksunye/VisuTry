# Hybrid Architecture Performance Benchmark

**Status:** Active / Long-term performance baseline  
**Date:** 2026-08-19  
**Owner:** Product / Engineering  
**Applies to:** `www.visutry.com`, Cloudflare edge/static/Worker execution, Vercel backend fallback, Neon-backed reads, and critical user journeys

## 1. Why This Document Exists

Performance is a first-class product and architecture concern for VisuTry.

The current production architecture is intentionally hybrid:

> **Static Asset → Worker only if necessary → Backend only if necessary**

Cloudflare is used for traffic scale and edge execution where the workload is suitable; Vercel remains the backend execution environment for heavy, stateful, or unverified workloads; Neon remains the shared relational source of truth.

Because requests can now execute through materially different paths, site performance can no longer be evaluated with a single aggregate "site speed" number or by comparing Lighthouse scores alone.

The project must continuously answer four questions:

1. Does Layer 1 reduce delivery latency for static/public traffic?
2. Does Layer 2 reduce latency or backend load for suitable Worker-owned capabilities?
3. What latency penalty, if any, is introduced when traffic passes through Cloudflare and falls back to Vercel?
4. Do architecture changes improve real user experience and reliability without creating unacceptable tail latency, error rate, or operational complexity?

This benchmark is intended to remain active as the Cloudflare/Vercel boundary evolves. It is not a one-time migration test.

## 2. Canonical Architecture Under Test

The benchmark follows the current hosting source of truth in `hosting-strategy-vercel-cloudflare.md`.

```text
Browser / Shopper / Bot / Agent
        |
        v
Cloudflare authoritative DNS + proxy
        |
        +-----------------------------------+
        |                                   |
        v                                   |
Layer 1 — Cloudflare Static Assets          |
  exact asset hit                           |
  run_worker_first=false                    |
  no Worker invocation                      |
  no Vercel                                 |
        | asset miss / runtime route        |
        v                                   |
Layer 2 — Cloudflare Worker / Capability Router
  Worker-owned HTML / API / lightweight capability
  direct Neon only where explicitly proven
        | VERCEL_REQUIRED / UNKNOWN
        v
Layer 3 — Vercel / Backend
  AI / Stripe / Blob / cron / admin /
  heavy or unverified capability
        |
        v
Neon PostgreSQL where relational data is required
```

The goal is not to make every request execute on Cloudflare. The goal is to use the cheapest and fastest sufficient execution layer while preserving correctness, security, reliability, and rollback.

## 3. Performance Principles

### 3.1 Measure execution paths separately

Never combine Layer 1, Layer 2, and Layer 3 into one latency average when evaluating architecture quality.

A faster Layer 1 can hide a slower Layer 3. A fast median can hide a poor p95/p99. A low server latency can hide a slow end-to-end user journey.

### 3.2 Tail latency matters

For architecture decisions, p95 and p99 are first-class metrics. Average latency is supporting information only.

### 3.3 Correctness precedes speed

A faster route that changes auth, tenant isolation, cache semantics, SEO behavior, write ownership, or response semantics is a regression.

Performance testing does not relax existing parity and production cutover gates.

### 3.4 No production routing changes solely for benchmarking

Benchmark tooling must observe current route ownership. It must not broaden Worker Routes, alter DNS, change cache rules, disable security controls, or move write ownership in order to obtain cleaner numbers.

### 3.5 Benchmark the architecture, then the product journey

First isolate infrastructure latency. Then measure business journeys such as Face Analysis, Advisor, Try-On, Compare, Store, and Campaign.

AI/provider latency can dominate end-to-end timings and must not be confused with hosting-layer latency.

## 4. Required Benchmark Classes

Every architecture performance review should include these four classes where technically available.

| Class | Path | Primary question |
| --- | --- | --- |
| A — Direct Vercel baseline | Client → Vercel origin | What is the backend/origin baseline without Cloudflare proxy/routing? |
| B — Cloudflare → Vercel fallback | Client → Cloudflare → Vercel | What is the fallback/proxy penalty or gain? |
| C — Cloudflare Worker | Client → Cloudflare Worker → optional direct Neon | What do Layer 2 ownership and edge execution change? |
| D — Cloudflare Static Assets | Client → Cloudflare Static Assets | What does Layer 1 save in latency, origin traffic, and execution cost? |

Direct-origin benchmarking must use an explicitly approved origin/bypass hostname or equivalent safe method. Do not weaken production security or expose a new origin route solely for testing.

## 5. Architecture Metrics

### 5.1 Request latency

At minimum record:

- DNS time
- TCP connect time
- TLS negotiation time
- TTFB
- total response time
- HTTP status
- response size

For each metric retain:

- p50
- p75 where useful
- p95
- p99
- min/max for diagnostics only

### 5.2 Routing identity

Where available record:

- `cf-cache-status`
- `x-visutry-router-backend`
- router `layer`
- router `invocation`
- Cloudflare colo / request identifier where available and safe
- tested URL / route class
- benchmark region
- commit / deployment version

Benchmark results are invalid if the actual execution owner cannot be determined with sufficient confidence.

### 5.3 Reliability

Record:

- 2xx rate
- 4xx rate where expected by the test
- 5xx rate
- timeout rate
- connection failure rate
- semantic/parity failure rate

A performance improvement accompanied by higher errors is not an improvement.

### 5.4 Cache behavior

For cacheable paths record where possible:

- HIT / MISS / BYPASS / DYNAMIC
- cold vs warm behavior
- cache hit ratio over representative traffic
- whether Layer 1 asset delivery invoked a Worker

Do not treat a Worker Cache API hit as equivalent to Layer 1 Static Assets. Worker invocation remains Layer 2 execution and consumes Worker request budget.

## 6. Derived Architecture Metrics

Three derived metrics should be reported explicitly.

### 6.1 Vercel fallback penalty

```text
Fallback Penalty = latency(Cloudflare → Vercel) - latency(Direct Vercel)
```

Report at least TTFB p50, p95, and p99.

Interpretation:

- near zero or small positive values are generally acceptable if Cloudflare provides material reliability, security, or routing value;
- large positive values require investigation before expanding traffic through the same path;
- a negative value can occur because of connection reuse, Cloudflare network effects, caching, or measurement placement and must be explained rather than assumed.

### 6.2 Worker gain

```text
Worker Gain = latency(equivalent Vercel capability) - latency(Worker-owned capability)
```

Only compare semantically equivalent work. Do not compare a cached Worker response with an uncached origin computation and call the difference "edge compute gain" without labeling the cache effect.

### 6.3 Static delivery gain

```text
Static Gain = latency(origin/static baseline) - latency(Cloudflare Static Asset)
```

Also record whether Vercel origin traffic was avoided entirely.

## 7. Initial Production Benchmark Set

The initial benchmark should reflect the current P0 production boundary rather than future desired routing.

### Layer 1 / Static Assets

Use representative files from currently active static families, for example:

- `/images/*`
- `/home/*`
- `/experience-heroes/*`
- `/assets/*`
- `/robots.txt`
- `/llms.txt`

Use concrete existing assets in the harness rather than wildcard URLs.

### Layer 2 / Worker-owned P0 APIs

Current initial examples:

- `/api/health`
- `/api/glasses/brands`
- `/api/glasses/categories`
- `/api/glasses/face-shapes`

These routes are useful because their execution identity is already observable and semantic parity has been validated during P0 cutover.

### Layer 3 / Vercel fallback

Representative paths should include a mix of public HTML and backend-owned capabilities, for example:

- `/`
- `/en`
- `/en/face-analysis`
- `/en/try-on`
- `/en/style-explorer`
- `/api/glasses/frames`

The exact set should be versioned in the benchmark harness and updated when route ownership changes.

## 8. Geographic Coverage

Synthetic benchmarks should cover at least:

- US East
- US West
- Europe
- Singapore
- Japan or Hong Kong

Where traffic data justifies it, add regions that represent actual VisuTry users or target merchant markets.

A single developer laptop is not a valid global performance baseline.

## 9. Sampling and Test Shape

Initial guidance:

- at least 100 successful samples per route/region/path class for exploratory runs;
- 300–500 samples for higher-confidence architecture comparisons when practical;
- separate cold and warm/cache-hit runs where applicable;
- keep concurrency low for latency characterization before running load tests;
- use fixed commits/deployments and stable route ownership during comparison windows;
- record the benchmark timestamp because external network and provider conditions vary.

Do not load-test production AI, payment, mutation, or expensive routes without an explicit test plan and cost/safety guardrails.

## 10. Product-Level Performance

Infrastructure benchmarks are necessary but not sufficient.

After architecture-level measurements are stable, monitor end-to-end product timings for the workflows that create user and merchant value.

Initial golden journeys:

1. Public landing / navigation
2. Face Analysis
3. Glasses Advisor
4. Virtual Try-On
5. Frame Compare
6. Store landing / catalog / recommendation path
7. Campaign landing / recommendation / intent path

Recommended end-to-end timers include:

- navigation start → usable page
- action click → request accepted
- action click → first meaningful result
- action click → final usable result
- result ready → rendered/interactable

For AI workflows, break total time into at least:

```text
Client / upload
+ VisuTry request handling
+ AI provider / orchestration
+ persistence / Blob / database
+ polling or delivery
+ client rendering
= end-to-end user time
```

This decomposition is required before attributing an AI workflow regression to Cloudflare, Vercel, Neon, or the model provider.

## 11. Real User Monitoring and Core Web Vitals

Synthetic tests answer controlled architecture questions. RUM answers whether real users benefit.

For public product surfaces, continuously track at minimum:

- LCP
- INP
- CLS
- TTFB where available
- route/navigation timing
- geography/device/network class where privacy-safe
- application error rate

Use p75 for Core Web Vitals reporting and p95/p99 for backend/application latency diagnostics.

When route ownership changes, annotate the deployment/cutover date so pre/post comparisons remain interpretable.

## 12. Performance Budgets and Decision Gates

The project should use performance budgets as regression gates, not as aspirational dashboards.

Until enough production data exists to define route-specific SLOs, use the following decision logic:

### Continue / expand a Cloudflare-owned capability when

- semantic and security parity are intact;
- p50 does not materially regress;
- p95/p99 improve or remain within an explicitly accepted budget;
- error/timeout rates do not regress;
- Layer 1 or Layer 2 meaningfully reduces Vercel execution/origin traffic, cost, or scaling pressure; and
- operational complexity remains justified by the measured benefit.

### Pause expansion and investigate when

- fallback penalty becomes material across important regions;
- p95/p99 regress materially even if averages improve;
- cache behavior is worse than the previous path;
- Worker CPU/request budgets approach operational limits;
- Neon becomes the dominant cross-region bottleneck;
- routing identity is ambiguous;
- errors, auth failures, tenant issues, SEO differences, or write-parity problems appear.

Do not encode a permanent millisecond threshold before sufficient baseline data exists. Establish observed baselines first, then tighten budgets using evidence.

## 13. Release and Architecture Review Policy

Performance must be reviewed for changes that materially affect any of the following:

- Cloudflare Worker Routes or capability classification
- `run_worker_first`
- static asset handling
- caching policy
- middleware / locale routing
- direct-Neon access
- Vercel fallback/origin handling
- Auth/session routing
- Store/Campaign high-frequency read paths
- image delivery
- large client bundles
- AI orchestration or polling behavior
- major dependency/runtime upgrades

A relevant change should include one of:

- benchmark evidence showing no material regression;
- a documented reason why the change is not performance-sensitive; or
- an explicitly accepted temporary regression with owner and follow-up.

## 14. Long-Term Performance Review Cadence

Performance work is continuous.

Recommended cadence:

- **Per relevant release:** regression check for touched paths
- **After each Cloudflare route/capability expansion:** L1/L2/L3 comparison and fallback review
- **Weekly during active migration/scaling periods:** key synthetic and error trends
- **Monthly:** architecture + RUM performance review
- **Quarterly or after major traffic growth:** revisit SLOs, performance budgets, regional coverage, Worker/Vercel/Neon bottlenecks, and cost-performance tradeoffs

Store/Campaign traffic growth is a mandatory review trigger because its request shape can differ materially from the current consumer workload.

## 15. Result Format

Every formal benchmark should produce a compact result table similar to:

| Route | Layer | Region | p50 TTFB | p95 TTFB | p99 TTFB | p95 Total | Error % | Cache / Owner |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| ... | ... | ... | ... | ... | ... | ... | ... | ... |

And a summary containing:

- Direct Vercel baseline
- Cloudflare → Vercel fallback penalty
- Worker gain for equivalent capabilities
- Static delivery gain
- regional outliers
- cache findings
- reliability findings
- decision: `PASS`, `PASS WITH FOLLOW-UP`, or `HOLD`
- recommended next route/capability action

Raw samples should be retained as machine-readable evidence when practical.

## 16. Benchmark Harness Direction

The preferred implementation is a repeatable repository-owned harness rather than ad-hoc curl commands.

The harness should eventually support:

- a versioned route manifest;
- multiple geographic runners;
- configurable sample count and low concurrency;
- timing capture;
- routing/cache header capture;
- semantic response checks;
- p50/p95/p99 aggregation;
- JSON/CSV evidence output;
- human-readable summary output;
- commit/deployment metadata;
- safe exclusion of mutation/payment/AI-heavy routes by default.

The benchmark harness must be read-only by default.

## 17. What Success Looks Like

The hybrid architecture is successful when:

- high-volume static traffic terminates at Layer 1;
- suitable lightweight capabilities terminate at Layer 2;
- heavy capabilities remain reliable on Layer 3;
- Cloudflare → Vercel fallback overhead is small and understood;
- tail latency and error rates are controlled;
- real users see equal or better page/workflow performance;
- Vercel heavyweight execution does not grow linearly with Store/Campaign page views;
- performance gains remain observable as traffic scales; and
- architectural complexity continues to earn its cost through measurable latency, scalability, reliability, or infrastructure-economics benefits.

Performance is therefore not a one-off optimization phase. It is a standing product and architecture discipline for VisuTry.

## Related Documents

- `docs/operations/hosting-strategy-vercel-cloudflare.md`
- `docs/operations/cloudflare-b4-2d-p0-production-cutover.md`
- `docs/operations/cloudflare-production-route-boundary.md`
- `docs/operations/cloudflare-b4-production-cutover-readiness.md`
- `docs/decisions/ADR-010-hybrid-edge-architecture-for-store-campaign-scale.md`
- `docs/decisions/ADR-009-vercel-cloudflare-hosting-optionality.md`
- `docs/engineering/quality-assurance-strategy.md`
- `docs/engineering/e2e-test-plan.md`
