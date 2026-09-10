# P0.3A — ISR/FOT Root-Cause Isolation

Date: 2026-09-10
Mode: forensic / read-only
Scope: consumer production, `www.visutry.com`

## Freeze and production state

- GitHub `main`: `f26df773b0c8631e15d438bf3313a8759cdb648b`.
- Vercel Production points to the same SHA and is `READY`.
- Active Cloudflare Worker: `visutry-cf-production`, version `a01f0bb1-01d7-4036-ae4d-330a882583bd`.
- Cloudflare D1 rule is visible and active with 27 detail-route clauses. Smart Tiered Cache is enabled.
- The Worker remains limited to the existing 12 routes; it is not a full public HTML/RSC observer.
- Read-only production smoke passed. No code, deployment, route, cache, DNS, Vercel, or telemetry-setting change was made.
- The repository `--check-live` CLI path remains blocked by Cloudflare API `403`; the active D1 state above is from read-only Cloudflare UI inspection, not from a fabricated CLI pass.

## Windows and evidence boundaries

Cloudflare GraphQL exact window:

`2026-09-09T04:42:00Z` → `2026-09-10T04:42:00Z` (24 hours), filtered to `clientRequestHTTPHost = "www.visutry.com"`.

Vercel’s narrowest visible route-level window:

`2026-09-09T20:12:00Z` → `2026-09-10T04:42:00Z` (8 hours 30 minutes). Exact 24-hour route-level ISR attribution was not exposed by the dashboard. Vercel route figures below are therefore time-window correlation evidence, not exact joins to the Cloudflare 24-hour figures.

The browser fan-out sample used a fresh anonymous Chrome profile. It is an observation of two navigations, not a production extrapolation.

## CACHE OPPORTUNITY

The reuse figures use exact localized detail-path matching for the nine application locales. Wildcard matching was not used, so `/_next/static` chunks containing a family name are excluded.

| family | requests | edge bytes | unique paths | singleton % | repeatable % | approx. within-2h reuse % | HIT | MISS | BYPASS | DYNAMIC |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `glasses-guide` | 924 | 9,567,934 | 275 | 19.27% | 70.24% | 39.72% | 2.16% | 69.59% | 19.37% | 1.84% |
| `style` | 538 | 3,704,588 | 70 | 4.29% | 86.99% | 66.73% | 0.74% | 54.28% | 7.06% | 28.81% |
| `sunglasses-for` | 215 | 2,329,849 | 64 | 18.75% | 70.23% | 41.40% | 0.93% | 56.28% | 16.74% | 11.16% |

Colo-local repeatable request share was approximately 38.20% for `glasses-guide`, 56.13% for `style`, and 42.33% for `sunglasses-for`. This is a reuse ceiling, not a cache-key proof.

### Cache/status cross-tab

| family | cache/status | requests | edge bytes |
|---|---|---:|---:|
| glasses-guide | MISS / 200 | 370 | 5,295,511 |
| glasses-guide | MISS / 504 | 270 | 28,890 |
| glasses-guide | BYPASS / 403 | 179 | 2,889,113 |
| glasses-guide | REVALIDATED / 200 | 53 | 817,384 |
| glasses-guide | HIT / 200 | 20 | 355,318 |
| glasses-guide | DYNAMIC / 200 | 7 | 90,894 |
| style | MISS / 504 | 230 | 24,610 |
| style | DYNAMIC / 200 | 136 | 1,242,821 |
| style | MISS / 200 | 62 | 884,138 |
| style | REVALIDATED / 200 | 49 | 851,810 |
| style | BYPASS / 403 | 38 | 613,019 |
| style | HIT / 200 | 4 | 56,337 |
| sunglasses-for | MISS / 200 | 65 | 999,891 |
| sunglasses-for | MISS / 504 | 56 | 5,992 |
| sunglasses-for | BYPASS / 403 | 36 | 580,593 |
| sunglasses-for | REVALIDATED / 200 | 32 | 521,820 |
| sunglasses-for | DYNAMIC / 200 | 22 | 188,565 |
| sunglasses-for | HIT / 200 | 2 | 27,606 |

### Interpretation

**MISS ROOT CAUSE:** `ERROR / UNKNOWN`
**Confidence:** medium for the observed MISS mix; low for the underlying 504 mechanism.

High cardinality is not sufficient as the explanation: repeatable demand is 70–87% and the `style` family has only 70 unique paths with approximately 67% within-2h reuse. The direct evidence instead shows that 504 responses account for 270/643 `glasses-guide` misses, 230/292 `style` misses, and 56/121 `sunglasses-for` misses. Successful 200 responses also remain `DYNAMIC` or `REVALIDATED` in material amounts, so the secondary cacheability/TTL/key mechanism is not proven.

A live public-header spot check returned:

- `/en/style/round-face`: `200`, `CF-Cache-Status: REVALIDATED`, `x-vercel-cache: HIT`.
- `/en/glasses-guide/best-rectangle-glasses-for-round-face`: `200`, `CF-Cache-Status: HIT`, `Age: 443`, `x-vercel-cache: HIT`.
- `/en/sunglasses-for/round-face`: `200`, `CF-Cache-Status: REVALIDATED`, `x-vercel-cache: HIT`.
- `/en`: `200`, `CF-Cache-Status: DYNAMIC`, `x-vercel-cache: HIT`.

