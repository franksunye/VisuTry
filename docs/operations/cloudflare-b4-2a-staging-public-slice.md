# VisuTry Cloudflare B4.2A — Staging Public Slice Activation

**Status:** PASS — B4 first public slice is wired and smoked on Cloudflare staging only.

**Date:** 2026-08-18

**Owner:** Product / Engineering

**Production DNS changed:** NO  
**www.visutry.com bound:** NO  
**Production traffic moved:** NO  
**Production Auth0 modified:** NO  
**Merged:** NO

This document is the B4.2A evidence pack and the B4.2B production cutover gate. It does **not** execute production cutover.

Related:

- [`hosting-strategy-vercel-cloudflare.md`](./hosting-strategy-vercel-cloudflare.md) — canonical three-layer model
- [`cloudflare-b4-production-cutover-readiness.md`](./cloudflare-b4-production-cutover-readiness.md) — B4.1 readiness (classifier proposed, not wired)
- [`cloudflare-b3-2-capability-routing.md`](./cloudflare-b3-2-capability-routing.md)
- [`ADR-010-hybrid-edge-architecture-for-store-campaign-scale.md`](../decisions/ADR-010-hybrid-edge-architecture-for-store-campaign-scale.md) (not rewritten)

## 1. Baseline

| Item | Value |
| --- | --- |
| `origin/main` | `cf01a625c828376e57464fd4969de1d5217dd14a` |
| PR #91 | Merged (Vercel ISR / Fast Origin Transfer reductions) |
| PR #92 | Merged (B3.2 hybrid capability routing) |
| PR #93 | Merged at the SHA above (B4.1 readiness, three-layer model, public-slice classifier, corrected Free quota) |
| Branch | `cursor/cloudflare-b4-2a-staging-activation` |
| Live B3.2 `classify()` | Unchanged in `cloudflare-router/worker.ts` |
| Staging entry | Root `wrangler.jsonc` → `cloudflare-router/app-host-worker.ts` → Worker `visutry-cf-staging` |
| Leftover B3.2 router Worker | `cloudflare-router/wrangler.jsonc` (`visutry-cf-staging-router`) — **do not deploy** |

Confirmed on main before wiring:

- `cloudflare-router/b4-production-public-slice.ts`
- `cloudflare-router/b4-production-public-slice.manifest.json`
- Three-layer model in hosting strategy
- `assets.run_worker_first = false`
- `assets.not_found_handling = "none"`
- No production `routes`, no `custom_domain`, no `www.visutry.com`

Canonical execution order is unchanged:

> Static Asset → Worker only if necessary → Backend only if necessary

## 2. Activated staging classifier

`classifyB4ProductionPublicSlice()` is now used by staging via `classifyStagingPublicSlice()` in `cloudflare-router/b4-staging-router.ts`.

Preserved B3.2 invariants:

- UNKNOWN → Vercel
- unsupported → Vercel
- writes → Vercel (none in the first slice)
- no automatic retry
- no dual execution
- no dual write
- one authoritative runtime per capability

The route graph was not expanded beyond the B4.1 manifest. Store detail, Campaign, `/category/*`, `/try/*`, `/sitemaps/dynamic.xml`, auth, `_next/image`, Stripe, Blob, AI, cron, admin, and MCP stay Vercel.

Staging Wrangler vars (staging env only):

| Var | Value |
| --- | --- |
| `ROUTER_ENV` | `staging` |
| `NEXTAUTH_URL` | `https://visutry-cf-staging.sunye.workers.dev` |
| `VERCEL_ORIGIN` | `https://visutry.vercel.app` |
| `PUBLIC_HOST` | `visutry-cf-staging.sunye.workers.dev` |
| `workers_dev` | `true` |

Preview origin `https://visutry-3v81kow8o-sunye.vercel.app` is no longer the staging fallback. That preview emitted `visutry-pre.vercel.app` canonicals. Production fallback must stay `visutry.vercel.app`.

