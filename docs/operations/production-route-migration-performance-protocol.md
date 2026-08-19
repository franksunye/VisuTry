# Production Route Migration Performance Protocol

**Status:** Active / Canonical migration-observation protocol  
**Date:** 2026-08-19  
**Owner:** Product / Engineering  
**Applies to:** production Cloudflare route-family cutovers, Cloudflare/OpenNext ownership expansion, Vercel fallback/offload analysis, and related performance decisions

## 1. Purpose

This document extends `hybrid-performance-benchmark.md` with a production-cutover methodology.

The hybrid benchmark remains the source of truth for L1/L2/L3 latency, routing identity, RUM, tail latency, and product-journey measurement. This protocol adds the missing question created by real production migration:

> When a route family moves from Vercel to Cloudflare/OpenNext, does the migration improve user performance and/or structurally reduce Vercel infrastructure load without creating Cloudflare reliability or resource regressions?

A route migration is therefore not evaluated only as a synthetic latency comparison. It is a controlled production experiment with three independent outcome dimensions:

1. **User Performance** — whether real or synthetic user-facing latency remains equal or improves.
2. **Infrastructure Offload** — whether Vercel origin/execution load declines as expected and Cloudflare absorbs the intended traffic shape.
3. **Reliability / Correctness** — whether errors, CPU pressure, cache behavior, SEO semantics, routing ownership, and rollback posture remain healthy.

The project must retain evidence by route family so future Cloudflare ownership decisions are based on measured traffic/cost/latency ROI rather than intuition.

## 2. Relationship to the Hybrid Benchmark

Use the two documents together:

- `hybrid-performance-benchmark.md` — architecture-wide L1/L2/L3 benchmark, fallback penalty, Worker gain, Static gain, RUM, golden journeys, and long-term performance discipline.
- `production-route-migration-performance-protocol.md` — pre/post production cutover observation, route-family attribution, checkpoint cadence, and migration gates.

Synthetic benchmark results are diagnostic evidence. Production cutover observations are the primary evidence for whether a route-family migration actually reduced infrastructure load and remained healthy under real traffic.

## 3. Production Experiment Model

For every meaningful route-family cutover, define:

```text
Pre-cutover baseline window
        ↓
Production cutover at T0
        ↓
12h checkpoint
        ↓
24h checkpoint
        ↓
72h checkpoint
        ↓
7d checkpoint / durable baseline
```

During this observation window, keep production route ownership stable unless rollback is required for correctness or reliability.

Do not expand the next route family merely because the current family is functionally correct. The current family must first produce enough evidence to determine whether the architecture effect is healthy and understandable.

## 4. P0-F1 — First Formal Production Case

The first route-family experiment under this protocol is **P0-F1: Glasses Guide**.

Production cutover reference:

- PR: `#110` — `Migrate Glasses Guide traffic from Vercel to Cloudflare OpenNext`
- Production cutover time: `2026-08-19T02:44:26Z`
- Scope: all 9 locale Glasses Guide hubs and detail pages (`/{locale}/glasses-guide` and `/{locale}/glasses-guide/*`)
- Execution target: `visutry-cf-production` / OpenNext
- Existing stable Cloudflare P0 routes: unchanged
- Other route families and heavy backend capabilities: unchanged

P0-F1 is large enough to be evaluated independently before any P0-F2 route-family expansion.

### 4.1 P0-F1 observation rule

Until the 12h/24h observation is reviewed:

- do not broaden production route ownership;
- do not combine the P0-F1 result with a second route-family migration;
- do not infer success only from functional smoke tests;
- do not roll back solely because Vercel usage does not fall, if correctness/reliability/performance remain healthy.

If Vercel usage does not materially decline, the correct initial interpretation is that Glasses Guide may not be a dominant Vercel resource consumer. That result is useful attribution evidence and is not automatically a migration failure.

## 5. Three Required Outcome Dimensions

### 5.1 User Performance

For the migrated family, record where available:

- TTFB p50 / p75 / p95 / p99
- total response latency p50 / p95
- LCP p75
- INP p75 where meaningful
- CLS
- cache HIT/MISS behavior
- geographic differences
- navigation / RSC behavior where relevant
- application error rate

Synthetic measurements should remain route-owner aware. RUM should be preferred for durable user-experience conclusions.

### 5.2 Infrastructure Offload

For every route-family cutover, observe the infrastructure meters that the migration is expected to change.

For the current Vercel/Cloudflare architecture, this should include where available:

**Vercel**

- ISR Reads
- Fast Origin Transfer
- Function invocations / execution where relevant
- CPU / compute usage where relevant
- cache/origin metrics that materially explain the route family

**Cloudflare**

