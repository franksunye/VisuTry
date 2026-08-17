# Vercel Quota Emergency Reduction

**Status:** Implemented on `cursor/vercel-quota-quick-wins`  
**Date:** 2026-08-17  
**Baseline:** `origin/main` `72e449038f0737a453e0b9e4e5c373216f70825b`

This change is independent of the concurrent Cloudflare capability-routing work. It does not change DNS, hosting provider, Neon schema, Stripe, or AI behavior.

## Current problem

Vercel Hobby is already at or above hard limits:

| Meter | Observed | Plan |
| --- | --- | --- |
| ISR Reads | ~1.2M / 1M | Hobby |
| Fast Origin Transfer | ~10.42 GB / 10 GB | Hobby |

ISR Reads are billed in 8 KB units when the regional CDN misses and reads the durable ISR cache. Short `revalidate` windows turn crawler and shopper traffic into repeated `stale_time` regenerations. Fast Origin Transfer is driven by middleware invocations, uncached function responses, and ISR regeneration payloads.

## ISR audit

Locales: 9 (`en`, `id`, `ar`, `ru`, `de`, `ja`, `es`, `pt`, `fr`). `PROGRAMMATIC_SEO_ENABLED` is off in this build, matching the default production flag unless explicitly enabled.

| Route | Render mode (before) | Revalidate (before) | Static param count | Likely request volume | Actually needs ISR? | Safe to make static? | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `/[locale]` | force-static | none | 9 | High | No | Yes | Keep static |
| `/[locale]/blog` and posts | force-static | none | 9 × posts/tags | High / crawler | No | Yes | Keep static |
| `/[locale]/face-shape-detector` | force-static | none | 9 | High | No | Yes | Keep static |
| `/[locale]/face-shapes/*` | force-static | none | 7 shapes + 3 comparisons, mostly `en` | High / crawler | No | Yes | Keep static |
| `/[locale]/style/[faceShape]` | force-static | none | 10 slugs × 9 locales = 90 | High / crawler | No | Yes | Keep static |
| `/[locale]/sunglasses-for/[faceShape]` | force-static | none | 7 × 9 | High / crawler | No | Yes | Keep static |
| `/[locale]/glasses-guide/[slug]` | force-static | none | ~30 × 9 | High / crawler | No | Yes | Keep static |
| `/[locale]/brand/[brand]` | ISR | 3600 | 9 curated × 9 locales = 81 | High / crawler | No for curated copy | Yes | **force-static** |
| `/[locale]/category/[category]` | ISR | 3600 | 0 when programmatic SEO off | Medium if enabled | Only if catalog is live programmatic SEO | Yes while flag is off | **force-static** |
| `/[locale]/try/[slug]` | ISR | 3600 | 0 when programmatic SEO off; all active frames × 9 locales if enabled | High multiplier if enabled | Only if catalog is live programmatic SEO | Yes while flag is off | **force-static** |
| `/[locale]/store` hub | force-static | none | 9 | Medium | No | Yes | Keep static |
| `/[locale]/store/[merchantSlug]` | on-demand ISR | 6 hours | 0 at build; unbounded at runtime | Medium, bot-probed | Yes, merchant writes after deploy | No | **7-day ISR + existing on-demand tags** |
| `/[locale]/c/[merchantSlug]/[experienceSlug]` | on-demand ISR | 1 hour | 0 at build; unbounded at runtime | Medium, bot-probed | Yes, campaign writes after deploy | No | **7-day ISR + existing on-demand tags** |
| `/sitemaps/dynamic.xml` | ISR | 24 hours | 1 | Crawler | Weakly; writes already call `revalidatePath` | No | **7-day ISR + existing on-demand path revalidation** |
| `/[locale]/dashboard`, `/payments` | client-gated shells | none | 9 | Authenticated | No for HTML shell | Yes | force-static shell |
| Admin, auth, share, user, APIs | dynamic | n/a | n/a | Session-specific | Yes | No | Leave dynamic |

High-multiplier routes:

