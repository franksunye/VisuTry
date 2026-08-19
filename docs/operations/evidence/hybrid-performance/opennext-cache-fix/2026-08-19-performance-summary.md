# OpenNext cache fix — production validation summary

**Date:** 2026-08-19  
**Main merge:** `a5dee4919617a4f3cffb8547266fccd46434e337` (PR #115)  
**Production Worker version:** `b3ecf2b2`

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

## After (production post-merge)

| Check | Result |
| --- | --- |
| Production ownership (hub/detail) | **CLOUDFLARE** (`x-visutry-router-backend: cloudflare`, `layer2-worker`) |
| Production cache (hub/detail ×3) | **HIT / HIT / HIT** (was permanent MISS) |
| Worker CPU time (24h dashboard) | **−85.4%** after deploy |
| Hybrid vs Direct Vercel TTFB delta | **INCONCLUSIVE** — `visutry.vercel.app` timed out from validation environment; rerun `npm run perf:hybrid-sample` from a network with Direct Vercel access |

## 41.2% gap

**PARTIALLY validated:** cache symmetry restored (Hybrid HIT matches Vercel ISR/CDN class). Full TTFB delta re-measurement blocked on Direct Vercel reachability; expect gap collapse toward fallback (+0.6% EFFECTIVELY NEUTRAL) once comparable sample runs cleanly.

## Remaining follow-up

1. Rerun `npm run perf:hybrid-sample` from environment with Direct Vercel baseline access.
2. Expand bounded parity harness to full 9-locale × detail matrix when P0-F1 route manifest helpers land on `main` (currently 11-check bounded script).
