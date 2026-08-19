# OpenNext static-assets cache fix — root cause to fix

**Date:** 2026-08-19  
**Branch:** `fix/opennext-static-assets-incremental-cache`

## Confirmed root cause

`open-next.config.ts` called `defineCloudflareConfig()` with no arguments. `@opennextjs/cloudflare@1.15.1` defaults `incrementalCache` to `"dummy"`. Dummy `get`/`set` throw `IgnorableError('"Dummy" cache does not cache anything')`, OpenNext treats that as a miss, and force-static Glasses Guide HTML is re-rendered on every Worker invocation (`x-nextjs-cache: MISS`) while Direct Vercel serves ISR/CDN HIT.

Prerendered artifacts existed under `.open-next/cache/<buildId>/…` but were not copied into `.open-next/assets/cdn-cgi/_next_cache` for the Static Assets incremental cache reader.

Prior valid benchmark (`2026-08-19T05-40-57-463Z`): Cloudflare-owned Glasses Guide **+41.2% TTFB** vs Direct Vercel; fallback routes **+0.6% EFFECTIVELY NEUTRAL**.

## Selected backend

**Workers Static Assets incremental cache** (`cf-static-assets-incremental-cache`) via existing `ASSETS` binding. Official OpenNext SSG path; read-only; no R2/KV/DO.

**Not used:** `enableCacheInterception: true` (would emit `x-opennext-cache`, not `x-nextjs-cache`).

## Cache configuration

| | Before | After |
| --- | --- | --- |
| `open-next.config.ts` | `defineCloudflareConfig()` → dummy | `incrementalCache: staticAssetsIncrementalCache` |
| Populate step | only on `opennextjs-cloudflare deploy/preview` | also `node scripts/populate-opennext-static-assets-cache.mjs` in `build:cloudflare` |
| Asset path | `.open-next/cache` only | `.open-next/assets/cdn-cgi/_next_cache/<buildId>/…` |
| New Cloudflare resource | — | **NO** (reuses `ASSETS`) |

## Local / preview validation (PASS)

Wrangler dev @ `127.0.0.1:8787` after rebuild + populate:

| Route | Result |
| --- | --- |
| `/en/glasses-guide` | 200, `x-nextjs-cache: HIT` (3/3), `layer2-worker` |
| `/en/glasses-guide/best-rectangle-glasses-for-round-face` | 200, `x-nextjs-cache: HIT` (3/3) |
| `/de/glasses-guide`, `/ar/glasses-guide` | 200, `x-nextjs-cache: HIT` (3/3) |
| `/en/glasses-guide/definitely-invalid-slug` | 404, `x-nextjs-cache: MISS` (not cached as 200) |
| HEAD hub | 200, `x-nextjs-cache: HIT` |
| RSC hub | 200, `content-type: text/x-component`, `x-nextjs-cache: HIT` |

Evidence: `2026-08-19-local-preview-probe.json` (generated during validation run).

## Production deploy attempt

- Deployed `visutry-cf-production` version **`5c6ae712-6226-453b-ad6c-3ac4f2969290`** with `OPEN_NEXT_DEPLOY=true wrangler deploy --env production --keep-vars` (1524 cache asset files uploaded).
- **Competing overwrite:** version **`450d20d4-ff8c-43f6-875b-9413f6e6aa3f`** deployed at `2026-08-19T09:34:09Z` (~4 minutes later), source unknown (likely Workers Builds / another branch).
- Rolled back to **`6a2bc557-7bf0-474a-95f3-50ef96229de1`** (last known P0-F1 good) after post-deploy probes showed www serving **Vercel** (`server: Vercel`, no `x-visutry-router-*`) and `workers.dev` unreachable from this environment.
- **Worker Routes were not changed** by this fix branch; www losing Cloudflare ownership requires separate route/DNS investigation before re-promoting the cache-fix artifact.

## Performance after fix

**INCONCLUSIVE** for Hybrid www vs Direct Vercel: production route ownership regressed during the deploy window; post-rollback www Glasses Guide is Vercel-served, so the prior +41.2% Cloudflare MISS sample is not comparable until P0-F1 routes are confirmed live again and version **`5c6ae712`** (or a rebuild from this branch) is promoted without overwrite.

## Remaining risks

1. **Competing Worker deployments** can overwrite `visutry-cf-production` within minutes (observed `450d20d4` after `5c6ae712`).
2. Full-site cache populate adds **1524** static asset files (~178MB) per deploy; within Workers Free 20k/file limits but increases upload time.
3. Read-only static cache: invalid slugs correctly stay 404/MISS; ISR revalidation still requires R2/queue (out of P0-F1 scope).
4. Re-promotion requires confirming 12 P0 + 18 glasses-guide + `/_next/static/*` routes unchanged.
