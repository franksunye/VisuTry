# Vercel ISR edge telemetry (P0-E2A / P0-E2B)

**Status:** code ready, **not deployed**
**Date:** 2026-08-18
**Branches:** `codex/isr-edge-telemetry` (helpers) → `codex/isr-production-pass-through-telemetry` (production visibility)
**Purpose:** observe which Vercel GET/HEAD requests correspond to prerender cold reads, without Vercel Pro logs.

This is observability only. It does not change application backend, Cache-Control, Cloudflare Cache Rules, cookies, redirects, sitemaps, or Next rendering.

## Production architecture

```text
Internet
  → Cloudflare DNS (www PROXIED)
    → matched ungated P0 static/API → visutry-cf-production (OpenNext)   [unchanged]
    → matched ISR pass-through SEO routes → visutry-isr-passthrough
         → fetch https://visutry.vercel.app{path}{search}   [cache: no-store]
         → write Analytics Engine (if ISR_TELEMETRY_ENABLED)
         → return Vercel status/body/headers
    → unmatched → Vercel origin (same as today)
```

**Forbidden path:** Internet → Worker → `visutry-cf-production` / OpenNext. This Worker has no OpenNext import, no service binding, and rejects `*.workers.dev` / `www.visutry.com` as `VERCEL_ORIGIN`.

Do not add diagnostic `x-visutry-router-*` headers on this Worker. They are not required for telemetry and must not become a client-visible cache/SEO difference.

Upstream `fetch` uses `cache: 'no-store'` so the Worker hop does not introduce a Cloudflare HTML cache in front of Vercel ISR. Do not set `cf.cacheTtl`, `cacheEverything`, or `caches.default`.

## Stable Vercel origin

**STABLE_VERCEL_ORIGIN:** `https://visutry.vercel.app`

Evidence (2026-08-18, not a one-off deployment URL):

| Check | Result |
| --- | --- |
| Vercel project domains | `www.visutry.com`, `visutry.com`, `visutry.vercel.app`, `visutry-sunye.vercel.app`, `visutry-git-main-sunye.vercel.app` |
| Repo production fallback | `wrangler.jsonc` production `VERCEL_ORIGIN`, `productionFallbackOrigin()` |
| `server` on `visutry.vercel.app` | `Vercel` (not Cloudflare www) |
| Canonical HTML | `https://www.visutry.com/...` on both www and visutry.vercel.app |
| glasses-guide HTML / RSC / 404 / 308 | same application semantics (`status`, `content-type`, `location`, `cache-control`, `vary`, `x-matched-path`) |

`visutry-git-main-sunye.vercel.app` is also a stable git alias. Production pass-through uses **`visutry.vercel.app`** because that is the documented production fallback and is already outside the `visutry.com` zone (no Worker recursion).

Do not use `dpl_*` / `visutry-<hash>-sunye.vercel.app` deployment URLs. They change every deploy.

If this alias is ever removed from the Vercel project: **STOP** and mark `STABLE_VERCEL_ORIGIN_REQUIRED`. Do not substitute a random deployment URL.

## Production router coverage

**PRODUCTION_ROUTER_COVERAGE: PARTIAL** until Stage 1 Worker Routes are attached (this PR does not attach them).

**PRODUCTION CONFIG VERIFICATION REQUIRED** for whether the 12 P0 Worker Routes are still exactly those listed in `docs/operations/cloudflare-b4-2d-p0-production-cutover.md`.

Repo-documented production path today (B4.2D P0, before pass-through attach):

```text
Browser → Cloudflare DNS → www PROXIED →
  matched ungated P0 static prefix/exact → Static Assets (Worker not invoked)
  matched ungated P0 API exact → visutry-cf-production (app-host-worker.ts)
  unmatched → Vercel origin
```

Locale SEO HTML does **not** currently enter `cloudflare-router/worker.ts` or `visutry-cf-production`. After Stage 1 attach it enters **`visutry-isr-passthrough` only**, then Vercel.

Attaching P2 HTML routes to `visutry-cf-production` would be a **backend change** (OpenNext). Do not do that.

## P0-E2B Stage 1 Cloudflare Worker Routes

