# LAYER 2 / OPENNEXT ROOT CAUSE DIAGNOSTIC

**Date:** 2026-08-19  
**Status:** Diagnostic only. No production routing, DNS, cache, or ownership changes.  
**Worker identity during run:** stable `cloudflare | layer2-worker | worker | s-maxage=31536000, stale-while-revalidate=2592000`  
**Raw samples:** `2026-08-19T06-51-46-696Z-raw.json`

Prior valid benchmark (`codex/cf-migrate-glasses-guide`, `2026-08-19T05-40-57-463Z`): Glasses Guide Hybrid vs Direct Vercel median TTFB **+41.2%**. Fallback routes **+0.6% / EFFECTIVELY NEUTRAL**.

This run is a low-volume latency decomposition of the two Cloudflare-owned routes only. It is not an SLO and not a replacement for the 12h/24h P0-F1 observation.

```text
LAYER 2 / OPENNEXT ROOT CAUSE DIAGNOSTIC

Observed slowdown:
Hybrid Glasses Guide vs Direct Vercel: approximately +29% post-TLS wait
(+17% client TTFB in this noisy TLS-heavy sample; prior valid TTFB was +41.2%)

Primary root cause:
OpenNext is configured with a dummy incremental cache, so Glasses Guide HTML is rebuilt on every Worker invocation (x-nextjs-cache: MISS) while Direct Vercel serves the same force-static pages from ISR/CDN HIT.

Confidence:
HIGH

Latency decomposition (Hybrid p50, measured samples):
- Client/network/edge: 571 ms post-TLS wait after subtracting cfWorker; TLS ~1974 ms dominates client TTFB from this laptop
- Router/OpenNext runtime: 83 ms (Cloudflare server-timing cfWorker). x-visutry-router-latency-ms is 0 ms and is not a usable wall clock in this Worker
- Cache/render/data component: unknown as a separate timer; 34/34 Hybrid responses were x-nextjs-cache MISS with no Neon/DB on this route family

Vercel behavior:
ISR/CDN HIT on 35/35 successful Direct Vercel samples. age 5355–5898s. cache-control public, max-age=0, must-revalidate. No Cloudflare hop.

Cloudflare/OpenNext behavior:
Layer 2 Worker on every request. x-nextjs-cache MISS. no cf-cache-status (CDN is not serving HIT HTML). x-visutry-router-cache=deploy-static-html is a route-class label, not an incremental-cache HIT. Prerendered HTML/RSC artifacts exist in .open-next/cache but defineCloudflareConfig() defaults incrementalCache to dummy.

Root cause classification:
H (A + D; B is the miss-path mechanism; F is secondary on isolate start)
```

## Production confirmation

Both diagnostic routes returned HTTP 200 before and during the run.

| URL | Status | Owner | Notes |
| --- | ---: | --- | --- |
| `https://www.visutry.com/en/glasses-guide` | 200 | `x-visutry-router-backend=cloudflare`, `layer=layer2-worker` | `x-nextjs-cache=MISS` |
| `https://www.visutry.com/en/glasses-guide/best-rectangle-glasses-for-round-face` | 200 | same | `x-nextjs-cache=MISS` |
| `https://visutry.vercel.app/en/glasses-guide` | 200 | Direct Vercel (`server: Vercel`, no `cf-ray`) | `x-vercel-cache=HIT` |
| `https://visutry.vercel.app/en/glasses-guide/best-rectangle-glasses-for-round-face` | 200 | Direct Vercel | `x-vercel-cache=HIT` |

Worker identity did **not** change during the run. Direct Vercel did **not** return 403. Three samples failed with `curl: (35) SSL_ERROR_SYSCALL` and were excluded (not counted as performance results).

No production instrumentation was deployed. Existing headers plus code inspection were sufficient. `Date.now()` around `appWorker.fetch` cannot measure CPU-bound OpenNext work in this Worker (`x-visutry-router-latency-ms` stayed `0` on all 34 Hybrid successes).

## Required result table

