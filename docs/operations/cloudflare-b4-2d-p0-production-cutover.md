# VisuTry Cloudflare B4.2D — P0 production Worker Route cutover

> **2026-08-19 update — Next frontend ownership locked to Vercel.** The production
> Worker route intent is now permanently the 12 approved **non-Next** capabilities
> only (non-Next static assets + `/api/health` + `/api/glasses/brands|categories|face-shapes`).
> Next HTML, RSC/Flight, and `/_next/static/*` are owned by Vercel and are **FORBIDDEN**
> as Worker routes (hard-blocked in `cloudflare-router/b4-production-routes.ts`). The
> earlier P1/P2 Next HTML route candidates and the parity-gated `/_next/static/*`
> candidate have been removed — they are no longer "activatable later". Cloudflare must
> not serve production Next HTML until the entire Next frontend, including
> `/_next/static`, is migrated as one self-consistent build/runtime.

**Status:** PASS — 12 ungated P0 (non-Next) routes active; `/_next/static/*` FORBIDDEN (never attached)  
**Date:** 2026-08-18  
**Owner:** Product / Engineering  
**Branch:** merged to `main` via PR #101 / #102  
**Starting SHA:** `1061e90d64327fb0a5301b193a25e2e36bfd867e` (PR #100 merge on `origin/main`)

**www Cloudflare proxy:** YES (`proxied: true`)  
**apex Cloudflare proxy:** NO (`proxied: false`)  
**SSL/TLS mode mutated:** NO (remains `strict`)  
**Universal SSL mutated:** NO  
**Production Worker:** `visutry-cf-production` DEPLOYED  
**Worker Custom Domain:** NONE  
**Production Worker Routes:** **12** ungated P0  
**Parity-gated `/_next/static/*`:** NOT ACTIVATED  
**P1 / P2:** 0  
**Auth0 / Stripe / mail / registrar NS / DNSSEC changed:** NO  
**Merged:** YES (PR #101 P0 cutover, PR #102 Workers Builds Git commands)

This is the first production Worker Route cutover. Intended path after B4.2D:

```text
Browser → Cloudflare authoritative DNS → www PROXIED →
  matched ungated P0 static prefix/exact → Static Assets (run_worker_first=false)
  matched ungated P0 API exact → visutry-cf-production Worker
  unmatched → Vercel origin → VisuTry
```

Related:

- [`cloudflare-b4-2c-phase-b3-www-proxy.md`](./cloudflare-b4-2c-phase-b3-www-proxy.md)
- Canonical manifest: [`cloudflare-router/b4-production-routes.json`](../../cloudflare-router/b4-production-routes.json)
- Preflight: [`evidence/cloudflare-b4-2d-p0-preflight.json`](./evidence/cloudflare-b4-2d-p0-preflight.json)
- Routes: [`evidence/cloudflare-b4-2d-p0-routes.json`](./evidence/cloudflare-b4-2d-p0-routes.json)
- Post-cutover: [`evidence/cloudflare-b4-2d-p0-postcutover.json`](./evidence/cloudflare-b4-2d-p0-postcutover.json)
- Observation: [`evidence/cloudflare-b4-2d-p0-observation.json`](./evidence/cloudflare-b4-2d-p0-observation.json)

## 1. Result

| Item | Value |
| --- | --- |
| RESULT | **PASS** |
| PR #100 merge on main | YES (`1061e90`) |
| Manifest P0 | 13 total / 12 ungated / 1 parity-gated |
| Activated | **12** |
| Excluded | `www.visutry.com/_next/static/*` (`same-commit-asset-parity`) |
| Production Worker | `visutry-cf-production` version `0a8f1a70-22c4-49a8-a915-5aa5a7f22685` |
| gzip | **2785.81 KiB** / 3072 KiB (headroom ~286 KiB) |
| Remote fail-open | **PASS** (`npx tsx cloudflare-router/b4-fail-open-remote.ts --from-json`) |
| Catch-all | none |
| Rollback | not required |
| P1 | **DO NOT EXECUTE** |

## 2. Baseline

| Field | Value |
| --- | --- |
| `origin/main` | `1061e90d64327fb0a5301b193a25e2e36bfd867e` |
| PR #100 merged | YES (`2026-08-18T08:40:13Z`) |
| B3 | CLOSED / PASS — www PROXIED, Worker Routes were 0, production Worker ABSENT |
| Zone | `visutry.com` `5e3dc058ed16f3aee917f1cef2e9f413` ACTIVE |
| www | PROXIED (`CNAME cname.vercel-dns-017.com`, anycast `104.21.42.69` / `172.67.158.125`) |
| apex | DNS_ONLY |
| SSL | Full (strict) |
| Universal SSL | ACTIVE |
| Routes before | 0 |
| Custom Domain before | NONE |

Vercel-origin API baseline (through Cloudflare proxy, no router headers): `/api/health` semantic `{status:ok,service:VisuTry,version:0.1.0}`; brands 50 / categories 10 / face-shapes 7 with body SHA-16 `e37e442d8fda77eb` / `e72c429426e5e07c` / `50359e21e203f21b`.

## 3. Manifest reconciliation

`generateB4ProductionWorkerRoutes()` + `routesForPriority('P0')` (default excludes parity-gated hashed static):

| Class | Count | Patterns |
| --- | --- | --- |
| Static Asset P0 | 8 | `/blog-covers/*` `/assets/*` `/images/*` `/home/*` `/experience-heroes/*` `/favicon.ico` `/robots.txt` `/llms.txt` |
| Worker API P0 | 4 | `/api/health` `/api/glasses/brands` `/api/glasses/categories` `/api/glasses/face-shapes` |
| Parity-gated P0 | 1 | `www.visutry.com/_next/static/*` — **not activated** |

`routeCountToAdd = 12`. No P1/P2. No Store detail, Campaign, Try-On slug, Face Analysis, Auth, Pricing, Stripe, Blob, AI, Cron, Admin, MCP, `/_next/image`, `/api/glasses/frames`, catch-all.

Active production intent is **derived** from that helper. Wrangler does **not** list `routes` or `custom_domain`.

## 4. Production Worker

Built from the same main commit (`1061e90`) with OpenNext / `CLOUDFLARE_BUILD=1`. First workers.dev API pass used a worktree `node_modules` symlink into another tree and returned 500 (`Dynamic require of "/.next/server/middleware-manifest.json"` locally). Reinstalled packages in this worktree, rebuilt, redeployed.

| Field | Value |
| --- | --- |
| Name | `visutry-cf-production` |
| workers.dev | `https://visutry-cf-production.sunye.workers.dev` |
| Version after rebuild | `0a8f1a70-22c4-49a8-a915-5aa5a7f22685` |
| Deployed (unrouted first) | `2026-08-18T08:59:27Z` (initial) then rebuild `2026-08-18T09:32:Z` |
| gzip | 2785.81 KiB |
| Headroom | ~286.19 KiB |
| `run_worker_first` | **false** |
| Prisma / Prisma WASM in `.open-next` | **absent** |
| Secrets present (names only) | `DATABASE_URL` `NEXTAUTH_SECRET` `AUTH0_ID` `AUTH0_SECRET` `AUTH0_ISSUER_BASE_URL` |
| Vars | `ROUTER_ENV=production` `NEXTAUTH_URL=https://www.visutry.com` `VERCEL_ORIGIN=https://visutry.vercel.app` `PUBLIC_HOST=www.visutry.com` |

After the first deploy, Worker Routes were still 0 and Custom Domain NONE. Direct workers.dev checks (post-rebuild): four APIs **200** `x-visutry-router-backend: cloudflare`; catalog SHA-16 matched the Vercel baseline; eight static families **200** with **no** router headers.

Method safety (routes are method-agnostic; classifier is not): GET/HEAD `/api/health` → Worker 200; POST/PUT/PATCH/DELETE → `x-visutry-router-backend: vercel` **405**. Next handlers export GET only. Not write endpoints.

Direct Neon path: `src/data/glasses-cloudflare.ts` via `getCloudflareSql()` (`@neondatabase/serverless`). No Prisma import in the Worker bundle.

## 5. Route installation

Posted to `POST /zones/5e3dc058ed16f3aee917f1cef2e9f413/workers/routes` with `{pattern, script: visutry-cf-production, request_limit_fail_open: true}`.

1. Eight static routes (`~09:34Z`). Re-read: 8, all fail-open, no extras. Static smoke 200, homepage/Store still unrouted.
2. Four API routes (`~09:36Z`). Re-read: **12**.

`npx tsx cloudflare-router/b4-fail-open-remote.ts --from-json docs/operations/evidence/cloudflare-b4-2d-p0-routes.json` → **pass**.

Rollback remains: **DELETE these 12 route IDs only**. Do not disable www proxy, SSL, DNS, or nameservers.

## 6. Execution proof

Worker-identifying headers already exist (`x-visutry-router-backend` / `layer` / `invocation`). No new public debug header.

| Path | Proof |
| --- | --- |
| Four P0 APIs | 200, `router=cloudflare`, `layer=layer2-worker`, `invocation=worker` |
| Eight static families | 200, **no** router headers, `cf-cache-status=HIT` → Static Assets, Worker not invoked |
| `/`, `/en`, Store hub/detail, Campaign, Try-On, Face Analysis, pricing, auth sign-in, `/_next/image`, `/api/glasses/frames`, unknown | Cloudflare proxy, **no** router header → Vercel |

Catalog body SHA-16 after cutover matches the Vercel preflight baseline. `/api/health` semantic parity holds; timestamp/environment metadata may differ.

`favicon.ico` is a 1-byte stub in `public/` and in the asset bundle. Live status remains 200 `image/vnd.microsoft.icon` (same as Vercel). SEO also references `/favicon.svg`.

## 7. Overmatch

Exact APIs do not match `/foo` suffixes. Directory `/*` does not match the directory itself or `imagesfoo` / `assetsfoo` (those 307 to locale-prefixed Vercel HTML). `/_next/static/*` has **no** production Worker Route.

## 8. Quota and observability

Workers Free: **100,000 requests/day**. Warning 70k projected/day; stop expansion before 90k projected/day.

Only the four API routes (plus static **misses**) count. Asset hits with `run_worker_first=false` do not invoke the Worker. Wrangler OAuth cannot read Workers observability (403). Immediate request count is therefore **UNKNOWN** beyond smoke traffic; do not treat that as a 70k/90k hit. Console logs from `app-host-worker.ts` include `method`, sanitized `route`, `layer`, `backend`, `status`, `latencyMs`, and exception class — not cookies, Authorization, or secrets.

## 9. Overnight state

Immediate, 5-minute, 15-minute, and 30-minute checkpoints **PASS**. Cutover `2026-08-18T09:36:00Z`. Keep P0 active overnight. 60-minute probe is still due `10:36Z` and is not a merge blocker.

This is a P0 production milestone: 12 ungated routes stay live; do **not** activate P1.

| Item | Overnight |
| --- | --- |
| www | PROXIED |
| Worker | DEPLOYED |
| Routes | exactly 12 P0 |
| `/_next/static/*` | NOT ACTIVATED |
| P1/P2 | 0 |
| Store/Campaign/Try-On/Face Analysis/Auth/Stripe/AI/Blob/Cron/unknown | Vercel |

Do **not** activate P1 today.

## 10. Rollback

Hard rollback: delete the 12 Worker Routes. Worker may remain deployed and unrouted. Partial rollback must be labeled **PARTIAL P0**.