Worker: **`visutry-isr-passthrough`**
Config: `cloudflare-router/isr-passthrough.wrangler.jsonc`
Wrangler must **not** list these routes (`routes` / `custom_domain` absent). Attach via the Routes API after an explicit deploy.

Stage 1 (glasses-guide only; 9 locales × exact + prefix = 18 routes). `request_limit_fail_open: true`.

```text
www.visutry.com/{en,id,ar,ru,de,ja,es,pt,fr}/glasses-guide
www.visutry.com/{en,id,ar,ru,de,ja,es,pt,fr}/glasses-guide/*
```

Exact + `/*` is intentional. Do **not** use `glasses-guide*` (greedy: would also match `glasses-guidebook`). Do **not** use `www.visutry.com/*` or `/{locale}/*`.

Cloudflare routes are method-agnostic. The Worker still fetches Vercel for POST if a route matches, but telemetry is GET/HEAD only.

Stage 2 (only after one spike window of Stage 1 data):

```text
www.visutry.com/{locale}/style/*
www.visutry.com/{locale}/blog
www.visutry.com/{locale}/blog/*
www.visutry.com/{locale}/sunglasses-for/*
www.visutry.com/{locale}/face-shapes/*
www.visutry.com/{locale}/hairstyles-for/*
```

Set `ISR_PASSTHROUGH_STAGE=2` before attaching Stage 2 routes so telemetry classification matches the attached set.

Never attach: `/api/*`, `/admin/*`, `/dashboard/*`, `/merchant/*`, `/auth/*`, `/store/*`, `/c/*`, payment, upload, try-on APIs.

## Bindings

| Worker wrangler | Env | Binding | Dataset | Enabled by default |
| --- | --- | --- | --- | --- |
| `cloudflare-router/wrangler.jsonc` | staging | `ISR_TELEMETRY` | `visutry_isr_telemetry_staging` | **false** |
| `wrangler.jsonc` | staging | `ISR_TELEMETRY` | `visutry_isr_telemetry_staging` | **false** |
| `wrangler.jsonc` | production | `ISR_TELEMETRY` | `visutry_isr_telemetry_production` | **false** |
| `cloudflare-router/isr-passthrough.wrangler.jsonc` | staging | `ISR_TELEMETRY` | `visutry_isr_telemetry_staging` | **false** |
| `cloudflare-router/isr-passthrough.wrangler.jsonc` | production | `ISR_TELEMETRY` | `visutry_isr_telemetry_production` | **false** |

No production capability-router env was added. Pass-through wrangler has **no** `routes`. Datasets are created on first write after deploy; this PR does not deploy.

Kill switch:

```text
ISR_TELEMETRY_ENABLED=false
```

Sampling (only used when enabled):

| Var | Default | Applies to |
| --- | --- | --- |
| `ISR_HTML_TELEMETRY_SAMPLE_RATE` | `1` | `HTML_DOCUMENT`, `RSC`, `NEXT_PREFETCH` |
| `ISR_TELEMETRY_SAMPLE_RATE` | `0.05` | API, images, static, other |

Sampling key is `METHOD:pathname:requestKind` (FNV-1a). Deterministic.

## What is recorded

Written only for **GET/HEAD** that the router already selected as **Vercel**. After the upstream response is received. `writeDataPoint` is not awaited. Throw → ignored. Response status/body/headers (except the existing router debug headers) are unchanged.

Index: `routeFamily`

Blobs (blob1…blob14):

1. pathname (no query, max 256)
2. method
3. routeClass
4. normalizedBotCategory
5. userAgentFamily
6. cfColo
7. cfCountry
8. contentType (type/subtype only)
9. xVercelCache (`HIT` `MISS` `PRERENDER` `STALE` `BYPASS` `REVALIDATED` `UNKNOWN`)
10. xMatchedPath (header value, truncated; no query)
11. requestKind
12. locale
13. routeFamily
14. botClassificationSource (`CF_VERIFIED` `UA_HEURISTIC` `NONE`)

Doubles (double1…double7):