Post-TLS `waiting` is client TTFB minus DNS/TCP/TLS. Use it for architecture comparison. Full TTFB from this laptop is TLS-dominated (~1.8–2.0s p50 on both endpoints).

| Route | Endpoint | TTFB p50 | Router latency p50 | cfWorker p50 | External overhead | Cache state | Result |
| --- | --- | ---: | ---: | ---: | --- | --- | --- |
| `/en/glasses-guide` | Hybrid | 2595 ms | 0 ms (unusable) | 84 ms | 643 ms wait−cfWorker; cfWorker/TTFB **3.2%**; cfWorker/wait **11.8%** | OpenNext/Next **MISS**; no `cf-cache-status`; router-class `deploy-static-html` | Hybrid slower on wait (**+49.8%**) |
| `/en/glasses-guide` | Direct Vercel | 2374 ms | n/a | n/a | n/a | `x-vercel-cache=HIT`; age 5355–5693 | ISR/CDN HIT |
| `/en/glasses-guide/best-rectangle-glasses-for-round-face` | Hybrid | 2692 ms | 0 ms (unusable) | 80 ms | 495 ms wait−cfWorker; cfWorker/TTFB **3.0%**; cfWorker/wait **14.6%** | OpenNext/Next **MISS**; no `cf-cache-status`; router-class `deploy-static-html` | Hybrid slower on wait (**+6.1%**) |
| `/en/glasses-guide/best-rectangle-glasses-for-round-face` | Direct Vercel | 2100 ms | n/a | n/a | n/a | `x-vercel-cache=HIT`; age 5550–5898 | ISR/CDN HIT |

Combined Glasses Guide (hub+detail measured successes): Hybrid TTFB p50 **2665 ms** vs Vercel **2283 ms** (**+16.7%**). Hybrid wait p50 **663 ms** vs Vercel **513 ms** (**+29.1%**).

## Case A vs Case B

Absolute client TTFB looks like **Case B** if `x-visutry-router-latency-ms` is trusted: ~2600 ms TTFB vs 0 ms router header. That header is a Workers `Date.now()` artifact, not evidence that OpenNext is free.

Using Cloudflare `server-timing cfWorker`:

- Hybrid wait p50 663 ms
- cfWorker p50 83 ms → **OpenNext/Worker execution is ~12.5% of post-TLS wait**
- remaining ~571 ms is edge/network/queue after the connection is up

The **Hybrid vs Vercel gap** is still an OpenNext cache miss vs Vercel HIT:

- Fallback HTML through Cloudflare was previously EFFECTIVELY NEUTRAL, so proxy overhead is not the Glasses Guide delta.
- Vercel Glasses Guide is a long-lived ISR HIT (`age` ~1.5 hours in this run).
- Cloudflare Glasses Guide never produced `x-nextjs-cache: HIT` or `cf-cache-status: HIT` in 34/34 successes.
- The wait gap (especially hub **+50%**) sits on that MISS path.

## Cache behavior

This is the primary finding. HIT was **not** inferred from repeat requests getting faster.

**Direct Vercel**

- `x-vercel-cache: HIT` on every successful sample
- `age` monotonically increased (5355 → 5898) across the ~7 minute run
- Matches `force-static` + `generateStaticParams` ISR/CDN delivery

**Cloudflare / OpenNext**

- `x-nextjs-cache: MISS` on every successful Hybrid sample, including after warm-up
- No `cf-cache-status` header, so Cloudflare CDN is not serving the HTML as a cache HIT
- `cache-control: s-maxage=31536000, stale-while-revalidate=2592000` is emitted by Next/OpenNext but is not producing an edge HIT for these Worker responses
- `x-visutry-router-cache: deploy-static-html` is the B4 route classifier (`cacheClass`), not an incremental-cache result

Code:

- `open-next.config.ts` calls `defineCloudflareConfig()` with no incremental-cache override
- `@opennextjs/cloudflare` defaults `incrementalCache` to `"dummy"`
- Dummy `get`/`set` throw `IgnorableError('"Dummy" cache does not cache anything')`
- OpenNext cache adapter treats that as a miss and continues to render
- Built artifacts **do** exist: `.open-next/cache/<buildId>/en/glasses-guide.cache` is type `app` with ~108 KB HTML + ~54 KB RSC. They are not in `.open-next/assets` as Layer 1 files, and dummy cache never reads them
- `StaticAssetsIncrementalCache` exists in the adapter specifically to serve those prerendered files from Workers Static Assets without R2. It is not enabled