## 3. Three-layer proof

| Layer | What ran | Worker invoked | Vercel invoked | Result |
| --- | --- | --- | --- | --- |
| 1 Static Assets | exact files in `.open-next/assets` | NO | NO | PASS |
| 2 Worker | approved HTML, locale-less 308, public APIs | YES | NO | PASS |
| 3 Vercel | deferred / unknown / writes / `_next/image` / auth | YES (router only) | YES | PASS |

Layer 3 still enters the Worker on this staging hostname because `workers.dev` is a Worker origin. That is the production quota warning: if `www` is a Worker Custom Domain, fallback traffic counts against the 100k/day Worker request meter.

## 4. Layer 1 asset evidence

`run_worker_first` remains `false`. Exact Static Asset hits on staging:

| Path | Status | `x-visutry-router-*` | Worker log |
| --- | --- | --- | --- |
| `/_next/static/chunks/main-app-4fd2f92a2ef1d6f6.js` | 200 | absent | absent |
| `/robots.txt` | 200 | absent | absent |
| `/llms.txt` | 200 | absent | absent |
| `/images/seo/core/common-face-shapes-guide.webp` | 200 | absent | absent |
| `/home/Alex-try-on-glasses-screen.jpg` | 200 | absent | absent |
| `/experience-heroes/editorial-eyewear.jpg` | 200 | absent | absent |

Evidence stack:

1. Wrangler `assets.directory = ".open-next/assets"` and `run_worker_first = false`
2. Files exist in the OpenNext asset output
3. Response has no router headers (Worker `withB4RouterHeaders` did not run)
4. `wrangler tail` during smoke had **no** `robots.txt` / `llms.txt` / hashed JS / `/images` / `/home` events

If a Layer 1 path *does* enter the Worker (missing hashed file, `not_found_handling: none` fallthrough), telemetry sets `unexpectedWorkerInvocation: true` and `layer: layer1-static-asset`. Observed once for a missing `/_next/static/*` 404. Exact present files do not produce a router log. Do not fabricate Layer 1 success logs.

Layer 1 is the Free-plan quota offload. Do not set `run_worker_first: true`. Do not enable Workers Caching as a 100k-quota strategy.

## 5. Layer 2 smoke matrix

Staging URL: `https://visutry-cf-staging.sunye.workers.dev`  
Worker version: `98807822-7bbe-4c52-a83d-0b6f3bbdf589`  
gzip: **2781.21 KiB** / 3072 KiB

### HTML (Worker, `cf-ready`, canonical `https://www.visutry.com/...`, no `vercel.app` in body)

| Path | Status | hreflang | Notes |
| --- | --- | --- | --- |
| `/` | 200 after locale 307 | 10 | cache bypass / locale detect |
| `/en` | 200 | 10 | |
| `/en/brand/warby-parker` | 200 | 2 | curated brand |
| `/en/blog` | 200 | 10 | |
| `/en/store` | 200 | 0 | hub only |
| `/en/face-shapes/oval` | 200 | 2 | SEO |
| `/en/glasses-guide` | 200 | 10 | |
| `/en/try-on/glasses` | 200 | 0 | landing, not `/try/:slug` |

### Redirects (no-follow)

| Path | Status | Location | Loop | vercel.app |
| --- | --- | --- | --- | --- |
| `/blog` | 308 | `/en/blog` | no | no |
| `/brand/warby-parker` | 308 | `/en/brand/warby-parker` | no | no |
| `/glasses-guide` | 308 | `/en/glasses-guide` | no | no |
| `/face-shape-detector` | 308 | `/en/face-shape-detector` | no | no |
| `/store` | 308 | `/en/store` | no | no |
| `/blog/` | 308 | `/blog` | no (second hop is the locale-less 308) | no |
| `/en/` | 308 | `/en` | no | no |

HEAD matches GET for these 308s.

### Public APIs