1. status
2. latencyMs
3. responseContentLength (`Content-Length`, or `-1`)
4. ageSeconds (`Age`, or `-1`)
5. hasQuery (`0/1`)
6. hasRscQuery (`0/1`)
7. hasSourcePage (`0/1`)

Never written: `Authorization`, `Cookie`, query parameter **values**, client IP, `cf-connecting-ip`.

Bot labels from User-Agent are **heuristics**, not verified bots, unless `request.cf.botManagement.verifiedBot === true` (Bot Management; usually absent on the current plan). Then `botClassificationSource=CF_VERIFIED` and the family still comes from UA.

## Feature flags

| Var | Default | Effect |
| --- | --- | --- |
| `ISR_TELEMETRY_ENABLED` | `false` | Master kill switch for Analytics Engine writes |
| `ISR_HTML_TELEMETRY_SAMPLE_RATE` | `1` | HTML / RSC / PREFETCH sample rate when enabled |
| `ISR_TELEMETRY_SAMPLE_RATE` | `0.05` | Other kinds (this Worker mostly sees HTML/RSC/prefetch) |
| `ISR_PASSTHROUGH_STAGE` | `1` | `1` = glasses-guide telemetry; `2` = Stage 2 families |

With the flag off, Stage 1 routes still pass through to Vercel; they just do not write Analytics Engine.

## Deployment / rollout (do not run in this PR)

Do not attach P2 routes to `visutry-cf-production`. Do not change DNS, Cache Rules, or sitemaps.

### Staging

1. `npx wrangler deploy --config cloudflare-router/isr-passthrough.wrangler.jsonc --env staging --keep-vars`
2. Hit `https://visutry-isr-passthrough-staging.sunye.workers.dev/en/glasses-guide/<slug>` with HTML, `RSC: 1`, and `Next-Router-Prefetch: 1`. Compare status / content-type / location / cache-control / vary / x-matched-path to `https://visutry.vercel.app` (transport headers like `server` / `cf-ray` may differ).
3. Set `ISR_TELEMETRY_ENABLED=true` on the staging Worker. Confirm a datapoint lands. Set it back to `false`.

### Production Stage 1

1. Confirm live P0 routes still match the B4.2D snapshot (12 routes, script `visutry-cf-production` only).
2. Deploy the Worker **without routes**: `npx wrangler deploy --config cloudflare-router/isr-passthrough.wrangler.jsonc --env production --keep-vars`
3. Smoke the workers.dev URL against one glasses-guide slug. Confirm origin host is `visutry.vercel.app`.
4. Attach the 18 Stage 1 patterns with `script: visutry-isr-passthrough` and `request_limit_fail_open: true` via `POST /zones/5e3dc058ed16f3aee917f1cef2e9f413/workers/routes`.
5. Re-read all www routes. Expected: previous 12 P0 routes **unchanged** (still `visutry-cf-production`) plus 18 pass-through routes (`visutry-isr-passthrough`). No `www.visutry.com/*`.
6. Compare `https://www.visutry.com/en/glasses-guide/<slug>` vs `https://visutry.vercel.app/en/glasses-guide/<slug>` for HTML, RSC (`?_rsc=` preserved), prefetch, 404, trailing-slash 308.
7. Enable telemetry: dashboard var `ISR_TELEMETRY_ENABLED=true`. HTML sample rate stays `1`.
8. Observe **at least one Vercel ISR spike window** before Stage 2.

Print Stage 1 patterns:

```bash
npx tsx -e "import { cloudflareRoutePatterns } from './cloudflare-router/isr-passthrough.ts'; console.log(cloudflareRoutePatterns(1).join('\\n'))"
```

### Production Stage 2

Only if Stage 1 does not explain the 5k–10k RU/hour spike.

1. Set `ISR_PASSTHROUGH_STAGE=2`.
2. Attach the Stage 2 patterns to **the same** `visutry-isr-passthrough` Worker (not `visutry-cf-production`).
3. Repeat header comparison on one style / blog / face-shapes URL.

## Rollback (minutes)