## Hub vs detail

Both are slow for the same cache reason. This is **not** detail-only.

- Hub wait vs Vercel: **+49.8%**
- Detail wait vs Vercel: **+6.1%**
- Both: `x-nextjs-cache: MISS` 100%
- Detail `dynamicParams = process.env.CLOUDFLARE_BUILD === '1'` is required for OpenNext nested dispatch; it does not uniquely explain the family slowdown
- Hub renders the full localized combination catalog (`search-combination-locales.ts` ~94 KB). Detail renders one page plus related links. That matches hub being the worse wait delta under a persistent miss

## Cold vs warm

Not a one-shot cache-fill.

- Hub first Hybrid wait 1164 ms / cfWorker 386 ms; later wait p50 713 ms / cfWorker p50 84 ms
- Detail first Hybrid wait 625 ms / cfWorker 64 ms; later wait p50 619 ms / cfWorker p50 80 ms
- After isolate warm-up, responses stay **MISS** and stay in the same few-hundred-ms wait band
- Contrast: if this were only cold cache fill, subsequent Hybrid requests would look like Vercel HIT. They do not

## OpenNext internal cost (from code, not a production deploy)

Trace for Cloudflare-owned Glasses Guide:

```text
request
→ B4 classify (cloudflare / layer2-worker / deploy-static-html)
→ appWorker.fetch
→ OpenNext route resolution + i18n middleware
→ incremental cache get → dummy throw → miss
→ App Router render of force-static page from in-memory locale modules
→ HTML/RSC serialization
→ router wrapper sets x-visutry-router-* (latency Date.now() delta = 0)
```

Present:

- Worker invocation on every HTML request (`run_worker_first=false` does not help; HTML is not a Static Asset file)
- Next/OpenNext route resolution
- RSC/HTML runtime render
- incremental cache miss (dummy)
- large in-memory locale/content modules (hub especially)

Not present on this family (code):

- Neon / Prisma / DATABASE_URL
- KV / R2 / D1 incremental cache bindings
- external HTTP from the page module
- `fetch` in `src/app/[locale]/(main)/glasses-guide/**`

## Instrumentation decision

No production Worker change was made.

Safe external signals already answered cache state (`x-nextjs-cache`, `x-vercel-cache`, `age`, `cf-cache-status` absence) and Worker duration (`server-timing cfWorker`). Adding `performance.now()` segments inside generated `.open-next` artifacts would require a production deploy and was out of scope.

## Classification detail

| Code | Verdict | Evidence |
| --- | --- | --- |
| A | **Yes** | dummy incremental cache; 34/34 `x-nextjs-cache: MISS`; prerendered `.cache` files unused |
| B | Mechanism of A | miss path re-renders RSC/HTML; cfWorker 35–412 ms; hub catalog module is larger |
| C | Not primary | prior fallback class EFFECTIVELY NEUTRAL; TLS is shared by both endpoints |
| D | **Yes** | 35/35 Direct Vercel `x-vercel-cache: HIT` with multi-thousand-second `age` |
| E | No as primary | both hub and detail miss; hub wait gap is larger |
| F | Secondary | hub first cfWorker 386 ms vs later 84 ms; later requests still MISS |
| G | No | no Neon/DB/external fetch on these page modules |
| H | **Primary label** | A + D, with B as miss-path CPU and F as isolate start |
| I | No | cache asymmetry is directly observed |

## Decision recommendation

```text
NEXT ACTION: optimize OpenNext cache behavior
```

Do not start P0-F2. Do not change production routes in this diagnostic. The next optimization, if approved, should make OpenNext actually serve the prerendered Glasses Guide HTML (static-assets incremental cache or equivalent) instead of dummy-miss rendering, and only then re-measure Hybrid vs Direct Vercel.