- Brand: 81 deploy-time pages. Content is curated TypeScript, not a live catalog. Hourly ISR was pure waste.
- Category / try: empty at build while programmatic SEO is off, but the 3600s segment config still classified the templates as ISR. If the flag is turned on, try-on slugs become `frames × 9 locales` and an hourly clock would dominate ISR Reads.
- Store / Campaign: `dynamicParams=true` plus empty `generateStaticParams()` is on-demand ISR. Admission already bounds negative lookups. Time-based refresh is only a safety net for seed/dev writers that skip `withPublicDiscoveryInvalidation`.

## Middleware audit

Before, the matcher ran on:

1. `/` — locale detection
2. `/admin/:path*` — JWT admin gate
3. Any path without a locale prefix, excluding `api`, `_next`, `_vercel`, `admin`, and dotted files

Locale-prefixed public pages (`/en/blog`, `/es/face-shapes/oval`) were already excluded. That remains.

Still-unnecessary matcher hits before this change:

- `/skills/*` — matcher invoked, then the function returned `next()`
- `/static/*` without a file extension
- Locale-less marketing/SEO URLs (`/blog`, `/store`, `/face-shape-detector`, brand/category/style/try paths) — Edge middleware plus origin hop, even though `next.config.js` can redirect them at the routing layer

Auth/security preserved: `/admin/:path*` still requires an admin JWT. `/` still uses next-intl Accept-Language detection. API and locale-prefixed app routes still skip middleware.

## API cache audit

| Route | User-specific? | Auth? | Change frequency | Before | After |
| --- | --- | --- | --- | --- | --- |
| `GET /api/frames` | No | No | Catalog edits | CDN 300s | CDN 3600s + SWR 1d |
| `GET /api/glasses/brands` | No | No | Catalog edits | uncached origin | CDN 3600s + SWR 1d |
| `GET /api/glasses/categories` | No | No | Catalog edits | uncached origin | CDN 3600s + SWR 1d |
| `GET /api/glasses/face-shapes` | No | No | Catalog edits | uncached origin | CDN 3600s + SWR 1d |
| `GET /api/glasses/frames` | No | No | Catalog edits | uncached, full Prisma include | **same include contract** + CDN 3600s |
| `GET /api/glasses/frames/[id]` | No | No | Catalog edits | uncached, full include | **same include contract** + CDN 3600s |
| `GET /api/store/merchants/[slug]` | No | No | Merchant writes | CDN 300s | unchanged 300s (shopper launcher) |
| Auth, payment, try-on, admin, share, health | Yes or sensitive | Often | Live | no-store / dynamic | unchanged |

`GET /api/frames` is the try-on `FrameSelector` catalog. It is the highest-volume anonymous JSON GET in-repo.

`GET /api/glasses/frames` has no in-repo fetch caller, but it is a public GET listed in programmatic-SEO docs. Pre-merge review restored the original Prisma `include` payload and kept only the CDN cache headers.

Not cached: authenticated merchant/admin APIs, payment, try-on tasks, share records, health timestamps.

## Changes made

1. Convert curated SEO catalog pages (`brand`, `category`, `try`) from hourly ISR to `force-static`.
2. Lengthen Store/Campaign HTML and the dynamic sitemap from 1h/6h/24h ISR to a 7-day safety TTL. Successful public-discovery writes still call `revalidateTag` / `revalidatePath`.
3. Narrow the middleware matcher (exclude `skills`, `static`, `sitemaps`) and add CDN-level redirects from locale-less public URLs to `/en/...`.
4. Add shared `Cache-Control` for anonymous catalog GETs. The glasses-frames JSON include contract is unchanged.
5. Mark remaining content-only marketing landings `force-static` so they cannot regress to dynamic.

## Expected impact

ISR Reads:

- Remove time-based regeneration for brand/category/try. Brand alone is 81 prerendered paths that previously expired every hour.
- Cut Store/Campaign stale regenerations by ~24× (store 6h → 7d) and ~168× (campaign 1h → 7d).
- Recurring ISR Reads from these families should drop by **well over 50%**, assuming crawler/CDN-miss traffic was dominated by hourly `stale_time` rather than unique cold paths.