1. **Telemetry off (seconds):** set `ISR_TELEMETRY_ENABLED=false` on `visutry-isr-passthrough`. Pass-through continues; no Analytics writes.
2. **Remove instrumentation (1–3 minutes):** `DELETE` the route IDs whose `script === visutry-isr-passthrough`. Leave the 12 P0 `visutry-cf-production` routes. Unmatched SEO returns to direct Vercel origin.
3. **Quota fail-open:** Free-plan 1027 with `request_limit_fail_open: true` already bypasses the Worker to the zone origin (Vercel). Do not flip fail-closed.
4. Do **not** delete DNS, www proxy, Cache Rules, or P0 routes as part of this rollback.

## SQL pack

Replace `ACCOUNT_ID` and use a token with Account Analytics Read. Dataset names must match the binding table above.

```bash
curl "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/analytics_engine/sql" \
  --header "Authorization: Bearer ${CF_API_TOKEN}" \
  --data @- <<'SQL'
-- paste a query from below
SQL
```

Use `_sample_interval` when aggregating.

### 1. Top route families by requests

```sql
SELECT
  blob13 AS route_family,
  SUM(_sample_interval) AS requests
FROM visutry_isr_telemetry_production
WHERE timestamp >= NOW() - INTERVAL '1' DAY
GROUP BY route_family
ORDER BY requests DESC
LIMIT 30
```

### 2. Top paths by PRERENDER/MISS

```sql
SELECT
  blob1 AS pathname,
  blob13 AS route_family,
  blob9 AS x_vercel_cache,
  SUM(_sample_interval) AS requests
FROM visutry_isr_telemetry_production
WHERE timestamp >= NOW() - INTERVAL '1' DAY
  AND blob9 IN ('PRERENDER', 'MISS')
GROUP BY pathname, route_family, x_vercel_cache
ORDER BY requests DESC
LIMIT 50
```

### 3. Requests by x-vercel-cache

```sql
SELECT
  blob9 AS x_vercel_cache,
  SUM(_sample_interval) AS requests
FROM visutry_isr_telemetry_production
WHERE timestamp >= NOW() - INTERVAL '1' DAY
GROUP BY x_vercel_cache
ORDER BY requests DESC
```

### 4. Bot category × route family

```sql
SELECT
  blob4 AS bot_category,
  blob14 AS bot_source,
  blob13 AS route_family,
  SUM(_sample_interval) AS requests
FROM visutry_isr_telemetry_production
WHERE timestamp >= NOW() - INTERVAL '1' DAY
GROUP BY bot_category, bot_source, route_family
ORDER BY requests DESC
LIMIT 50
```

### 5. CF colo × PRERENDER count

```sql
SELECT
  blob6 AS cf_colo,
  SUM(_sample_interval) AS prerender_requests
FROM visutry_isr_telemetry_production
WHERE timestamp >= NOW() - INTERVAL '1' DAY
  AND blob9 = 'PRERENDER'
GROUP BY cf_colo
ORDER BY prerender_requests DESC
```

### 6. Locale × PRERENDER count

```sql
SELECT
  blob12 AS locale,
  SUM(_sample_interval) AS prerender_requests
FROM visutry_isr_telemetry_production
WHERE timestamp >= NOW() - INTERVAL '1' DAY
  AND blob9 = 'PRERENDER'
GROUP BY locale
ORDER BY prerender_requests DESC
```

### 7. HTML vs RSC vs PREFETCH

```sql
SELECT
  blob11 AS request_kind,
  blob9 AS x_vercel_cache,
  SUM(_sample_interval) AS requests
FROM visutry_isr_telemetry_production
WHERE timestamp >= NOW() - INTERVAL '1' DAY
  AND blob11 IN ('HTML_DOCUMENT', 'RSC', 'NEXT_PREFETCH')
GROUP BY request_kind, x_vercel_cache
ORDER BY requests DESC
```

### 8. Hourly timeline

```sql
SELECT
  toStartOfHour(timestamp) AS hour,
  blob9 AS x_vercel_cache,
  SUM(_sample_interval) AS requests
FROM visutry_isr_telemetry_production
WHERE timestamp >= NOW() - INTERVAL '2' DAY
GROUP BY hour, x_vercel_cache
ORDER BY hour
```