- Worker requests
- Worker CPU / execution time
- Worker errors / exceptions
- Static Asset delivery where observable
- cache behavior
- request quota/budget trajectory

The objective is not merely to move requests between providers. The objective is to verify that high-frequency traffic stops at the cheapest sufficient layer and that Vercel heavyweight execution/origin use does not continue to scale linearly with migrated page views.

### 5.3 Reliability / Correctness

A production migration must remain semantically correct. Check at least:

- 2xx / expected 4xx behavior
- 5xx rate
- timeout/connection failure rate
- Worker exception rate
- canonical URL correctness
- locale behavior
- RTL behavior where applicable
- RSC/navigation behavior
- hashed asset compatibility
- cache semantics
- route-owner identity
- unchanged fallback behavior for non-migrated families
- rollback readiness

Performance or cost improvements do not compensate for semantic, SEO, auth, tenant, or routing regressions.

## 6. Route-Family Attribution

Every production migration should maintain a route-family attribution record.

Recommended format:

| Route family | T0 | Traffic moved | Δ ISR Reads | Δ Origin Transfer | Δ Worker Requests | Δ Worker CPU | Δ TTFB p95 | Error Δ | Decision |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Glasses Guide (P0-F1) | 2026-08-19T02:44:26Z | TBD | TBD | TBD | TBD | TBD | TBD | TBD | OBSERVING |
| P0-F2 family | TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | NOT STARTED |

This table is intended to evolve into a route-family cost/performance map.

The project should eventually be able to answer questions such as:

```text
Glasses Guide → measurable Vercel offload and latency effect
Style → measurable Vercel offload and latency effect
Sunglasses-for → measurable Vercel offload and latency effect
Face-shapes → measurable Vercel offload and latency effect
Hairstyles-for → measurable Vercel offload and latency effect
Blog → measurable Vercel offload and latency effect
```

This attribution is more useful than a single aggregate statement such as "Cloudflare reduced Vercel usage" because it identifies which traffic families actually justify migration effort.

## 7. Observation Checkpoints

### 7.1 12-hour checkpoint — early health signal

Purpose:

- detect obvious resource or error regressions;
- detect a strong step-function change in Vercel meters;
- verify Cloudflare Worker health after sustained real traffic;
- decide whether the experiment remains safe to continue.

For P0-F1, capture after `2026-08-19T14:44:26Z`:

- Vercel ISR Reads
- Vercel Fast Origin Transfer
- Cloudflare Worker requests
- Cloudflare Worker CPU / execution time where available
- Cloudflare Worker errors/exceptions
- representative Glasses Guide latency / RUM

A clear early Vercel decline is useful, but the 12h checkpoint is not the durable baseline.

### 7.2 24-hour checkpoint — initial architectural decision

Purpose:

- compare a full-day post-cutover window with an appropriate pre-cutover baseline;
- confirm whether the resource shift is structural rather than a short transient;
- verify no daily-cycle reliability regression.

For P0-F1, capture after `2026-08-20T02:44:26Z`.

At this point the team may begin planning P0-F2 if the production migration is healthy, but route expansion should still account for whether the observed result is sufficiently understood.

### 7.3 72-hour checkpoint — trend confirmation

Purpose:

- reduce sensitivity to hourly/day-part noise;
- confirm sustained route ownership and cache behavior;
- identify regional or traffic-mix regressions missed in the first day;
- validate that Cloudflare resource consumption remains bounded.

### 7.4 7-day checkpoint — durable baseline

Purpose:

- capture weekday/daypart variation;
- establish a reusable post-migration baseline;
- provide the preferred evidence for long-term route-family ROI;
- inform tighter performance budgets/SLOs.

For SEO/public-content families, the 7-day view is generally more trustworthy than a 12h or 24h snapshot because organic traffic varies materially by hour and day.

## 8. Baseline Selection

Do not compare post-cutover totals against an arbitrary prior period.

Prefer, in order:

1. same route family / comparable traffic volume from the immediately preceding stable period;
2. same weekday/daypart where weekly traffic cycles are significant;
3. normalized metrics such as resource usage per 1,000 page views when traffic volume changed materially;
4. longer windows when route traffic is sparse.

Always annotate major confounders such as:

- deploys affecting the same route family;
- crawler/bot spikes;
- Search traffic changes;
- cache invalidation/rebuild events;
- Vercel/Cloudflare incidents;
- major content publication batches;
- instrumentation changes.

A lower Vercel total caused by lower traffic is not infrastructure offload.

## 9. Synthetic Benchmarks After Production Cutover

The Direct Vercel vs Hybrid benchmark remains required, but its role is diagnostic.

Continue to calculate when technically safe and semantically comparable:

- `Fallback Penalty`
- `Worker Gain`
- `Static Gain`