| Request | Status | Backend | Prisma WASM | Vercel fallback |
| --- | --- | --- | --- | --- |
| GET/HEAD `/api/health` | 200 | Cloudflare | no | no |
| GET/HEAD `/api/glasses/brands` | 200 | Cloudflare | no | no |
| GET/HEAD `/api/glasses/categories` | 200 | Cloudflare | no | no |
| GET/HEAD `/api/glasses/face-shapes` | 200 | Cloudflare | no | no |

## 6. Layer 3 fallback matrix

Fallback origin after B4.2A: `https://visutry.vercel.app`.

| Path | Class | Status | Canonical | Loop |
| --- | --- | --- | --- | --- |
| `/en/store/luna-optical` | unknown-fallback | 404 (same as production www) | `https://www.visutry.com/en` | no |
| `/en/c/luna-optical/petite-fit` | unknown-fallback | 404 (same as production www) | `https://www.visutry.com/en` | no |
| `/en/category/test` | unknown-fallback | 404 | n/a | no |
| `/en/try/test` | unknown-fallback | 404 | n/a | no |
| `/sitemaps/dynamic.xml` | unknown-fallback | 200 | n/a | no |
| `/api/glasses/frames` | unknown-fallback | 200 | n/a | no |
| `/api/unknown-capability` | unknown-fallback | 404 | n/a | no |
| `/en/discover` | unknown-fallback | 200 | `https://www.visutry.com/en/discover` | no |
| `/_next/image?...` | vercel-required | 200 | n/a | no |
| POST `/api/unknown-write` | unknown-fallback | 404 | n/a | no |
| POST `/en` | unknown-fallback | 405 | n/a | no |
| POST `/api/payment/create-session` | vercel-required | 401 | n/a | no |
| GET `/api/auth/session` | vercel-required | 200 | n/a | no |

No CF→Vercel retry. No dual execution. No payment/AI/Blob/Store/Campaign mutation. Empty POST to payment rejected with 401 before business execution.

## 7. SEO parity

| Check | Layer 2 (CF) | Layer 3 (Vercel via Worker) |
| --- | --- | --- |
| Canonical host | `www.visutry.com` | `www.visutry.com` |
| `vercel.app` in HTML | no | no |
| Unknown curated brand `/en/brand/not-a-real-brand-xyz-123` | 404, canonical `/en` | n/a |
| Unknown store slug | n/a | 404, same semantic status as production www |
| Locale-less 308 | relative `Location`, no loop | n/a |
| Soft 200 on unknown brand | no | n/a |
| Cloudflare-opened dynamic Store/Campaign slug | no | still Vercel 404 |

hreflang is present on locale home, blog, glasses-guide, and several SEO pages. Store hub HTML did not emit hreflang in this smoke; that matches current page metadata, not a router rewrite.

## 8. Forwarded-host proof

`fallbackRequest()` sets:

- `Host` = `visutry.vercel.app`
- `x-forwarded-host` = incoming host (`visutry-cf-staging.sunye.workers.dev` on staging; `www.visutry.com` after production cutover)
- `x-forwarded-proto` = `https`
- `redirect: 'manual'`
- Cookie, Authorization, query, and body preserved

`rewriteFallbackLocation()` rewrites `visutry.vercel.app`, `visutry-pre.vercel.app`, and other `visutry*.vercel.app` hosts back to `PUBLIC_HOST`. Relative `Location` values are left unchanged.

Observed on staging → `visutry.vercel.app`:

- Layer 3 HTML canonicals stay `https://www.visutry.com/...` (production `NEXT_PUBLIC_SITE_URL`)
- no `Location: https://visutry.vercel.app/...` leakage
- no www↔vercel.app bounce
- GET `/api/auth/session` returned `Set-Cookie: __Secure-next-auth.callback-url=...; Path=/; HttpOnly; Secure; SameSite=...` (host-only; value not logged)
- workers.dev cannot share production www cookies; first slice excludes auth by design

