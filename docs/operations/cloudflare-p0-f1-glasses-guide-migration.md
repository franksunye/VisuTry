# VisuTry Cloudflare P0-F1 — Glasses Guide production migration

**Status:** PRODUCTION MIGRATED / PR OPEN (not merged)  
**Date:** 2026-08-19  
**Owner:** Product / Engineering  
**Branch:** `codex/cf-migrate-glasses-guide`  
**Starting SHA:** `ac8b2f4f6d79f8888ac73792da3f62893193014f` (`origin/main`)  
**Worker version:** `3936af2b-c7bf-4f2c-8606-3c6a57d97711`  
**Production migration timestamp UTC:** `2026-08-19T02:44:26Z` (Phase 2 routes live)

This is a formal backend migration of the Glasses Guide SEO family from Vercel fallback / ISR pass-through onto `visutry-cf-production` / OpenNext. It is not a telemetry experiment.

Related:

- [`cloudflare-b4-2d-p0-production-cutover.md`](./cloudflare-b4-2d-p0-production-cutover.md)
- [`hosting-strategy-vercel-cloudflare.md`](./hosting-strategy-vercel-cloudflare.md)
- Before routes: [`evidence/cloudflare-p0-f1-before-routes.json`](./evidence/cloudflare-p0-f1-before-routes.json)
- Phase 1 after: [`evidence/cloudflare-p0-f1-phase1-after-routes.json`](./evidence/cloudflare-p0-f1-phase1-after-routes.json)
- Phase 2 after: [`evidence/cloudflare-p0-f1-phase2-after-routes.json`](./evidence/cloudflare-p0-f1-phase2-after-routes.json)

## Before architecture

```text
Internet → Cloudflare www PROXIED
  ├─ 12 ungated P0 routes → visutry-cf-production / OpenNext
  ├─ EN glasses-guide exact + /* → visutry-isr-passthrough → Vercel
  └─ unmatched (other locale glasses-guide, Store, payment, AI, …) → Vercel origin
```

## After architecture

```text
Internet → Cloudflare www PROXIED
  ├─ 12 ungated P0 routes (untouched IDs) → visutry-cf-production
  ├─ /_next/static/* → visutry-cf-production Static Assets (hit) or Vercel (miss)
  ├─ 18 glasses-guide routes (9 hub exact + 9 /* detail) → visutry-cf-production / OpenNext
  └─ unmatched Vercel-required / unknown → Vercel origin
```

Pass-through Worker `visutry-isr-passthrough` remains deployed but **owns zero** Glasses Guide production routes.

## STEP 0 — Git baseline

