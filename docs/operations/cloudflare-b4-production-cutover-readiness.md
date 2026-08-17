# VisuTry Cloudflare B4.1 Production Cutover Readiness

**Status:** PASS — readiness plan and proposed first public slice are recorded. Production traffic was not moved.  
**Date:** 2026-08-17  
**Owner:** Product / Engineering  
**Baseline:** `origin/main` `b3794161d0bb4d2c7e928d5cf5ba39887b2e86be` (PR #92 merge)

This document is the B4.2 implementation plan. It does **not** cut over production, change DNS, bind `www.visutry.com`, or deploy a production Worker route.

Related:

- [`ADR-010-hybrid-edge-architecture-for-store-campaign-scale.md`](../decisions/ADR-010-hybrid-edge-architecture-for-store-campaign-scale.md) (not rewritten)
- [`cloudflare-b3-2-capability-routing.md`](./cloudflare-b3-2-capability-routing.md)
- [`vercel-quota-emergency-reduction.md`](./vercel-quota-emergency-reduction.md) (PR #91)
- Proposed classifier: `cloudflare-router/b4-production-public-slice.ts`
- Review manifest: `cloudflare-router/b4-production-public-slice.manifest.json`

## 1. Status

| Item | Value |
| --- | --- |
| B4.1 result | PASS |
| B4.2 GO / NO-GO | **GO** after a workers.dev smoke of this public slice; DNS cutover is a later B4.2 action |
| Production DNS changed | NO |
| Production Worker route bound | NO |
| Authenticated traffic in first slice | NO |
| Live staging classifier changed | NO (`cloudflare-router/worker.ts` remains B3.2) |

Last proven staging Worker: `a84743e9-90ab-404e-b372-5a6234d634af`, gzip **2777.11 KiB** / 3072 KiB.

B4.1 wrangler staging dry-run on this branch (classifier not wired into the Worker): **2782.77 KiB** gzip. The delta versus 2777.11 KiB is OpenNext/Next generated-artifact noise, not a new production route graph. Still below 3072 KiB.

## 2. Architecture baseline

Unchanged from ADR-010:

> Cloudflare = traffic-scale edge; Vercel/backend = compute/integration-heavy capabilities; Neon = relational source of truth.

Current production host is Vercel. `www.visutry.com` and `visutry.com` are Vercel project domains. Public DNS nameservers are `ns1.vercel-dns.com` / `ns2.vercel-dns.com`. `wrangler.jsonc` is staging `workers_dev` only: no `routes`, no zone, no `visutry.com`.

B3.2 same-host staging routing already passed (PR #92). That proves cookie/header forwarding and Vercel fallback. It does **not** prove that every B3.2 `cf-ready` route should enter the first production slice.

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
| `/_next/static/*`, favicon, public files | GET/HEAD | no | read | B3.2 CF for static+favicon only | immutable | no | no | no | no | dotted skip | high | YES |
| `/_next/image` | GET | no | read | Vercel-required | optimizer | no | remote/Blob | no | no | no | high | NO |
| `/api/auth/*` | GET/POST | session | mixed | B3.2 CF | no | JWT/Neon adapter | no | no | no | no | none | NO |
| Protected history/balance/profile | GET | session | read | B3.2 CF | no | Neon | no | no | history read only | no | none | NO |
| Merchant/MCP writes | POST | session/bearer | write | B3.2 CF | no | Neon | no | no | no | no | none | NO |
| Payment/upload/AI/cron/admin/OAuth | * | varies | write | Vercel-required | no | Prisma | yes | yes | yes | admin JWT | none | NO |
| Unknown | * | n/a | n/a | unknown→Vercel | no | n/a | n/a | n/a | n/a | maybe | must 404 equivalently | Vercel |

Ambiguous routes default to Vercel.

## 6. Cache strategy

Cloudflare Free **100k Worker requests/day** makes zone cache in front of the Worker (Worker-as-origin) a B4.2 requirement. Cache hits must not invoke the Worker.

| Class | Browser | CF TTL | Cache key | Query | Cookie | Auth | Stale | Purge | 404 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A immutable static | 1y immutable | 1y | host+path, ignore query/cookie | ignore | do not vary | bypass if `Authorization` | n/a | new hash | 60s |
| B deploy-time HTML | max-age=0 | 1d + SWR 7d | host+path, ignore query/cookie | ignore | do not vary (UserMenu is client) | bypass if `Authorization` | SWR 7d | purge-by-URL on deploy | 60s; never cache 5xx |
| C catalog APIs | max-age=0, s-maxage=3600, SWR 1d | 3600s | host+path | ignore | do not vary | bypass if `Authorization` | 1d | URL purge after catalog edit if needed | n/a |
| D Store landing (deferred) | keep Vercel ISR | n/a | n/a | n/a | n/a | n/a | 7d safety TTL | `revalidateTag` | admission 404 |
| E Campaign landing (deferred) | keep Vercel ISR | n/a | n/a | n/a | n/a | n/a | 7d safety TTL | `revalidateTag` | admission 404 |
| F unknown/404 | do not store 5xx | 404 60s only if CF served | path | forward to Vercel | forward, never store | forward, never store | none | n/a | Vercel `notFound()` |
| `/` | private | **bypass** | n/a | ignore | n/a | n/a | none | n/a | n/a |
| health | no-store | bypass | n/a | ignore | n/a | n/a | none | n/a | n/a |

Do not cache responses that set `Set-Cookie`. Do not cache authenticated/private HTML. Do not let Cookie variants poison public cache: **ignore Cookie on first-slice GET cache keys**.

See `B4_CACHE_POLICIES` in `cloudflare-router/b4-production-public-slice.ts`.

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

**Do not apply this in B4.1.**

Observed now (read-only):

| Record | Current |
| --- | --- |
| NS `visutry.com` | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` |
| `www.visutry.com` A | Vercel anycast (`64.29.17.1`, `216.198.79.65`) |
| `visutry.com` A | Vercel anycast |
| Vercel domains | `www.visutry.com`, `visutry.com`, `visutry.vercel.app`, git/alias hosts |

Cloudflare is **not** the authoritative DNS today. A Worker Custom Domain requires a Cloudflare zone.

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
  → www.visutry.com (Cloudflare Worker custom domain; B4.2 only)
    → classifyB4ProductionPublicSlice
      → CF OpenNext / ASSETS        (first slice GET/HEAD)
      → https://visutry.vercel.app  (everything else)
```

Preserve method, path, query, body, cookies, Authorization, application headers, status, response headers, streaming. `redirect: 'manual'`. **No automatic CF→Vercel retry. No dual execution. No dual write.** Unknown and writes default to Vercel unless explicitly allowlisted (none in first slice).

Current staging origin `https://visutry-3v81kow8o-sunye.vercel.app` is Preview-only and must not be used for production fallback.

## 11. Cloudflare Free budget

| Constraint | Evidence | First-slice |
| --- | --- | --- |
| Worker gzip | 2782.77 KiB dry-run (2777.11 KiB last staging); classifier not in the bundle | SAFE |
| 3072 KiB hard limit | PR #92 | SAFE |
| 10 ms CPU / invocation | Static HTML/assets; cached catalog | SAFE if cache hits; catalog miss hits Neon |
| 100,000 Worker requests/day | PR #91 Hobby: ~1.2M ISR **8KB units**/day and ~10.42 GB FOT — not 1:1 with requests | **WARNING** |

Without CDN cache, one HTML page + hashed assets can consume many Worker invocations per view and exhaust 100k quickly. With Worker-as-origin cache, invocations track misses and uncached `/` + health + fallback proxying.

Projected first-slice volume: **WARNING**, not BLOCKED, if B4.2 enables cache hits and monitors the 100k meter from minute 0. Do not recommend Paid. If the 24h Worker request rate trends above ~70k, halt expansion and keep more paths on Vercel.

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
6. Enable Worker-as-origin cache rules for classes A–C.
7. Bind Custom Domain `www.visutry.com` (this is the traffic move).
8. Watch 30 min / 2h / 6h / 24h metrics.
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

**GO** for implementing the public slice on staging and then a controlled www Custom Domain cutover, with these blockers that B4.2 must clear first:

1. workers.dev smoke of the **expanded** public classifier (brand/blog/static HTML on CF runtime).
2. Worker-as-origin CDN cache rules (Free 100k request budget).
3. Fallback origin `visutry.vercel.app` with host/Location rewrite proven (no loop, no vercel.app canonical leak).
4. Nameserver/Custom Domain runbook executed only in a planned window, with the section 13 rollback staged.

Not blockers: Auth0 production changes, Store/Campaign on CF, `_next/image` on CF, Paid plan.