### 9. Specific spike window

Replace the timestamps with the Hobby spike hour.

```sql
SELECT
  blob13 AS route_family,
  blob11 AS request_kind,
  blob4 AS bot_category,
  blob9 AS x_vercel_cache,
  SUM(_sample_interval) AS requests
FROM visutry_isr_telemetry_production
WHERE timestamp >= toDateTime('2026-08-18 00:00:00')
  AND timestamp < toDateTime('2026-08-18 01:00:00')
GROUP BY route_family, request_kind, bot_category, x_vercel_cache
ORDER BY requests DESC
LIMIT 100
```

### 10. Estimated ISR RU proxy

**ESTIMATE ONLY. NOT VERCEL BILLING ATTRIBUTION.**

Uses `Content-Length` when the origin sent it. Many responses omit it (`double3 = -1`); those rows must be excluded or they undercount.

```sql
SELECT
  blob13 AS route_family,
  SUM(_sample_interval) AS requests,
  SUM(_sample_interval * intDiv(double3 + 8191, 8192)) AS estimated_8kb_units
FROM visutry_isr_telemetry_production
WHERE timestamp >= NOW() - INTERVAL '1' DAY
  AND double3 >= 0
  AND blob9 IN ('PRERENDER', 'MISS', 'STALE')
GROUP BY route_family
ORDER BY estimated_8kb_units DESC
```

`intDiv(double3 + 8191, 8192)` is integer `ceil(bytes / 8192)`. HTML and RSC are separate requests if the client fetched both. Vercel may package ISR units differently.

## Spike-window investigation procedure

When Vercel Hobby shows ~9k ISR RU in one UTC hour:

1. Set `@start` / `@end` to that hour (UTC).
2. Restrict to pass-through rows: `blob3 = 'vercel-passthrough'` (Stage 1/2 Worker). Staging capability-router rows use `unknown-fallback` / `vercel-required`.
3. Run queries 2–7 and 10 with that window instead of `NOW() - INTERVAL '1' DAY`.
4. Fill this card:

```text
routeFamily:
bot:
requestKind:
x-vercel-cache:
requests:
estimatedRU:
colo:
locale:
```

Combined spike query:

```sql
SELECT
  blob13 AS routeFamily,
  blob4 AS bot,
  blob11 AS requestKind,
  blob9 AS x_vercel_cache,
  blob6 AS colo,
  blob12 AS locale,
  SUM(_sample_interval) AS requests,
  SUM(_sample_interval * intDiv(double3 + 8191, 8192)) AS estimatedRU
FROM visutry_isr_telemetry_production
WHERE timestamp >= toDateTime('2026-08-18 00:00:00')
  AND timestamp < toDateTime('2026-08-18 01:00:00')
  AND blob3 = 'vercel-passthrough'
GROUP BY routeFamily, bot, requestKind, x_vercel_cache, colo, locale
ORDER BY requests DESC
LIMIT 50
```

`estimatedRU` is **ESTIMATE ONLY. NOT VERCEL BILLING ATTRIBUTION.** Rows with `double3 < 0` (missing Content-Length) contribute 0 and undercount.

How to confirm or reject the crawler cold-read hypothesis:

- **Confirm:** spike hour is dominated by `x-vercel-cache IN ('PRERENDER','MISS')`, `requestKind` is `HTML_DOCUMENT` and/or `RSC`, `bot` is a crawler family (GOOGLEBOT / BINGBOT / OAI_SEARCHBOT / …), and `routeFamily` is `/[locale]/glasses-guide/[slug]` (Stage 1) or another SEO family after Stage 2.
- **Reject glasses-guide-only:** Stage 1 request volume in that hour is far below the RU spike, or cache status is mostly `HIT`. Then either enable Stage 2 or the reads are outside this Worker (other unmatched www paths).
- **Reject crawler:** `bot` is `LIKELY_BROWSER` / `UNKNOWN` at similar PRERENDER volume.

## Failure safety

Missing binding, `ISR_TELEMETRY_ENABLED=false`, or `writeDataPoint` throw: the request continues. Telemetry never retries, never returns 500, never mutates the upstream Request.
