# OpenNext cache fix — performance summary

**Date:** 2026-08-19  
**Branch:** `fix/opennext-static-assets-incremental-cache`

## Before (prior valid sample)

Source: `docs/operations/evidence/hybrid-performance/2026-08-19T05-40-57-463Z-summary.md`

| Class | Median TTFB delta (Hybrid − Vercel) | Cache | Result |
| --- | ---: | --- | --- |
| Fallback (`/`, `/en`) | +0.6% | n/a | EFFECTIVELY NEUTRAL |
| Cloudflare-owned Glasses Guide | **+41.2%** | Hybrid `x-nextjs-cache: MISS`; Vercel `x-vercel-cache: HIT` | **HYBRID SLOWER** |

## After (this fix)

| Environment | Status |
| --- | --- |
| Local Wrangler preview | Cache symmetry restored: valid routes `x-nextjs-cache: HIT` on every request |
| Production www | **INCONCLUSIVE** — deploy window saw competing Worker overwrite (`450d20d4` @ 09:34Z); post-rollback www Glasses Guide served from **Vercel** (`server: Vercel`), not Layer 2 Cloudflare |

Hybrid vs Direct Vercel post-fix median: **not measured** (production route ownership regressed during validation; rerun `npm run perf:hybrid-sample` only after P0-F1 routes and cache-fix Worker version are confirmed live).

## Expected outcome once re-promoted

When `visutry-cf-production` serves Glasses Guide from OpenNext with populated static-assets cache (as validated locally), the +41.2% MISS-vs-HIT penalty should collapse toward the fallback class (+0.6% EFFECTIVELY NEUTRAL), assuming no new edge asymmetry.
