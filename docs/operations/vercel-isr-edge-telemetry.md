# Vercel ISR edge telemetry (P0-E2A)

**Status:** code ready, **not deployed**  
**Date:** 2026-08-18  
**Branch:** `codex/isr-edge-telemetry`  
**Purpose:** observe which Vercel-bound GET/HEAD requests at the Cloudflare router correspond to prerender cold reads, without Vercel Pro logs.

This is observability only. It does not change routing, Cache-Control, Cloudflare Cache Rules, cookies, redirects, sitemaps, or Next rendering.

## Production router coverage

**PRODUCTION_ROUTER_COVERAGE: PARTIAL**

**PRODUCTION CONFIG VERIFICATION REQUIRED** for whether the 12 P0 Worker Routes are still exactly those listed in `docs/operations/cloudflare-b4-2d-p0-production-cutover.md`. This repo records that snapshot; it cannot prove the live Cloudflare dashboard has not drifted.

Repo-documented production path (B4.2D P0):

```text
Browser → Cloudflare DNS → www PROXIED →
  matched ungated P0 static prefix/exact → Static Assets (Worker not invoked)
  matched ungated P0 API exact → visutry-cf-production (app-host-worker.ts)
  unmatched → Vercel origin
```

Locale SEO HTML does **not** currently enter `cloudflare-router/worker.ts` or the production OpenNext worker:

| Path | Documented execution |
| --- | --- |
| `/en/glasses-guide/*` | unmatched → Vercel (P2 routes exist in the review manifest, **not activated**) |
| `/de/glasses-guide/*` | unmatched → Vercel |
| `/en/style/*` | unmatched → Vercel |
| `/en/blog/*` | unmatched → Vercel |

`cloudflare-router/worker.ts` (Worker name `visutry-cf-staging-router`) **does** classify those paths as `unknown-fallback → Vercel`. That is the staging capability router. Its wrangler file has **staging only**. There is no production env for this router in repo, and none was invented.

`visutry-cf-production` (`app-host-worker.ts`) can observe Vercel **only** for requests that already hit a production Worker Route and then classify as Vercel. Today that is not locale HTML. Attaching P2 HTML routes to `visutry-cf-production` would be a **backend change** (OpenNext `cf-ready`), not pass-through telemetry. Do not do that to measure Vercel ISR.

Vercel response headers (`x-vercel-cache`, `age`, `x-matched-path`) are readable only after the router `fetch()`s Vercel. Orange-cloud origin pass-through never runs this Worker, so those headers are **not visible in Analytics Engine until a Vercel-pass-through Worker sits on the path**.

## Bindings

| Worker wrangler | Env | Binding | Dataset | Enabled by default |
| --- | --- | --- | --- | --- |
| `cloudflare-router/wrangler.jsonc` | staging | `ISR_TELEMETRY` | `visutry_isr_telemetry_staging` | **false** |
| `wrangler.jsonc` | staging | `ISR_TELEMETRY` | `visutry_isr_telemetry_staging` | **false** |
| `wrangler.jsonc` | production | `ISR_TELEMETRY` | `visutry_isr_telemetry_production` | **false** |

No production capability-router env was added. Datasets are created on first write after deploy; this PR does not deploy.

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

## Deployment instructions (do not run in this PR)

1. Confirm live P0 routes still match the B4.2D snapshot.
2. Staging first: `npx wrangler deploy --config cloudflare-router/wrangler.jsonc --env staging --keep-vars` then set `ISR_TELEMETRY_ENABLED=true` on `visutry-cf-staging-router`. Hit a staging path that classifies as `unknown-fallback`.
3. Query `visutry_isr_telemetry_staging` with the SQL below.
4. Production locale HTML still will not appear until a **Vercel pass-through** Worker is attached to those paths. That attach is a separate ops change: Worker hop in front of the same Vercel origin. It is **not** attaching P2 routes to `visutry-cf-production`.
5. Disable: set `ISR_TELEMETRY_ENABLED=false` (or omit the binding). No Cache Rule, DNS, or sitemap change.

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

## Failure safety

Missing binding, `ISR_TELEMETRY_ENABLED=false`, or `writeDataPoint` throw: the request continues. Telemetry never retries, never returns 500, never mutates the upstream Request.