Use synthetic tests to explain a production observation, not to override production evidence.

Examples:

- Vercel usage fell but TTFB worsened → investigate execution path, cache behavior, or geographic edge effects.
- Worker latency improved but Vercel usage did not fall → the migrated family may be low-volume or Vercel resource usage may be dominated elsewhere.
- Vercel usage fell and RUM improved → strong evidence that ownership migration is beneficial.

## 10. Migration Gate

A next route-family expansion should normally require the previous family to pass the following gate.

### Required

- 12h observation completed and healthy
- 24h observation completed and healthy
- no material correctness/SEO regression
- no material error/timeout regression
- no unexplained material p95/p99 latency regression
- Cloudflare CPU/request budget remains acceptable
- route ownership is unambiguous
- rollback remains practical

### Infrastructure-offload interpretation

**Expected offload observed:** migration receives stronger evidence for continued expansion.

**No material offload observed, but route is healthy:** do not automatically roll back. Record the family as low-impact or inconclusive and choose the next family using traffic/resource attribution.

**Cloudflare resource cost/regression exceeds benefit:** HOLD expansion and investigate before the next family.

### Decision labels

Use one of:

- `PASS — EXPAND CANDIDATE`
- `PASS — LOW OFFLOAD / KEEP`
- `PASS WITH FOLLOW-UP`
- `HOLD`
- `ROLLBACK`

## 11. P0-F2 Planning Rule

Candidate P0-F2 families currently include:

- `style`
- `sunglasses-for`
- `face-shapes`
- `hairstyles-for`
- `blog`

These are candidates, not a pre-approved batch.

Do not activate all candidates simultaneously merely because P0-F1 passes.

Prefer selecting the next family using:

1. measured or estimated Vercel resource contribution;
2. traffic volume;
3. static/read-heavy suitability;
4. expected user-latency benefit;
5. Cloudflare Worker/static execution cost;
6. SEO/canonical complexity;
7. rollback simplicity.

Where possible, continue migrating by route family so each change produces attributable evidence.

## 12. Evidence Record

Each route-family migration should have machine-readable or screenshot evidence sufficient to reconstruct the decision.

Minimum record:

```text
Migration ID / route family
T0 UTC
Commit / PR / Worker deployment
Exact production route scope
Pre-cutover window
12h metrics
24h metrics
72h metrics
7d metrics
Vercel resource deltas
Cloudflare resource deltas
User-performance deltas
Reliability findings
Known confounders
Decision
Next action
```

Screenshots from provider dashboards are acceptable when APIs do not expose the required data, but record exact time ranges and timezone.

## 13. Result Template

```text
Migration: P0-Fx — <route family>
T0: <UTC timestamp>
Observation: 12h | 24h | 72h | 7d

USER PERFORMANCE
TTFB p50: before → after
TTFB p95: before → after
LCP p75: before → after
Error rate: before → after

VERCEL OFFLOAD
ISR Reads: before → after
Fast Origin Transfer: before → after
Function/CPU: before → after (where relevant)

CLOUDFLARE HEALTH
Worker requests: value / trend
Worker CPU: value / trend
Worker errors: value / trend
Cache/Static Assets: finding

CORRECTNESS
Canonical/locale/RSC/assets/fallback: PASS | FAIL

CONFOUNDERS
<traffic/deploy/cache/provider notes>

DECISION
PASS — EXPAND CANDIDATE | PASS — LOW OFFLOAD / KEEP | PASS WITH FOLLOW-UP | HOLD | ROLLBACK

NEXT ACTION
<one explicit action>
```

## 14. Long-Term Use

This protocol should be used whenever a material public route family or high-frequency capability moves between Vercel and Cloudflare ownership.

Over time, route-family observations should inform:

- architecture ownership boundaries;
- Cloudflare vs Vercel cost planning;
- Worker request/CPU budgets;
- SEO/public-page hosting decisions;
- Store/Campaign scaling decisions;
- regional performance budgets;
- route-specific SLOs;
- future provider migrations.

The intent is to create a compounding operational asset: every migration should make the next architecture decision better informed.

Performance remains a standing product and architecture discipline, not a one-time optimization phase.

## Related Documents

- `docs/operations/hybrid-performance-benchmark.md`
- `docs/operations/hosting-strategy-vercel-cloudflare.md`
- `docs/operations/cloudflare-b4-2d-p0-production-cutover.md`
- `docs/operations/cloudflare-production-route-boundary.md`
- `docs/operations/cloudflare-b4-production-cutover-readiness.md`
- `docs/decisions/ADR-010-hybrid-edge-architecture-for-store-campaign-scale.md`
- PR `#110` — P0-F1 Glasses Guide production migration