Fast Origin Transfer:

- `/api/frames` origin hits collapse from a 5-minute to a 1-hour CDN TTL on every try-on page load.
- Previously uncached `/api/glasses/*` GETs stop hitting the origin on repeated crawler/client reads.
- Locale-less marketing/SEO URLs become routing-layer redirects instead of Edge middleware + origin.
- Middleware no longer runs for skills/static/sitemaps even if those URLs are requested without a file extension.

## Risks

- Store/Campaign HTML can stay stale for up to 7 days if a writer bypasses `withPublicDiscoveryInvalidation` (seed scripts and raw SQL). Admin, merchant, and MCP application services already invalidate.
- Public catalog JSON can be up to 1 hour stale after an admin frame edit. Browser cache remains `max-age=0`.
- Locale-less URLs other than `/` now always land on `/en`, matching existing `/blog/:slug` redirects. Accept-Language detection remains only on `/`.

## Rollback

Revert the commit on `cursor/vercel-quota-quick-wins` (or redeploy the previous production SHA). No schema, DNS, or provider change is involved.

## Before / after build evidence

Build: `npm run build:ci` with Node 20.20.2, unreachable loopback `DATABASE_URL` (`127.0.0.1:59999`), `PROGRAMMATIC_SEO_ENABLED` unset. Prisma websocket errors during optional programmatic SEO reads are expected and caught.

### Before (`origin/main` source)

| Metric | Value |
| --- | --- |
| Time-based ISR route templates | 6 (`brand` 3600, `category` 3600, `try` 3600, `store` 21600, `campaign` 3600, `dynamic.xml` 86400) |
| Brand generated paths | 81 curated × ISR 3600 |
| Category / try generated paths | 0 (flag off) but templates still ISR |
| Store / Campaign generated paths | 0 at build; on-demand ISR with 1h/6h clocks |
| Middleware matcher | `/`, `/admin/:path*`, locale-less except `api|_next|_vercel|admin` and dotted files |
| Public catalog GETs without CDN cache | `/api/glasses/brands`, `categories`, `face-shapes`, `frames`, `frames/[id]` |
| `/api/frames` CDN TTL | 300s |

### After (this branch, `.next/prerender-manifest.json`)

| Metric | Value |
| --- | --- |
| Prerendered paths | 1521 |
| Fully static paths (`initialRevalidateSeconds: false`) | 1520 |
| ISR generated paths with a TTL | 1 (`/sitemaps/dynamic.xml` = 604800) |
| Brand paths | 81, all static |
| Category / try paths | 0, templates `fallback: false` (404, not ISR) |
| Store / Campaign templates | on-demand (`fallback: null`), 7-day page `revalidate` |
| Middleware matchers | `/`, `/admin/:path*`, locale-less except `api|_next|_vercel|admin|skills|static|sitemaps` and dotted files |
| Locale-less marketing/SEO | `next.config.js` 308 redirects to `/en/...` before middleware |
| Public catalog GET CDN TTL | 3600s + SWR 86400 (`/api/store/merchants/[slug]` stays 300s) |

Representative prerender checks:

| Path | After |
| --- | --- |
| `/en` | static |
| `/en/blog` | static |
| `/en/face-shape-detector` | static |
| `/en/store` | static |
| `/en/brand/warby-parker` | static |
| `/en/style/round-face` | static |
| `/en/faq` | static |
| `/sitemaps/dynamic.xml` | ISR 604800 |

## Next highest-impact quota action

Measure production `vercel.isr_operation.read_units` and Fast Origin Transfer by `route` after deploy. If ISR Reads remain high, the next lever is Store/Campaign 404 ISR population (confirm whether Vercel bills negative on-demand entries) and/or moving remaining anonymous function traffic off Vercel origin via the existing Cloudflare plan. Do not enable `PROGRAMMATIC_SEO_ENABLED` while on Hobby ISR limits.