Public semantic host for production remains `www.visutry.com`. Staging-equivalent public host is `visutry-cf-staging.sunye.workers.dev` for Location rewrite only.

## 9. Worker invocation model

Router JSON logs (no Cookie, Authorization, body, email, tokens, image data, or secrets):

`timestamp, method, sanitized route, routeClass, layer, backend, invocation, status, latencyMs, error`

Layers:

- `layer1-static-asset` — only if a classified asset unexpectedly hits the Worker
- `layer2-worker` — CF HTML / redirect / public API
- `layer3-vercel` — fallback proxy; **counts as a Worker request**

Exact Layer 1 hits produce **no** router log. That is correct.

## 10. Free-plan budget assessment

| Meter | Staging proof | Production estimate |
| --- | --- | --- |
| Layer 1 Static Asset requests | Do not invoke Worker | Free if asset-first is preserved |
| Layer 2 Worker | HTML + 308 + public APIs | UNKNOWN — requires live cutover telemetry |
| Layer 3 router | Enters Worker before Vercel on this hostname | UNKNOWN — counts against 100k/day if www is fully Worker-fronted |
| Combined Worker /day | Not a production sample | **UNKNOWN** |
| 70k/day warning | n/a | halt expansion |
| 100k/day hard limit | n/a | Error 1027; rollback before 90k projected pace |
| gzip | 2781.21 KiB | SAFE |

Do not fabricate a production Worker request count from ISR units, Fast Origin Transfer, or “all www hits”. A typical HTML view is one Layer 2 Worker request plus many free Layer 1 subresources, plus any Layer 3 `/_next/image` / auth / unknown crawler paths **if those enter the Worker**.

**Budget result: WARNING** (volume unproven). Classification is SAFE. Bundle is SAFE.

Conservative B4.2B ramp: start with scoped Worker routes (section 12), watch Worker invocations at T+30m / 2h / 6h / 24h, halt at 70k projected pace, strongly consider rollback at 80k, rollback before 90k. Do not wait for 100k / Error 1027.

## 11. Production DNS inventory

Read-only, 2026-08-18. **No records were changed.**

Authoritative nameservers: `ns1.vercel-dns.com`, `ns2.vercel-dns.com`. Cloudflare is not the zone owner today.

| Name | Type | Current value | Future CF value (proposed, not applied) | Proxy | TTL observed | Migration risk |
| --- | --- | --- | --- | --- | --- | --- |
| `visutry.com` | NS | Vercel | Cloudflare assigned NS | n/a | SOA refresh 43200 / minimum 600 | High — this is the cutover |
| `visutry.com` | A | Vercel anycast `64.29.17.1`, `216.198.79.65` | Proxied placeholder `192.0.2.0` **or** keep Vercel origin until apex redirect is live | Proxied only for CF redirect | not fully exported | Apex must 301/308 to `https://www.visutry.com` |
| `www.visutry.com` | A | Vercel anycast `64.29.17.1`, `216.198.79.1` | **CNAME `cname.vercel-dns.com` orange-cloud** (scoped Worker routes). Do **not** Custom Domain the first cutover | Proxied | not fully exported | High if Custom Domain; medium if routes + Vercel origin |
| `visutry.com` | MX | `5 mxbiz1.qq.com`, `10 mxbiz2.qq.com` | identical | **DNS only** | not fully exported | Mail outage if proxied or dropped |
| `visutry.com` | TXT | `v=spf1 include:spf.mail.qq.com ~all` | identical | DNS only | 60s | SPF fail |
| `_dmarc.visutry.com` | TXT | `v=DMARC1; p=none;` | identical | DNS only | not fully exported | Low |
| `visutry.com` | CAA | letsencrypt, sectigo, pki.goog | identical + Cloudflare CAA if required for Universal SSL | DNS only | not fully exported | TLS issuance |
| `auth.visutry.com` | CNAME | Auth0 `dev-ho4e6glpvc4ux5uw-cd-cobhapsbopdfpybl.edge.tenants.us.auth0.com` | identical | **DNS only** | not fully exported | **Auth0 login break if proxied or rewritten** |
| `resend._domainkey.visutry.com` | TXT | Resend DKIM public key | identical | DNS only | not fully exported | Transactional mail |
| `visutry.vercel.app` | — | Vercel platform DNS (outside this zone) | unchanged; fallback origin | n/a | n/a | Loop if www Worker fetches www |