| Item | Value |
| --- | --- |
| Starting workspace | `codex/isr-production-pass-through-telemetry` @ `75778ca` (dirty telemetry docs; not used) |
| `origin/main` | `ac8b2f4` |
| Telemetry in main | **NO**. `codex/isr-edge-telemetry` (`e49b7b3`) and `codex/isr-production-pass-through-telemetry` (`75778ca`) are experiment branches only |
| Production CF already live but not in main | **YES**: 12 P0 `visutry-cf-production` routes (merged via PR #101) plus 2 live EN canary routes on `visutry-isr-passthrough` that were never merged |
| New branch | `codex/cf-migrate-glasses-guide` from `origin/main` |
| Pass-through Worker treated as formal dependency | **NO** |

## STEP 1 — Live production snapshot (before writes)

Captured `2026-08-19T02:12:14Z`.

| Item | Live value |
| --- | --- |
| www DNS proxy | **YES** — Cloudflare NS `romina`/`stanley`; public A `172.67.158.125` / `104.21.42.69` via `1.1.1.1`. Local resolver briefly returned Vercel-looking A records; authoritative/public CF anycast is source of truth |
| apex | still DNS_ONLY / Vercel-looking A records; not mutated |
| Worker Routes total | **14** |
| `visutry-cf-production` | **12** ungated P0 (fail-open). Same IDs as B4.2D |
| `visutry-isr-passthrough` | **2** EN canary: `www.visutry.com/en/glasses-guide` (`fbadeef503ec4c92850ac100408633cc`), `www.visutry.com/en/glasses-guide/*` (`c527b3e252384b76a1e835697bb23daf`) |
| Other locale glasses-guide | unmatched → Vercel |
| `/_next/static/*` | **not** attached |
| Custom Domain | none (workers domains API not readable with Wrangler OAuth; workers.dev still live) |
| Telemetry canary overlap | **YES** for English glasses-guide only |

### CONFIG DRIFT

Live state is the source of truth. Repo `main` does not contain:

- `visutry-isr-passthrough` Worker source as a production owner
- the 2 English glasses-guide Worker Routes

Those exist only on experiment branches and in live Cloudflare. This migration does **not** restore them after cutover.

The 12 P0 OpenNext routes match `docs/operations/evidence/cloudflare-b4-2d-p0-routes.json`.

## STEP 2 — OpenNext capability

Direct `visutry-cf-production.sunye.workers.dev` smoke **before** the glasses-guide `dynamicParams` fix:

| Path | Result |
| --- | --- |
| `/en/glasses-guide` | **200** HTML, canonical `https://www.visutry.com/en/glasses-guide`, `x-visutry-router-backend: cloudflare` |
| `/en/glasses-guide/best-rectangle-glasses-for-round-face` | **404** OpenNext |
| `/en/face-shapes/oval` | **200** (same nested-dispatch pattern already patched) |

Root cause (two layers):

1. `src/app/[locale]/(main)/glasses-guide/[slug]/page.tsx` had `dynamicParams = false`. OpenNext 1.15.1 cannot dispatch nested generated pages unless `dynamicParams` is true on Cloudflare.
2. Next does **not** inline `process.env.CLOUDFLARE_BUILD` unless it is listed under `next.config.js` `env`. The compiled bundle kept ` "1"===process.env.CLOUDFLARE_BUILD ` as a **runtime** check. The production Worker had no such var, so details 404'd even after the source change. Staging HTML for the same slug was already edge-cached from a working isolate (`s-maxage=31536000`).

Fixes applied:

- `dynamicParams = process.env.CLOUDFLARE_BUILD === '1'` on the glasses-guide slug page (Vercel unit tests still see `false`).
- `CLOUDFLARE_BUILD=1` added to wrangler `staging` / `production` vars.
- Cloudflare Next compiles now inline `CLOUDFLARE_BUILD: '1'` via `next.config.js` `env`.
- Production deploy of the proven OpenNext artifact used `OPEN_NEXT_DEPLOY=true npx wrangler deploy --env production --keep-vars` so Wrangler does **not** recurse into `opennextjs-cloudflare deploy` and rebuild Next without env.

www routes were not left on Cloudflare until workers.dev details returned 200.

Final workers.dev proof (Worker `3936af2b-…`):

| Path | Status | Notes |
| --- | --- | --- |
| `/en/glasses-guide` | 200 | www canonical |
| `/en/glasses-guide/best-rectangle-glasses-for-round-face` | 200 | www canonical |
| `/de/…/best-rectangle-glasses-for-round-face` | 200 | localized DE title |
| `/ar/…/best-rectangle-glasses-for-round-face` | 200 | `dir=rtl` |
| `/en/glasses-guide/this-slug-does-not-exist-xyz` | 404 | branded not-found, `noindex` |
| `/api/health` | 200 | `x-visutry-router-backend: cloudflare` |

## Hashed static

Cloudflare HTML and Vercel HTML emit independent `/_next/static` chunk hashes. Migrating HTML without a same-origin CF chunk path would hydrate CF pages with Vercel JS.

P0-F1 activates `www.visutry.com/_next/static/*` (`41ff12723da144f283a4fbda560fce51`) with:

- `run_worker_first: false` → asset **hit** is Layer 1 (no Worker quota)
- Worker invocation means asset **miss** → proxy to Vercel (`shouldFallbackHashedStaticMissToVercel`)

This is not a Cache Everything experiment. No extra Cache Rule is added.

## Production route list (live)

31 Worker Routes after cutover = 12 original P0 + 1 hashed static + 18 glasses-guide.

18 Glasses Guide routes on `visutry-cf-production`, `request_limit_fail_open: true`:

| Pattern | Route ID |
| --- | --- |
| `www.visutry.com/en/glasses-guide` | `1ad1e4de9011410c8e12b43b6d55db9e` |
| `www.visutry.com/en/glasses-guide/*` | `1d13d7b3f1e94674a213b4cc5b94939c` |
| `www.visutry.com/id/glasses-guide` | `6ff8fb518d8c42afb377746b8720e529` |
| `www.visutry.com/id/glasses-guide/*` | `0d7f142dcd7344bdaff80ee0be176342` |
| `www.visutry.com/ar/glasses-guide` | `95a646b29001472dabfe100af0401e5b` |
| `www.visutry.com/ar/glasses-guide/*` | `fabf8d1a83b0424a8d6c2cdf01155614` |
| `www.visutry.com/ru/glasses-guide` | `2dd8f168335d43ac9cfd42b90eccbd3f` |
| `www.visutry.com/ru/glasses-guide/*` | `22c0c299ddfd493fa83606a3b96b56c6` |
| `www.visutry.com/de/glasses-guide` | `4cffb3dea8374756aa57a66e22bae067` |
| `www.visutry.com/de/glasses-guide/*` | `3bdcc55533b1416fb9bb6a24b7b4d8b4` |
| `www.visutry.com/ja/glasses-guide` | `d8f07b25279c4045be83c99612a73f84` |
| `www.visutry.com/ja/glasses-guide/*` | `96d2288e32414e10ab3c868702995ee1` |
| `www.visutry.com/es/glasses-guide` | `f2711ec42be04caeb921144df721f9e8` |
| `www.visutry.com/es/glasses-guide/*` | `376166ca0f134c28a82764231e69d58f` |
| `www.visutry.com/pt/glasses-guide` | `03dd967df9204d16bb959c52a2306658` |
| `www.visutry.com/pt/glasses-guide/*` | `75fdf6a6609e47b0a45192965cac362b` |
| `www.visutry.com/fr/glasses-guide` | `e422aad064f94685bcea0a59e1af4877` |
| `www.visutry.com/fr/glasses-guide/*` | `0e3c1509fa5a4b4abb8a832b6f654f56` |

Hashed static: `www.visutry.com/_next/static/*` `41ff12723da144f283a4fbda560fce51`.

Locale-less `/glasses-guide` is **not** migrated this round (apex/middleware still 301 to `/en/glasses-guide`).

Original 12 P0 IDs **unchanged**:

`bd50f1aa…` brands, `6a340daf…` categories, `095292f1…` face-shapes, `3becca52…` health, `82fa3232…` assets, `c9a2f20f…` blog-covers, `cb7b5907…` experience-heroes, `8d751bee…` favicon, `6d5e5212…` home, `81e7a103…` images, `9f88d931…` llms, `cde8be98…` robots.

## STEP 3 — Vercel vs Cloudflare parity

Compared `https://visutry.vercel.app` vs `https://visutry-cf-production.sunye.workers.dev` after the www-canonical Worker rebuild.

| Check | A hub `/en/glasses-guide` | B EN detail | C DE detail | D AR detail | E unknown slug |
| --- | --- | --- | --- | --- | --- |
| HTTP status | 200 / 200 **PASS** | 200 / 200 **PASS** | 200 / 200 **PASS** | 200 / 200 **PASS** | 404 / 404 **PASS** |
| Canonical www | PASS | PASS | PASS | PASS | CF branded 404 canonical `/en`; Vercel default 404 has none |
| robots | index,follow / same **PASS** | PASS | PASS | PASS | noindex / noindex **PASS** |
| hreflang + x-default www | PASS | PASS | PASS | PASS | CF 404 has hreflang; Vercel default 404 does not |
| JSON-LD | PASS | PASS | PASS | PASS | CF 404 has JSON-LD; Vercel default 404 does not |
| Localized title/description | n/a | EN **PASS** | DE **PASS** | AR **PASS** | n/a |
| `dir=rtl` (AR) | n/a | n/a | n/a | **PASS** | n/a |
| workers.dev / vercel.app in canonical | none **PASS** | PASS | PASS | PASS | none |
| Cache-Control | CF `s-maxage=31536000, stale-while-revalidate=2592000` vs Vercel `public, max-age=0, must-revalidate` — transport difference **allowed** | same | same | same | CF no-store vs Vercel must-revalidate |
| 404 HTML template | n/a | n/a | n/a | n/a | Different templates; **status + noindex match**. Not an indexable SEO semantic miss |

Gate for cutover: A–D SEO semantics **PASS**. E status **PASS** with known branded vs default 404 HTML residual.

## STEP 4 — Atomic EN transition

Do not leave the same pattern on two Workers.

1. Attach `/_next/static/*` to `visutry-cf-production` (`41ff1272…`).
2. `DELETE` passthrough IDs `fbadeef503ec4c92850ac100408633cc` and `c527b3e252384b76a1e835697bb23daf`.
3. `POST` the same two English patterns onto `visutry-cf-production`.

If a POST fails after DELETE, unmatched www traffic fail-opens to Vercel (safe). Do not recreate the pass-through routes during rollback.

### First Phase 1 attempt (rolled back)

`2026-08-19T02:30Z` attached EN routes while production OpenNext still 404'd details (`CLOUDFLARE_BUILD` unset at runtime). EN hub 200 CF; EN details 404 CF. Rolled back the two EN routes immediately (`DELETE` `fb1e0a59…` / `56a3b20a…`). www details returned to Vercel 200. Original 12 P0 + hashed static kept. Pass-through was **not** restored.

### Successful Phase 1

After Worker `3936af2b-…` (`CLOUDFLARE_BUILD=1`) proved workers.dev detail 200s, EN routes were re-attached `2026-08-19T02:41Z`:

- hub `1ad1e4de9011410c8e12b43b6d55db9e`
- detail `1d13d7b3f1e94674a213b4cc5b94939c`

## STEP 5–7 — Production smoke

### Phase 1 English (`2026-08-19T02:41:53Z`)

Evidence: [`evidence/cloudflare-p0-f1-phase1-www-smoke.json`](./evidence/cloudflare-p0-f1-phase1-www-smoke.json)

| URL | Result |
| --- | --- |
| `/en/glasses-guide` | 200, `x-visutry-router-backend: cloudflare`, no `x-vercel-id`, canonical www, JSON-LD, HEAD 200, RSC `text/x-component` |
| `/en/glasses-guide/best-rectangle-glasses-for-round-face` | 200 CF, RSC 200 |
| `/en/glasses-guide/best-square-glasses-for-round-face` | 200 CF |
| `/en/glasses-guide/how-should-glasses-fit-your-face` | 200 CF |
| unknown slug | 404 CF, `noindex` |
| `/de/glasses-guide` (before Phase 2) | still Vercel (`x-vercel-id`) |
| `/en` homepage | still Vercel |
| `/api/health` | still CF |
| `/_next/static` chunks from CF HTML | 200 (asset hit or miss-fallback) |

hreflang is emitted as `hrefLang=` (Next metadata). 9 locales + `x-default` all point at `https://www.visutry.com/…`.

### Phase 2 remaining 8 locales (`2026-08-19T02:44:26Z`)

Evidence: [`evidence/cloudflare-p0-f1-phase2-locale-smoke.json`](./evidence/cloudflare-p0-f1-phase2-locale-smoke.json)

Each of `en id ar ru de ja es pt fr`: hub + `best-rectangle-glasses-for-round-face` → **200 Cloudflare**, canonical `https://www.visutry.com/{locale}/…`, hreflang + x-default www, JSON-LD. Arabic `dir=rtl`. Japanese titles correctly encoded (`顔型・フレーム・フィット別メガネガイド`, `丸顔に合う長方形フレーム`).

Unchanged:

| Path | Backend |
| --- | --- |
| `/api/health` | Cloudflare (pre-existing P0) |
| `/en/store/does-not-matter` | Vercel |
| `/en/c/foo/bar` | Vercel |
| `/en/discover` | Vercel |
| unknown crawler path | Vercel 307 locale redirect |

## STEP 8 — Assets / RSC / build consistency

HTML for migrated pages comes from Worker `3936af2b-…` / OpenNext BUILD_ID `DwoNmS6PLf6QeWIUVi0gP`. CF page chunk `glasses-guide/[slug]/page-a57d03c8bb6b2520.js` is served from www `/_next/static/*` (307 encoding of `(main)` then 200). Vercel homepage still loads Vercel `main-app-*.js` hashes; hashed-static miss proxies those to Vercel. No HTML=CF / JS=Vercel mix for glasses-guide.

## STEP 9 — Cache behavior

No new Cache Rule. No Cache Everything. No custom 30d HTML TTL experiment.

Observed HTML Cache-Control from OpenNext default: `s-maxage=31536000, stale-while-revalidate=2592000`. `CF-Cache-Status` on HTML Worker responses was unset in smoke (Worker-generated). Static JS showed `CF-Cache-Status: HIT|MISS` with `public, max-age=0, must-revalidate` from origin.

## STEP 10 — Rollback (≤ 5 minutes)

Do **not** touch the original 12 P0 routes, www proxy, SSL, or DNS. Do **not** restore `visutry-isr-passthrough`. English unmatched then fail-opens to Vercel.

```bash
ZONE=5e3dc058ed16f3aee917f1cef2e9f413
# DELETE only P0-F1 IDs (18 glasses-guide + hashed static):
# 1ad1e4de9011410c8e12b43b6d55db9e
# 1d13d7b3f1e94674a213b4cc5b94939c
# 6ff8fb518d8c42afb377746b8720e529
# 0d7f142dcd7344bdaff80ee0be176342
# 95a646b29001472dabfe100af0401e5b
# fabf8d1a83b0424a8d6c2cdf01155614
# 2dd8f168335d43ac9cfd42b90eccbd3f
# 22c0c299ddfd493fa83606a3b96b56c6
# 4cffb3dea8374756aa57a66e22bae067
# 3bdcc55533b1416fb9bb6a24b7b4d8b4
# d8f07b25279c4045be83c99612a73f84
# 96d2288e32414e10ab3c868702995ee1
# f2711ec42be04caeb921144df721f9e8
# 376166ca0f134c28a82764231e69d58f
# 03dd967df9204d16bb959c52a2306658
# 75fdf6a6609e47b0a45192965cac362b
# e422aad064f94685bcea0a59e1af4877
# 0e3c1509fa5a4b4abb8a832b6f654f56
# 41ff12723da144f283a4fbda560fce51   # hashed static; delete only if mixed HTML must fully leave CF
# DELETE https://api.cloudflare.com/client/v4/zones/$ZONE/workers/routes/:id
```

Fail-open on the new routes also bypasses the Worker to Vercel origin on 1027.

## STEP 11 — Resource measurement

Do **not** crawl 270 URLs. Compare **natural** traffic:

| Window | Vercel ISR Reads | Vercel Fast Origin Transfer | CF requests / CPU / errors / subrequests |
| --- | --- | --- | --- |
| 12h before `2026-08-19T02:44:26Z` | record from Vercel dashboard | | |
| 12h after | | | |
| 24h after | | | |

Direction that matters: ISR Reads ↓ and Fast Origin Transfer ↓ means glasses-guide was a real Vercel meter contributor. If Vercel does not drop, the family still belongs on CF architecturally, but it is not the main Hobby-quota driver.

Also watch CF Worker errors and subrequests for `visutry-cf-production` over the same windows.

## Do not migrate (this round)

`/api/*` (except the existing 4 P0 catalog/health routes), `/auth/*`, `/admin/*`, `/dashboard/*`, `/merchant/*`, `/payment/*`, `/upload/*`, try-on API, face-analysis submit, cron, Store/Campaign runtime, `/[locale]/discover`, style / blog / sunglasses-for / face-shapes / hairstyles-for.

## Deploy notes

- Always `wrangler deploy --env production --keep-vars`.
- Set `OPEN_NEXT_DEPLOY=true` when deploying an already-built `.open-next` so Wrangler does not recurse into `opennextjs-cloudflare deploy` / a Next rebuild.
- Cloudflare Next builds: `CLOUDFLARE_BUILD=1 NEXT_PUBLIC_SITE_URL=https://www.visutry.com`.

## Git

- Pushed: see PR
- Merged: **NO**
