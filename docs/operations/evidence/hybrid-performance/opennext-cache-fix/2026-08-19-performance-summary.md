# OpenNext cache fix — closed validation summary

**Date:** 2026-08-19  
**Main merge:** `a5dee4919617a4f3cffb8547266fccd46434e337` (PR #115)  
**Production Worker version:** `b3ecf2b2`  
**Status:** **CLOSED — PASS**

## Root cause (confirmed)

OpenNext `defineCloudflareConfig()` with no `incrementalCache` defaulted to **dummy**, causing permanent `x-nextjs-cache: MISS` and full HTML re-render on every Cloudflare Worker invocation for force-static Glasses Guide pages.

## Fix (deployed)

- `staticAssetsIncrementalCache` from `@opennextjs/cloudflare` wired in `open-next.config.ts`
- Reuses existing `ASSETS` binding — **no new Cloudflare resource**
- `build:cloudflare` populates `.open-next/cache` → `.open-next/assets/cdn-cgi/_next_cache`
- Cache interception remains off (real `x-nextjs-cache` semantics preserved)
- Deployed via GitHub `main` → Workers Builds automatic pipeline

## Before (valid baseline `2026-08-19T05-40-57-463Z`)

| Class | Median TTFB delta (Hybrid − Vercel) | Cache | Result |
| --- | ---: | --- | --- |
| Fallback (`/`, `/en`) | +0.6% | n/a | EFFECTIVELY NEUTRAL |
| Cloudflare-owned Glasses Guide | **+41.2%** | Hybrid `MISS`; Vercel `HIT` | **HYBRID SLOWER** |

## After (post-fix re-measurement `2026-08-19T10-59-10-330Z`)

Same harness: warm-up 2, measured 8, runs 3, concurrency 1, Hybrid / Direct Vercel alternating.

| Class | Median TTFB delta (Hybrid − Vercel) | Run consistency | Result |
| --- | ---: | --- | --- |
| Fallback (`/`, `/en`) | **+0.5%** | outlier in one run; median neutral | EFFECTIVELY NEUTRAL |
| Cloudflare-owned Glasses Guide | **+1.2%** | consistent | EFFECTIVELY NEUTRAL |

**OVERALL:** EFFECTIVELY NEUTRAL (small local sample)

| Run | Class | Hybrid TTFB p50 | Vercel TTFB p50 | Delta % | Result |
| --- | --- | ---: | ---: | ---: | --- |
| 1 | fallback | 1303 | 1297 | +0.5% | EFFECTIVELY NEUTRAL |
| 1 | glasses-guide | 1087.5 | 1088.5 | −0.1% | EFFECTIVELY NEUTRAL |
| 2 | fallback | 1306 | 1207 | +8.2% | HYBRID SLOWER |
| 2 | glasses-guide | 1122 | 1098.5 | +2.1% | EFFECTIVELY NEUTRAL |
| 3 | fallback | 1281.5 | 1292 | −0.8% | EFFECTIVELY NEUTRAL |
| 3 | glasses-guide | 1095.5 | 1082.5 | +1.2% | EFFECTIVELY NEUTRAL |

Evidence:

- `docs/operations/evidence/hybrid-performance/2026-08-19T10-59-10-330Z-raw-samples.json`
- `docs/operations/evidence/hybrid-performance/2026-08-19T10-59-10-330Z-aggregate.json`
- `docs/operations/evidence/hybrid-performance/2026-08-19T10-59-10-330Z-summary.md`

## Production corroboration

| Check | Result |
| --- | --- |
| Production ownership (hub/detail) | **CLOUDFLARE** (`layer2-worker`) |
| Production cache (hub/detail ×3) | **HIT / HIT / HIT** (was permanent MISS) |
| Worker CPU time (24h dashboard) | **−85.4%** after deploy |

## 41.2% gap

**ELIMINATED.** Pre-fix +41.2% reflected dummy-cache MISS vs Vercel HIT asymmetry. Post-fix Glasses Guide median **+1.2%** — within ±5% EFFECTIVELY NEUTRAL band.

## Follow-up (non-blocking)

- Monitor occasional Hybrid hub TTFB tail spikes (p95 ~1.7–1.8s in run 1–2); no second optimization pass unless sustained >10% material delta reappears.
- Do **not** start P0-F2 based on this workstream.