Public dig did not find Tencent/QQ DKIM selectors. Vercel DNS returns A records for arbitrary unused subdomains (`api`, `cdn`, `mail`, …). Those are **not** real hosts to copy as Cloudflare records. Export the full Vercel zone before any NS move and copy only real records (MX, TXT, CAA, `auth`, DKIM, verification).

Must preserve on NS move: MX, SPF, DMARC, CAA, Auth0 `auth.visutry.com` (grey cloud), Resend DKIM, any Google/Vercel verification TXT found in the zone export.

## 12. Recommended B4.2B routing architecture

**Recommendation: scoped Worker routes (Option B). Do not bind `www.visutry.com` as a Worker Custom Domain for the first production cutover.**

Cloudflare Custom Domains “[point all paths of a domain or subdomain to your Worker](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)”. Combined with `run_worker_first=false`, exact Static Assets still skip the Worker, but **every other request** — including Layer 3 `/_next/image`, auth, Store/Campaign, unknown crawler paths — invokes the Worker and counts toward 100k/day.

Worker [routes](https://developers.cloudflare.com/workers/configuration/routing/routes/) attach path patterns on a zone. Unmatched proxied requests go to the DNS origin (Vercel) **without** a Worker invocation. More-specific routes take precedence; a route with Worker = None can exclude a prefix.

Proposed production model (not applied):

1. Cloudflare zone for `visutry.com`; copy DNS grey-cloud first; NS cutover in a planned window.
2. `www` orange-cloud CNAME to Vercel (`cname.vercel-dns.com` / current Vercel target). Vercel remains origin for unmatched paths.
3. Worker routes **allowlist** Layer 1 prefixes (`/_next/static*`, `/images*`, `/home*`, `/experience-heroes*`, `/blog-covers*`, `/assets*`, `/robots.txt`, `/llms.txt`, favicon) so Static Assets stay free and off Vercel FOT.
4. Worker routes allowlist Layer 2 HTML/API/sitemap/locale-less prefixes. Do not use a single `www.visutry.com/*` Custom Domain.
5. Exclude high-volume Layer 3 prefixes from the Worker (`/_next/image*`, `/api/auth*`, `/api/payment*`, `/*/store/*` detail, `/*/c/*`, `/sitemaps/dynamic.xml`). Those stay on Vercel at the same public host.
6. Fallback fetch remains `https://visutry.vercel.app` with `X-Forwarded-Host: www.visutry.com`. Never fetch `www.visutry.com`.
7. Apex: Redirect Rule to `https://www.visutry.com`.
8. SSL/TLS Full (strict). `auth.visutry.com` stays DNS-only.

| Criterion | Custom Domain (A) | Scoped routes (B) |
| --- | --- | --- |
| Free 100k Worker budget | Layer 3 burns quota | Layer 3 can skip Worker |
| Rollback | Must undo Custom Domain DNS | Delete Worker routes; www still Vercel |
| Same-host auth | Worker proxies `/api/auth` (quota + cookie risk) | Auth stays on www→Vercel natively |
| SEO | Same host | Same host |
| Routing loops | Must not fetch www | Same |
| Maintainability | Simple, dangerous | Explicit allowlist; must keep in sync with B4 manifest |
| Store/Campaign scale | Every slug hits Worker then Vercel | Slugs stay on Vercel unless later allowlisted |

B4.1’s Custom Domain preference is superseded for Free-plan B4.2B. Revisit Custom Domain only after Worker volume is proven well under 70k/day including Layer 3, or after a Paid plan decision.

## 13. Production cutover runbook

**Do not execute in this PR.**

### T-24h

- Export the complete Vercel DNS zone; diff against section 11.
- Lower TTL on apex/www A where Vercel allows.
- Record Vercel ISR / FOT / function invocation baseline.
- Confirm staging Worker version, gzip < 3072 KiB, Layer 1/2/3 smoke green.
- Create Cloudflare zone; import records **grey-cloud**; do not change nameservers yet.
- Confirm `auth.visutry.com`, MX, SPF, DKIM are present and DNS-only.

### T-30m

- Production Vercel app healthy (`https://visutry.vercel.app` and `https://www.visutry.com`).
- Production Worker artifact gzip < 3072 KiB; `run_worker_first=false`.
- `VERCEL_ORIGIN=https://visutry.vercel.app`, `PUBLIC_HOST=www.visutry.com`, `NEXTAUTH_URL=https://www.visutry.com` on the **production** Worker env only.
- Confirm rollback: Vercel still serves www; CF NS not yet changed **or** www still CNAME to Vercel.
- Confirm no `custom_domain` on www.

### CUTOVER

1. Change nameservers to Cloudflare only after grey-cloud records match the export.
2. Keep MX / TXT / CAA / Auth0 / DKIM identical.
3. Activate **scoped Worker routes** from section 12 only.
4. Keep Vercel as www origin for unmatched paths.
5. Verify SSL on www and apex redirect.

### T+5m

Smoke on `https://www.visutry.com`: `/`, `/en`, one hashed `/_next/static` file (no router header), one SEO route, `GET /api/health`, one Vercel fallback (`/_next/image` or unknown), `/api/auth/session`, Store/Campaign URL, Stripe page availability, AI entry availability. Confirm no `vercel.app` Location/canonical.

### T+30m / T+2h / T+6h / T+24h

- Cloudflare Worker request count (not Static Asset count)
- Worker CPU
- 5xx
- Vercel ISR / Fast Origin Transfer
- Auth errors
- Redirect loops

## 14. Rollback

Halt / rollback immediately on: sustained 5xx, auth/session regression, redirect loop, SEO canonical leakage to `vercel.app`, Store/Campaign failure, Vercel fallback failure, Worker pace ≥70k/day (warning / stop expansion), ≥80k (strong rollback), ≥90k (rollback before Error 1027).

**Primary (minutes, no app deploy):**

1. Remove Worker routes for `www.visutry.com` (dashboard or wrangler).
2. Leave www CNAME/A on Vercel origin, proxied or DNS-only as previously working.
3. If nameservers were moved and DNS is wrong: restore Vercel NS (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) from the pre-cutover export.
4. Do **not** change Auth0 application settings as a rollback.

Estimated time: **5–15 minutes** for route removal; **30–60 minutes** if NS must revert (TTL-bound).

**Secondary:** deploy a production Worker that classifies every path as `vercel-required` / `unknown-fallback` if routes cannot be removed quickly. Still no dual execution.

First slice is read-only. **No data repair.**

## 15. GO / NO-GO

| Gate | Result |
| --- | --- |
| B4.2A staging activation | **GO / PASS** |
| B4.2B execute production DNS + traffic cutover now | **NO-GO** |

B4.2B blockers (do not execute until cleared):

1. Production Worker request volume is **UNKNOWN**.
2. Recommended routing is **scoped Worker routes**, which are not yet in production Wrangler (this PR is staging `workers_dev` only).
3. Full www Custom Domain would bill Layer 3 against the Free 100k/day cap.
4. Nameserver move is not started; mail/Auth0/DKIM must be copied from a full zone export first.

Not blockers: Auth0 production setting changes, Store/Campaign on Cloudflare, `_next/image` on Cloudflare, Paid plan.

Next production action (not executed here): implement the section 12 scoped-route production Worker env on a Cloudflare zone, then follow section 13.
