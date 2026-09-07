# Vercel Pro Cost Baseline and Cost-Control Hardening

Audit date: 2026-09-07 (Asia/Shanghai)

## Scope

This document records the read-only Vercel Pro cost baseline and the focused
P0 build-cost containment change. It does not authorize or record any P1
architecture, database, product, payment, or add-on work.

## Baseline

- Starting `main` / `origin/main` SHA: `5aa40f9f56bd53d14d5a1b963b463dd2e2e7df91`.
- Working branch: `codex/vercel-pro-cost-control`.
- Implementation SHA: `63584151c1dc2a6d637a7660d42753a2ed36ba8f`.
- Vercel project: `sunye/visutry` (`prj_ELrMOSDgFVyKLsamNRSHq8R7UuxE`).
- Billing cycle shown by Vercel: September 6, 2026 15:00 – October 6, 2026 15:00.
- Included credit shown: `$1.30 / $20.00`.
- Upcoming invoice shown: `$20.00` including seats, add-ons, and on-demand usage.
- The Vercel CLI usage and daily-breakdown endpoints returned `404 Costs not
  found`; the figures below are from the authenticated Vercel dashboard.

The dashboard did not permit a pre-cycle seven-day range and its custom date
picker is date-granular rather than a rolling 24-hour query. Therefore an
exact last-24-hour and last-seven-day cost is recorded as unavailable rather
than inferred. The currently available Sep 6–7 dashboard view showed the same
cycle totals below; usage data may be up to one hour old.

## Current-cycle cost breakdown

| Resource | Usage | Charge |
| --- | ---: | ---: |
| Deployment Storage | 6 GB-months | $0.63 |
| Build CPU Minutes | 2 hours | $0.41 |
| Function Storage | 2 GB-months | $0.18 |
| Fluid Active CPU | 7 minutes | $0.02 |
| Fast Origin Transfer | 215 MB | $0.01 |
| ISR Reads | 18.52K | $0.01 |
| Edge Requests – Additional CPU Duration | 22.67 seconds | $0.00 |
| Edge Requests | 39.33K / 10M | $0.00 |
| Fast Data Transfer | 577 MB / 1 TB | $0.00 |
| Fluid Provisioned Memory | 0.41 GB-hours | $0.00 |
| Function Invocations | 5.05K | $0.00 |
| Image Optimization Transformation | 65 | $0.00 |
| ISR Writes | 651 | $0.00 |
| Image Optimization Cache Reads | 5.06K | $0.00 |
| Image Optimization Cache Writes | 163 | $0.00 |
| Infrastructure subtotal | — | **$1.27** |

Top three observed cost drivers are Deployment Storage, Build CPU Minutes,
and Function Storage. A reliable monthly burn projection is intentionally
not stated: the observed cycle is less than one day old and the dashboard did
not expose the requested rolling windows.

## Before / after controls

| Control | Observed state | Final state |
| --- | --- | --- |
| Spend Management | Disabled | Enabled, `$5` on-demand budget |
| Spend alerts | Off; no thresholds configured | Web and email enabled at 50%, 75%, and 100% |
| Pause production deployments | Off | Off |
| Build Machine | Basic (2 vCPUs, 8 GB) | Unchanged; no evidence justified an upgrade |
| On-Demand Concurrent Builds | Disabled | Unchanged / disabled |
| Prioritize Production Builds | Enabled | Unchanged / enabled |
| Fluid Compute | Enabled | Unchanged / enabled |
| Function CPU | Standard (1 vCPU, 2 GB) | Unchanged / Standard |
| Function region | iad1 | Unchanged; no evidence justified a region change |
| Paid add-ons | No new add-on enabled | No paid add-on enabled |

## Containment design

`scripts/vercel-ignore-build.sh` now exits `0` immediately when
`VERCEL_ENV` is anything other than `production`. This skips non-production
full builds, while production retains the existing fail-safe behavior:
runtime changes exit `1` and docs-only changes exit `0`. The Vercel project
continues to use this script through `vercel.json`'s `ignoreCommand`.

The focused shell contract test
`scripts/test-vercel-ignore-build.sh` proves preview runtime changes skip,
production runtime changes build, and production docs-only changes skip.

## Savings and risk

No savings amount is claimed before deployment because the counterfactual
number of preview builds is not available in the dashboard snapshot. The
expected saving is avoidance of full Vercel Preview builds; production builds
remain protected by the existing fail-safe path. The principal tradeoff is
that preview deployments will not be built by this project-level ignored-build
policy, so production remains the authoritative deployment environment.

## Deferred / out of scope

- No automatic production pause was configured.
- No deployment, domain, environment variable, secret, DNS, payment method,
  or add-on was changed.
- No image, Blob, cache, middleware, auth, database, or product architecture
  change was made.
- No Axiom P0/P0.2 semantics were changed.
- No P1 work was started.

## Evidence timestamp

Dashboard evidence was collected on 2026-09-07. The focused PR is created
as PR #193; no merge is performed by this workstream. The branch head is
`43b158cee5a9e2c206bf126de6db542eaa0ade4a`.

Local validation passed for the focused ignored-build contract, typecheck,
lint, the complete unit suite (242 suites / 1,500 tests), Consumer critical,
revenue-critical, `build:ci`, `docs:audit`, `docs:audit:strict`, and
`git diff --check`. The Vercel Preview deployment for the branch was
`Canceled by Ignored Build Step`, confirming the non-production containment.
At the time of closeout, GitHub's unrelated repository quality jobs were
still pending; no claim of CI completion is made here.
