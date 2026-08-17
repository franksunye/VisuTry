# VisuTry Cloudflare B4.1 Production Cutover Readiness

**Status:** PASS — readiness plan, Static Asset audit, and corrected Free-plan quota model are recorded. Production traffic was not moved.

**Date:** 2026-08-17

**Owner:** Product / Engineering

**Baseline:** `origin/main` `b3794161d0bb4d2c7e928d5cf5ba39887b2e86be` (PR #92 merge)

This document is the B4.2 implementation plan. It does **not** cut over production, change DNS, bind `www.visutry.com`, or deploy a production Worker route.

Related:

- [`ADR-010-hybrid-edge-architecture-for-store-campaign-scale.md`](../decisions/ADR-010-hybrid-edge-architecture-for-store-campaign-scale.md) (not rewritten; architectural principles)
- [`hosting-strategy-vercel-cloudflare.md`](./hosting-strategy-vercel-cloudflare.md) — canonical **Three-Layer Traffic Execution Model**
- [`cloudflare-b3-2-capability-routing.md`](./cloudflare-b3-2-capability-routing.md)
- [`vercel-quota-emergency-reduction.md`](./vercel-quota-emergency-reduction.md) (PR #91)
- Proposed classifier: `cloudflare-router/b4-production-public-slice.ts`
- Review manifest: `cloudflare-router/b4-production-public-slice.manifest.json`

## 1. Status

| Item | Value |
| --- | --- |
| B4.1 result | PASS (quota-model correction applied) |
| B4.2 GO / NO-GO | **GO** for staging wiring of this public slice after workers.dev smoke. Production DNS/Custom Domain remains a later window. Worker HTML volume is **WARNING**, not a classification NO-GO. |
| Production DNS changed | NO |
| Production Worker route bound | NO |
| Authenticated traffic in first slice | NO |
| Live staging classifier changed | NO (`cloudflare-router/worker.ts` remains B3.2) |

Last proven staging Worker: `a84743e9-90ab-404e-b372-5a6234d634af`, gzip **2777.11 KiB** / 3072 KiB.

B4.1 wrangler staging dry-run on this branch (classifier not wired into the Worker): **2780.44 KiB** gzip after the quota-model correction (earlier on this branch: 2782.77 KiB). Still below 3072 KiB.

**Corrected optimization goal:** serve eligible content through Cloudflare Static Assets **without Worker invocation**; use the Worker only for capabilities that actually require routing or runtime execution. Do **not** treat Workers Caching or “Worker-as-origin CDN cache” as a way to avoid the 100,000 Worker requests/day quota.

## 2. Architecture baseline

Unchanged from ADR-010 at the principle level:

> Cloudflare = traffic-scale edge; Vercel/backend = compute/integration-heavy capabilities; Neon = relational source of truth.

The canonical execution model is the **Three-Layer Traffic Execution Model** in [`hosting-strategy-vercel-cloudflare.md`](./hosting-strategy-vercel-cloudflare.md): Layer 1 Static Assets (no Worker, no quota) → Layer 2 Worker / capability router only if necessary → Layer 3 Vercel/backend only if necessary. “Cloudflare traffic” does not mean every request invokes a Worker.

Current production host is Vercel. `www.visutry.com` and `visutry.com` are Vercel project domains. Public DNS nameservers are `ns1.vercel-dns.com` / `ns2.vercel-dns.com`. `wrangler.jsonc` is staging `workers_dev` only: no `routes`, no zone, no `visutry.com`.

B3.2 same-host staging routing already passed (PR #92). That proves cookie/header forwarding and Vercel fallback. It does **not** prove that every B3.2 `cf-ready` route should enter the first production slice.

### 2.1 Production request path (B4.2 target)

This is the B4.2 instantiation of the canonical three-layer model. It does not replace that section.

```text
www.visutry.com request
  → Cloudflare Static Assets  (run_worker_first = false)
      → exact file in .open-next/assets
          serve directly, no Worker, does not count toward 100k/day
  → else Cloudflare Worker (app-host-worker.ts)
      → classify
         → CF OpenNext runtime     (HTML, APIs, redirects, sitemaps)
         → https://visutry.vercel.app
           UNKNOWN, writes, Vercel-required
```

Preserve: UNKNOWN → Vercel; writes → Vercel; no automatic CF→Vercel retry; no dual execution; no dual write. Do not redesign B3.2 capability semantics in `cloudflare-router/worker.ts`.

Do **not** set `assets.run_worker_first` to `true`. That would invoke `app-host-worker.ts` for hashed JS/CSS/images and consume Worker quota. Do **not** enable Workers Caching as a quota strategy: cache hits are still billed as Worker requests, and enabling it can bill otherwise-free Static Assets.

Keep `assets.not_found_handling = "none"` so missing assets fall through to the Worker (then Vercel for unknown), not a fake SPA `index.html` 200.

## 3. First production slice

Principle: **public + read-only + high-frequency + low-compute**. Authenticated B3.2 routes stay on Vercel.

### A. FIRST CUTOVER (GET/HEAD only)

- `/` (locale detection; **CDN cache bypass**)
- `/:locale` home pages
- Locale marketing/SEO HTML that is `force-static` today: face-shape detector and related landings, blog index/posts/tags, curated `/brand/:brand`, glasses-guide, face-shapes, style, sunglasses-for, hairstyles-for, try-on landings, pricing/business/legal/faq, store **hub** `/:locale/store`
- Locale-less URLs that already 308 via `next.config.js`
- `/_next/static/*`, favicon, robots, llms.txt, public image prefixes
- `/sitemap.xml`, `/sitemaps/core.xml`, `/sitemaps/blog.xml`
- `GET /api/health`
- `GET /api/glasses/brands|categories|face-shapes`

### B. LATER CUTOVER

- `/:locale/store/:merchantSlug` and `/:locale/c/:merchantSlug/:experienceSlug`
- `/sitemaps/dynamic.xml`
- `GET /api/store/merchants/:slug`
- Auth/session/callback and protected CF reads
- Merchant provisioning and MCP
- `/category/*` and `/try/*` while `PROGRAMMATIC_SEO_ENABLED` is off (Vercel currently 404s these)

### C. KEEP VERCEL

- `/_next/image`
- Stripe/payment writes, Blob/upload, AI submit, cron, admin, MCP OAuth/DCR
- `GET /api/glasses/frames`, `GET /api/frames` (Prisma / DTO not first-slice proven)
- `force-dynamic` pages (`/discover`, `/style-explorer`)
- Unknown paths and unknown methods

Exact matcher: `classifyB4ProductionPublicSlice()`.

## 4. Deferred capabilities

Deferred even though B3.2 staging proved them:

| Capability | Why not B4.2 |
| --- | --- |
| NextAuth/Auth0 transaction | Cookie/callback risk; first slice must remain public |
| Protected user/merchant reads | Auth + tenant isolation |
| `POST /api/merchant/workspaces`, `POST /api/mcp` | Writes |
| Store/Campaign HTML | `revalidateTag` does not purge Cloudflare CDN; slug traffic can hit Neon |
| `/_next/image` | Not Worker-smoked; listed Vercel-required in B3.2 |

## 5. Route matrix

Verified against `cloudflare-router/worker.ts`, `next.config.js`, App Router segment config, and data adapters — not documentation alone.

Legend: **Slice** = first production slice YES/NO. **B3.2** = current staging classifier.

| Path family | Methods | Auth | R/W | Current runtime | Cacheable | DB | Blob | AI | Stripe | Middleware | SEO | Slice |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/`, `/:locale` | GET/HEAD | no | read | CF staging for locale roots; Vercel prod | HTML yes except `/` | no | no | no | no | `/` only | high | YES |
| `/:locale/blog`, posts, tags | GET/HEAD | no | read | B3.2 CF for `/blog` exact only; nested unknown→Vercel | force-static | no | no | no | no | no if localized | high | YES |
| `/:locale/face-shape-detector` and marketing landings | GET/HEAD | no | read | B3.2 CF for detector exact | force-static | no | no | no | no | no | high | YES |
| `/:locale/brand/:brand` | GET/HEAD | no | read | B3.2 unknown→Vercel | force-static curated | no when programmatic off | images may be remote | no | no | no | high | YES |
| `/:locale/category/*`, `/:locale/try/*` | GET/HEAD | no | read | Vercel 404 (`dynamicParams=false`, empty params) | n/a | Neon if opened on CF | no | no | no | no | mismatch risk | NO |
| `/:locale/store` hub | GET/HEAD | no | read | B3.2 CF | force-static | no | no | no | no | no | medium | YES |
| `/:locale/store/:slug`, `/:locale/c/...` | GET/HEAD | no | read | Vercel ISR 7d + tags | ISR | Neon admission | possible hero URLs | no | no | no | medium | NO |
| `GET /api/health` | GET/HEAD | no | read | B3.2 CF | no-store | no | no | no | no | no | none | YES |
| `GET /api/glasses/brands` | GET/HEAD | no | read | B3.2 CF | s-maxage 3600 | Neon (CF alias) | no | no | no | no | low | YES |
| `GET /api/glasses/categories\|face-shapes` | GET/HEAD | no | read | B3.2 unknown→Vercel; same `@/data/glasses` layer | s-maxage 3600 | Neon on CF build | no | no | no | no | low | YES |
| `GET /api/glasses/frames`, `/api/frames` | GET/HEAD | no | read | Vercel | s-maxage 3600 | Prisma on `/api/frames` | no | no | no | no | low | NO |
| `/_next/static/*` | GET/HEAD | no | read | hashed files in `.open-next/assets` | hashed-immutable | no | no | no | no | dotted skip | high | YES, **Static Asset** |
| favicon, `/images/*`, `/home/*`, `/experience-heroes/*`, other public files | GET/HEAD | no | read | files in `.open-next/assets` | deploy-public-asset (finite TTL) | no | no | no | no | dotted skip | high | YES, **Static Asset** |
| `/robots.txt`, `/llms.txt` | GET/HEAD | no | read | files in `.open-next/assets` | control-files | no | no | no | no | no | medium | YES, **Static Asset** |
| locale/SEO/blog/brand HTML | GET/HEAD | no | read | OpenNext `.cache`, **not** Static Assets | deploy-static-html | no | no | no | no | no if localized | high | YES, **Worker** |
| static sitemaps | GET/HEAD | no | read | OpenNext `.cache` only | static-sitemap | no | no | no | no | no | high | YES, **Worker** |
| `/_next/image` | GET | no | read | Vercel-required | optimizer | no | remote/Blob | no | no | no | high | NO |
| `/api/auth/*` | GET/POST | session | mixed | B3.2 CF | no | JWT/Neon adapter | no | no | no | no | none | NO |
| Protected history/balance/profile | GET | session | read | B3.2 CF | no | Neon | no | no | history read only | no | none | NO |
| Merchant/MCP writes | POST | session/bearer | write | B3.2 CF | no | Neon | no | no | no | no | none | NO |
| Payment/upload/AI/cron/admin/OAuth | * | varies | write | Vercel-required | no | Prisma | yes | yes | yes | admin JWT | none | NO |
| Unknown | * | n/a | n/a | unknown→Vercel | no | n/a | n/a | n/a | n/a | maybe | must 404 equivalently | Vercel |

Ambiguous routes default to Vercel.

## 6. Cache strategy

The previous B4.1 goal (“cache public traffic in front of the Worker so cache hits avoid the 100k quota”) is **incorrect**.

Current Cloudflare behavior:

- Requests that invoke a Worker count toward the Workers Free **100,000 requests/day** quota ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)).
- [Workers Caching](https://developers.cloudflare.com/workers/cache/) can skip Worker **CPU** on a hit, but the request is still billed at the standard Worker request rate. Enabling it can also bill otherwise-free Static Assets.
- [Static Assets](https://developers.cloudflare.com/workers/static-assets/) are free and unlimited **only** when served as Static Assets **without** invoking the Worker script. Default routing: exact asset match is served first; `run_worker_first` defaults to `false`.
- Next.js `force-static` HTML is **not** a Static Asset. OpenNext stores it under `.open-next/cache/*.cache` and serves it through the Worker.

Do not use one `immutable-static` policy for all public files. Filename content hashing is proven only for `/_next/static/*`.

| Class | Examples | Browser | CF / edge | Purge | Worker invoked? | Counts toward 100k? |
| --- | --- | --- | --- | --- | --- | --- |
| A `hashed-immutable` | `/_next/static/*` | `public, max-age=31536000, immutable` | Static Assets automatic cache | new hash | **No** if `run_worker_first=false` and file exists | **No** |
| B `deploy-public-asset` | favicon, `/images/*`, `/home/*`, `/experience-heroes/*`, `/blog-covers/*`, `/assets/*` | `public, max-age=3600, must-revalidate` | s-maxage=86400 | deploy + URL purge | **No** if asset exists | **No** |
| C `control-files` | `/robots.txt`, `/llms.txt` | `public, max-age=0, must-revalidate` | s-maxage=3600 | deploy + URL purge | **No** if asset exists | **No** |
| D `deploy-static-html` | `/:locale`, blog, brand, marketing HTML | `public, max-age=0, must-revalidate` | s-maxage=86400, SWR 7d | purge-by-URL on deploy | **Yes** (OpenNext) | **Yes** |
| E `static-sitemap` | `/sitemap.xml`, `/sitemaps/core.xml`, `/sitemaps/blog.xml` | `public, max-age=0, must-revalidate` | s-maxage=3600 | purge-by-URL on deploy | **Yes** (OpenNext cache) | **Yes** |
| root `/` | locale detect | private, no-store | bypass | n/a | **Yes** | **Yes** |
| catalog APIs | `/api/glasses/brands\|categories\|face-shapes` | max-age=0, s-maxage=3600 | 3600s | URL purge after catalog edit | **Yes** | **Yes** |
| health | `/api/health` | no-store | bypass | n/a | **Yes** | **Yes** |
| Store/Campaign (deferred) | keep Vercel ISR | n/a | n/a | `revalidateTag` | Worker only to proxy | **Yes** (proxy) |
| unknown | Vercel fallback | never store 5xx | bypass | n/a | Worker proxies | **Yes** (proxy) |

Do not cache responses that set `Set-Cookie`. Do not cache authenticated/private HTML. Ignore Cookie on first-slice GET cache keys. Do not mark non-hashed public files immutable for one year.

See `B4_CACHE_POLICIES` in `cloudflare-router/b4-production-public-slice.ts`.

### 6.1 OpenNext Static Asset audit (proven 2026-08-17)

Inspected `.open-next/assets` (291 files) and `.open-next/cache` after `opennextjs-cloudflare build`. Wrangler `assets.directory` is `.open-next/assets`. `run_worker_first` is explicitly `false`. Staging `GET /en` previously returned `x-visutry-router-backend` from `app-host-worker.ts`, which matches “no HTML file in assets → Worker invoked”.

| Path family | OpenNext output type | Static Asset exists | Worker invoked | Counts against 100k/day | Safe for B4.2 |
| --- | --- | --- | --- | --- | --- |
| `/_next/static/*` | copied hashed JS/CSS/fonts in `.open-next/assets/_next/static/` (147 files) | YES | NO (`run_worker_first=false`) | NO | YES |
| favicon | `.open-next/assets/favicon.ico`, `favicon.svg` | YES | NO | NO | YES |
| `public/*` images (`/images`, `/home`, `/experience-heroes`, `/blog-covers`, `/assets`, `og-image.jpg`) | copied into `.open-next/assets` | YES | NO | NO | YES |
| `/robots.txt` | `.open-next/assets/robots.txt` | YES | NO | NO | YES |
| `/llms.txt` | `.open-next/assets/llms.txt` | YES | NO | NO | YES |
| locale home HTML (`/en`, `/id`, …) | `.open-next/cache/.../en.cache` etc. | **NO** (0 locale HTML files in assets; only `google*.html`) | **YES** | **YES** | YES as Worker HTML, not as a free asset |
| static SEO HTML | OpenNext incremental cache | **NO** | **YES** | **YES** | YES as Worker HTML |
| blog HTML | OpenNext incremental cache | **NO** | **YES** | **YES** | YES as Worker HTML |
| brand HTML | OpenNext incremental cache | **NO** | **YES** | **YES** | YES as Worker HTML |
| static sitemap files | `.open-next/cache/.../sitemap.xml.cache`, `sitemaps/core.xml.cache`, `sitemaps/blog.xml.cache` | **NO** | **YES** | **YES** | YES as Worker sitemap |
| unknown / writes | n/a | NO | YES (Worker proxies to Vercel) | YES | keep Vercel; do not retry |

Do not assume HTML is a Static Asset because Next.js calls the route `force-static`. It is not in `.open-next/assets`.

## 7. SEO equivalence

Current production SEO is generated with `SITE_CONFIG.url` / `NEXT_PUBLIC_SITE_URL` default `https://www.visutry.com`. Canonicals and hreflang already use that host (`src/lib/seo.ts`, sitemaps).

| Concern | First-slice expectation |
| --- | --- |
| Status codes | Same 200/308/404 as Vercel for allowlisted static routes |
| Canonical / hreflang / OG | Absolute `www.visutry.com` URLs; do not let fallback `Host: visutry.vercel.app` leak into `Location` or metadata |
| robots.txt | Serve current `public/robots.txt` from CF assets |
| Sitemap | Static index/core/blog on CF; **dynamic sitemap stays Vercel** so merchant publish still updates via `revalidatePath` |
| Trailing slash | Next default (no trailing slash); classifier strips a single trailing slash for matching only |
| Locale-less redirects | Same 308 table in `next.config.js`; tested in `tests/unit/next-config-redirects.test.ts` |
| Query strings | Canonicals strip search (`discoveryCanonicalUrl`, SEO helpers). Cache key ignores query for first-slice HTML |
| Soft 404s | Curated unknown brands call `notFound()` when programmatic SEO is off. Cache 404 for 60s only |
| `/category/*`, `/try/*` | **Remain Vercel** so CF `dynamicParams=true` cannot start serving/caching slugs that Vercel currently 404s |
| Store/Campaign | Remain Vercel so unknown slugs keep admission `notFound()` + ISR behavior |

B4.2 must smoke on workers.dev before DNS: `/en`, `/en/brand/warby-parker`, unknown brand 404, `/en/blog`, locale-less `/blog` 308, `/en/store` 200, `/en/store/{unknown}` still Vercel 404.

## 8. Auth / cookie considerations

First slice includes **no** authenticated routes.

Production cookies: NextAuth JWT (`session.strategy = 'jwt'`), no explicit `domain` override, so cookies are host-only for `www.visutry.com`. `NEXTAUTH_URL` must remain `https://www.visutry.com`. Auth0 callbacks already use that host. **B4.1 does not change Auth0.**

If `www` is later Cloudflare-fronted while auth stays on Vercel:

- The Worker must forward Cookie / Authorization / body and preserve `Set-Cookie`.
- Fallback must not rewrite the public host to `visutry.vercel.app` in redirects.
- Do not CDN-cache auth responses.

Staging required Auth on CF because `workers.dev` and Vercel preview are different origins. Production same-host `www` can keep auth on Vercel for B4.2.

Prerequisite for B4.2 DNS: prove one signed-in request through `www` → Worker → Vercel auth still sets `www` cookies. If that fails, do not expand the slice; keep auth on Vercel and fix forwarded host before any auth cutover.

## 9. DNS / custom-domain plan

**Do not apply this in B4.1.** Production nameservers, www records, and Vercel domains stay unchanged.

Observed now (read-only):

| Record | Current |
| --- | --- |
| NS `visutry.com` | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` |
| `www.visutry.com` A | Vercel anycast (`64.29.17.1`, `216.198.79.65`) |
| `visutry.com` A | Vercel anycast |
| Vercel domains | `www.visutry.com`, `visutry.com`, `visutry.vercel.app`, git/alias hosts |

Documented constraints for B4.2 (not executed here):

- A Worker Custom Domain requires an **active Cloudflare zone**.
- Current nameservers are still **Vercel**. B4.2 therefore needs a deliberate nameserver/DNS migration window **before** Custom Domain activation.
- Existing `www` DNS records (Vercel A/anycast) **conflict** with adding a Worker Custom Domain and must be resolved in that window.
- Fallback origin must remain `https://visutry.vercel.app` (or another origin that cannot loop back through `www.visutry.com`).

Cloudflare is **not** the authoritative DNS today.

**Chosen architecture (Option A, safest long-term):**

1. Create a Cloudflare zone for `visutry.com` and copy records (DNS-only / grey cloud first).
2. Change nameservers from Vercel to Cloudflare only during B4.2, after a written rollback.
3. Keep `visutry.vercel.app` on Vercel DNS. Never attach that hostname to the production Worker.
4. Bind the production Worker with a **Custom Domain** on `www.visutry.com` only (`custom_domain: true`). Do not bind the apex in the first cutover.
5. Apex `visutry.com`: Cloudflare Redirect Rule to `https://www.visutry.com` (proxied placeholder record). Today both apex and www hit Vercel; apex redirect must be explicit so the Worker is not skipped.
6. SSL/TLS: **Full (strict)**. Custom Domain issues the edge certificate. Origin `visutry.vercel.app` already has a valid Vercel certificate.
7. Rollback: remove the Worker custom domain and restore www to Vercel A/CNAME. Expected time: minutes. No application deploy required.

Option B (Worker custom domain without NS move) still needs a CNAME at Vercel DNS pointing at Cloudflare, plus SSL DCV. It is more brittle with Vercel-authoritative DNS. Prefer Option A.

**Loop prevention:** the Worker must `fetch` `https://visutry.vercel.app{path}{search}` (or a grey-cloud `origin.visutry.com` CNAME to `cname.vercel-dns.com`). It must **never** `fetch` `https://www.visutry.com/...`. `visutry.vercel.app` is outside the `visutry.com` zone, so it cannot enter the same Worker.

Send `X-Forwarded-Host: www.visutry.com` and `X-Forwarded-Proto: https`. Rewrite only the transport `Host` to the origin host. If Vercel emits `Location: https://visutry.vercel.app/...`, the Worker must rewrite it back to `www.visutry.com` before returning to the client.

## 10. Vercel fallback origin

```text
browser
  → www.visutry.com (Cloudflare; B4.2 only)
    → Static Assets exact match? serve, no Worker
    → else Worker classifyB4ProductionPublicSlice
      → CF OpenNext runtime         (HTML, APIs, redirects, sitemaps)
      → https://visutry.vercel.app  (everything else)
```

Preserve method, path, query, body, cookies, Authorization, application headers, status, response headers, streaming. `redirect: 'manual'`. **No automatic CF→Vercel retry. No dual execution. No dual write.** Unknown and writes default to Vercel unless explicitly allowlisted (none in first slice).

Current staging origin `https://visutry-3v81kow8o-sunye.vercel.app` is Preview-only and must not be used for production fallback.

## 11. Cloudflare Free budget

Count **two numbers**. Do not use total site traffic, ISR 8KB units, or FOT as the Worker request estimate.

| Meter | Rule | First-slice |
| --- | --- | --- |
| **Static Asset requests** | Free and unlimited **if** the Worker is not invoked (`run_worker_first=false` and exact file in `.open-next/assets`) | `/_next/static/*`, favicon, public images, `robots.txt`, `llms.txt` |
| **Worker invocations** | Hard target **< 100,000/day**. Operational warning **< 70,000/day**. Error 1027 after the hard limit. | HTML, sitemaps, `/`, locale-less 308s, health, catalog APIs, and **all Vercel fallback/proxy** traffic |
| Worker gzip | 2780.44 KiB dry-run (2777.11 KiB last staging); classifier not in the bundle | SAFE |
| 3072 KiB hard limit | PR #92 | SAFE |
| 10 ms CPU / invocation | HTML from OpenNext cache; catalog miss hits Neon | SAFE for cached HTML; catalog miss is the CPU risk |

Workers Caching does **not** reduce the request meter. It only skips CPU on a hit and can bill Static Assets that would otherwise be free. Do not enable it for quota relief.

**Which first-slice routes invoke the Worker (proven):** locale homes, SEO/blog/brand HTML, static sitemaps, `/`, locale-less redirects, `GET /api/health`, catalog list APIs, and any non-asset fallback to Vercel.

**Which first-slice routes do not (proven, given current wrangler):** `/_next/static/*`, favicon, public image prefixes present in assets, `robots.txt`, `llms.txt`.

Estimated Worker requests/day cannot be a 1:1 of “all www hits”. A typical HTML view is **one Worker request** plus many free Static Asset subresources. Production HTML/API/fallback volume is **not logged as Worker invocations today**, so the quota result is **WARNING**, not SAFE. If 24h Worker invocations trend above **70,000**, halt expansion. If they would exceed **100,000**, do not cut over www.

Do not recommend Paid solely from this correction. Keep more paths on Vercel rather than turning on `run_worker_first` or Workers Caching.

## 12. Observability

Log JSON only:

`timestamp, method, sanitized path template, routeClass, backend, status, latencyMs, error name, Worker CPU if available`

Do not log cookies, Authorization, tokens, bodies, personal data, images, or secrets. Current staging logs path/backend/class/status/latency; B4.2 should add method, error category, and path templating (`/:locale/brand/:brand` not raw slugs if they can be PII — brand slugs are public).

Rollback triggers: 5xx spike, 404 spike vs baseline, redirect loop (`Location` bouncing www↔vercel.app), auth cookie failures on fallback, Store/Campaign mismatch (should still be Vercel), Worker CPU pressure, Worker request quota >70k/day, Vercel fallback 502.

## 13. Rollback

Primary (minutes, no app change): remove `www.visutry.com` Worker custom domain; restore Vercel DNS for www. Apex redirect back to previous Vercel records if changed.

Secondary: set production router to Vercel-only (every path `unknown-fallback` / `vercel-required`) and redeploy the Worker if DNS must stay on Cloudflare briefly.

First slice is read-only. **No data repair.**

Expected rollback time: **5–15 minutes**.

## 14. Cutover procedure (B4.2 — do not execute here)

1. Implement `classifyB4ProductionPublicSlice` in the production router path (staging can keep B3.2 or run a parallel workers.dev smoke).
2. Smoke expanded public routes on `visutry-cf-staging.sunye.workers.dev` (no production DNS).
3. Confirm gzip < 3072 KiB and wrangler still has no production route until the DNS window.
4. Create Cloudflare zone / copy DNS grey-cloud.
5. Add production env: `VERCEL_ORIGIN=https://visutry.vercel.app`, `NEXTAUTH_URL=https://www.visutry.com`.
6. Keep `run_worker_first: false`. Confirm hashed/public/control files skip the Worker (no `x-visutry-router-backend`). Do **not** enable Workers Caching as a 100k-quota offload.
7. Bind Custom Domain `www.visutry.com` only after the nameserver/DNS window (this is the traffic move).
8. Watch 30 min / 2h / 6h / 24h **Worker invocation** count separately from Static Asset traffic.
9. If any rollback trigger fires, run section 13.

## 15. Validation checklist

B4.1 (this PR):

- [x] Proposed classifier + tests (not activated)
- [x] Manifest for B4.2
- [x] npm ci / typecheck / lint / critical / quota / router / build:ci / CF dry-run (recorded in the PR)

B4.2 pre-DNS smoke (workers.dev):

- [ ] `GET /en` 200 CF
- [ ] `GET /en/brand/warby-parker` 200 CF (not Vercel unknown-fallback)
- [ ] unknown brand 404, no soft 200
- [ ] `GET /en/store/:unknown` still Vercel 404
- [ ] `GET /api/glasses/brands` 200 CF
- [ ] unknown GET/POST → Vercel
- [ ] POST `/en` → Vercel
- [ ] `/_next/image` → Vercel
- [ ] no retry on CF 502

## 16. B4.2 GO / NO-GO

**GO** for implementing the public slice on staging (`workers.dev`) with asset-first routing. Invocation families are proven from OpenNext output. Production www Custom Domain remains a later, planned DNS window.

B4.2 must clear before DNS:

1. workers.dev smoke of the **expanded** public classifier (brand/blog/static HTML on CF runtime).
2. Prove Static Assets skip the Worker for `/_next/static/*`, favicon, `robots.txt` (`run_worker_first` stays `false`; do not enable Workers Caching for quota).
3. Measure Worker invocations (HTML + APIs + redirects + Vercel proxy) against the 70k warning / 100k hard limit. Do not use total site traffic.
4. Fallback origin `visutry.vercel.app` with host/Location rewrite proven (no loop, no vercel.app canonical leak).
5. Nameserver/Custom Domain runbook executed only in a planned window, with existing www record conflicts resolved and the section 13 rollback staged.

Not blockers: Auth0 production changes, Store/Campaign on CF, `_next/image` on CF, Paid plan.

Classification NO-GO would apply if first-slice Worker vs Static Asset invocation could not be proven. That is proven. Volume remains **WARNING**.