The variation across repeated public probes is consistent with a live cache/revalidation state, but does not identify the remaining cache-key or TTL mechanism.

## REQUEST CLASSIFICATION

Fresh anonymous browser observations:

| navigation | DOCUMENT | RSC | PREFETCH | IMAGE | STATIC | API | total captured |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/en` | 1 | 4 | 4 | 7 | 27 | 1 | 55 |
| `/en/style/round-face` | 1 | 2 | 2 | 6 | 20 | 1 | 45 |

All observed RSC requests in these two samples also carried the prefetch signal. The normal link navigation to a prefetched target produced no additional document/RSC request in the observed click, indicating that browser prefetch can satisfy a later navigation from the client cache.

The existing `GrowthFunnelLink` passes an omitted `prefetch` value through to Next `Link`, while other continuation/related links explicitly use `prefetch={false}`. Source evidence is consistent with the browser result, but source inspection alone is not used as production volume evidence.

**PREFETCH AMPLIFICATION:** `STRONGLY SUPPORTED` for request fan-out; **NOT PROVEN** as an ISR/FOT cause.

## TIERED CACHE

`ENABLED` — Cloudflare UI shows Tiered Cache active with Smart Tiered Cache selected. This does not by itself establish that the current D1 boundary absorbs the public HTML/RSC population.

## 504 FORENSICS

Cloudflare zone analytics observed **8,397 edge-response 504 requests** and **898,479 edge-response bytes** in the exact 24-hour window. All observed 504s had `cacheStatus = MISS`. `originResponseStatus` was unavailable/empty in this dataset, so the origin-side cause is not measurable from this query.

| observed path family | 504 requests | share |
|---|---:|---:|
| `/_next/image` | 3,593 | 42.79% |
| other localized HTML | 3,295 | 39.24% |
| `/api/auth/*` | 627 | 7.47% |
| localized `glasses-guide` detail | 270 | 3.22% |
| localized `style` detail | 230 | 2.74% |
| `/` | 106 | 1.26% |
| localized `sunglasses-for` detail | 56 | 0.67% |
| other `/api/*` | 42 | 0.50% |
| other | 178 | 2.12% |

The 504 population is persistent across the day rather than a single-minute spike. Cloudflare did not expose a usable origin status for these rows; verified bot category was unknown and browser class was unknown for this 504 subset. The direct smoke test returned healthy responses, and the Vercel Functions tail showed 670 invocations with 0% error and 0% timeout, but that does not rule out an Image Optimization, CDN, edge, or upstream-fetch failure outside the Functions error table.

**Dominant cause:** `UNKNOWN` (edge-observed 504s are proven; origin cause is not).
**Confidence:** high that 504/MISS materially depresses pilot HIT ratios; low on the root mechanism.

## ZONE-LEVEL CONTEXT

Cloudflare GraphQL exact-window totals for `www.visutry.com`:

- HTTP requests: **37,059**
- edge response bytes: **337,296,832**
- visits: **2,068**
- cache distribution: HIT 11,161 (30.12%), DYNAMIC 12,423 (33.52%), MISS 9,059 (24.44%), NONE 3,989 (10.76%), BYPASS 253 (0.68%), REVALIDATED 174 (0.47%).

Verified bot categories were material but not equivalent to “human” traffic:

- AI Crawler: 4,005 requests / 89,998,443 bytes (10.81% / 26.68%).
- Search Engine Crawler: 486 / 4,474,856 (1.31% / 1.33%).
- Search Engine Optimization: 560 / 4,283,394 (1.51% / 1.27%).
- AI Search: 197 / 4,743,019 (0.53% / 1.41%).
- AI Assistant: 100 / 921,036 (0.27% / 0.27%).

Recognized bot categories total 6,043 requests (16.31%). The remaining 31,016 requests are unclassified by `verifiedBotCategory`; they must not be called human traffic.

## VERCEL

Project-level comparison already captured for the same B2 experiment window:

- ISR Read Units: **30,351**.
- FOT incoming: **9.66 MB**.
- FOT outgoing: **343.09 MB**.

The dashboard did not expose an exact 24-hour route-level ISR/FOT join. In the narrowest visible 8h30 route table, the material ISR route families were:

| Vercel route family | ISR Reads/count where visible | ISR Read Units | ISR Read Bytes |
|---|---:|---:|---:|
| `/[locale]/glasses-guide/[slug]` | 126 | ~1.4K | ~10 MB |
| `/sitemaps/core.xml` | count not visible | ~693 | ~6 MB |
| `/[locale]` | 36 | ~464 | ~4 MB |
| `/[locale]/style/[faceShape]` | 29 | ~312 | ~2 MB |
| `/[locale]/face-shape-detector` | 27 | ~306 | ~2 MB |
| `/[locale]/sunglasses-for/[faceShape]` | 23 | ~256 | ~2 MB |
| `/[locale]/blog` | not visible | ~301 | ~2 MB |
| `/[locale]/brand/[brand]` | not visible | ~252 | ~2 MB |
| `/[locale]/face-shapes/[faceShape]` | not visible | ~226 | ~2 MB |
| `/[locale]/face-analysis` | not visible | ~186 | ~1 MB |

The Vercel Functions tail for the same 8h30 period showed 670 invocations, 0% errors, and 0% timeouts. Route-level FOT is not exposed, so it was not inferred.

**DIRECT VERCEL MICROTEST:** `SKIPPED`. Route-level metrics were visible, but only as an aggregate 8h30 window; they cannot resolve a few controlled document/RSC/prefetch requests into separate ISR reads. No synthetic traffic was added.

## ROOT-CAUSE GRADES

| hypothesis | grade | evidence boundary |
|---|---|---|
| A. Public SEO/prerendered routes dominate ISR reads | **STRONGLY SUPPORTED** | SEO-like route families are prominent in the visible ISR table, especially `glasses-guide` and `sitemaps/core.xml`; exact route-to-project share is unavailable. |
| B. Public HTTP demand is far larger than authenticated product usage | **STRONGLY SUPPORTED** | 37,059 public-zone requests vs 2,068 Cloudflare visits; this is not an authenticated-user count and does not prove human usage. |
| C. Bot/crawler demand is material | **PROVEN** | 6,043 requests are in verified bot categories, including 4,005 AI Crawler requests and 90.0 MB of edge bytes. |
| D. RSC/prefetch is a material production amplifier | **STRONGLY SUPPORTED** for request fan-out; **NOT PROVEN** for ISR/FOT | Clean browser captured 4 and 2 RSC-prefetch requests per navigation; zone analytics cannot identify RSC headers/query dimensions. |
| E. Current Cloudflare boundary fails to absorb most costly public Next delivery | **PLAUSIBLE** | Global DYNAMIC+MISS+BYPASS is 21,735/37,059 requests (58.65%); however global status is not a D1-only slice, and pilot 200 rows include REVALIDATED/DYNAMIC behavior. |
| F. ISR Read Bytes track FOT outgoing at the same time scale | **NOT MEASURABLE** | Vercel route-level ISR bytes and FOT are not exposed at identical route/time resolution. |
| G. `/api/auth/session` is a material secondary Function load | **PLAUSIBLE** | It is 499 of the observed 504s and 207 of the visible Functions-tail invocations, but complete same-window function attribution is unavailable. |

## DIRECT CLASS CHAIN

- **Document → ISR:** `STRONGLY SUPPORTED` at family/time-window level; not proven per request. Public documents and high ISR route families coexist, while public responses commonly show `x-vercel-cache: HIT`.
- **RSC → ISR:** `NOT PROVEN`; RSC is observed, but the zone dataset cannot classify it and no per-request ISR join exists.
- **Prefetch → ISR:** `NOT PROVEN`; browser fan-out is real, but no production metric maps those requests to ISR reads.

**OVERALL ROOT CAUSE:** `PARTIALLY PROVEN`.

The smallest supported chain is: public SEO/document demand and verified crawler demand reach a delivery boundary with substantial MISS/DYNAMIC behavior; clean browser navigations add RSC/prefetch fan-out; route-level Vercel ISR reads are high on SEO-like families. The causal contribution of RSC/prefetch to ISR/FOT, the mechanism behind the remaining 200/DYNAMIC rows, and the origin cause of 504s are not proven.

## TOP 3 COST DRIVERS

1. **8,397 edge-observed 504/MISS requests**, led by `/_next/image` (3,593) and localized HTML (3,295); this is the largest unresolved failure/request-amplification signal.
2. **Verified AI crawler demand:** 4,005 requests and ~90.0 MB of edge bytes, materially concentrated in public delivery.
3. **Public SEO ISR families and sitemap reads:** visible route-level leaders include `glasses-guide` (~1.4K units), `sitemaps/core.xml` (~693 units), and `style` (~312 units).

## RECOMMENDED FIRST OPTIMIZATION

**ONE ACTION ONLY:** establish request-ID correlation for the 504 population between Cloudflare edge events and Vercel/Image Optimization/upstream logs, starting with `/_next/image` and localized HTML.

**EXPECTED IMPACT:** `HIGH` for diagnosis and potentially high for resource reduction; no cache-policy change is justified until the 504 source is identified.

## FINAL STATUS

- **PRODUCTION CHANGES:** `NONE`
- **BROAD A/B SWITCHBACK:** `NOT RUN`
- **WORKER TELEMETRY BLIND SPOT:** `CONFIRMED` — current 12 Worker Routes do not cover the main public HTML/RSC surface; the existing forensic sample was next-image only.
- **ROOT CAUSE PROVEN:** `NO`
- **24H EVIDENCE STILL NEEDED:** a per-request or request-ID join for 504s; exact same-window Vercel route-level ISR Read Count/Units/Bytes and FOT; and a directly observable RSC/prefetch dimension or controlled Vercel microtest with sufficient metric resolution.
