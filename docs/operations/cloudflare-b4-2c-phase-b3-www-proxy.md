# VisuTry Cloudflare B4.2C Phase B — Checkpoint B3 (www DNS_ONLY → PROXIED)

**Status:** PASS — www PROXIED; Worker Routes 0
**Date:** 2026-08-18  
**Owner:** Product / Engineering  
**Branch:** `cursor/cloudflare-b4-2c-phase-b3-www-proxy`  
**Starting SHA:** `aef2706346f5ea07de05f442486c4f6463006c62` (PR #99 merge on `origin/main`)

**www Cloudflare proxy:** YES (`proxied: true`)  
**apex Cloudflare proxy:** NO (`proxied: false`)  
**SSL/TLS mode mutated:** NO (remains `strict`)  
**Universal SSL mutated:** NO  
**Production Worker Routes:** 0  
**www Worker Custom Domain:** NONE  
**production Worker:** ABSENT  
**Auth0 / Stripe / mail / registrar NS / DNSSEC changed:** NO  
**P0 Worker attach:** NOT EXECUTED  
**Merged:** NO

This checkpoint changes **only** the www orange-cloud flag. Intended path after B3:

```text
Browser → Cloudflare authoritative DNS → www PROXIED → Cloudflare edge TLS → Vercel origin → VisuTry
```

This is **not** the Worker cutover. Worker Routes remain 0.

Related:

- [`cloudflare-b4-2c-phase-b2-universal-ssl.md`](./cloudflare-b4-2c-phase-b2-universal-ssl.md)
- Preflight: [`evidence/cloudflare-b4-2c-b3-preflight.json`](./evidence/cloudflare-b4-2c-b3-preflight.json)
- Post-proxy: [`evidence/cloudflare-b4-2c-b3-postproxy.json`](./evidence/cloudflare-b4-2c-b3-postproxy.json)
- Observation: [`evidence/cloudflare-b4-2c-b3-observation.json`](./evidence/cloudflare-b4-2c-b3-observation.json)

## 1. Result

| Item | Value |
| --- | --- |
| RESULT | **PASS** |
| PR #99 merge on main | YES (`aef2706`) |
| Zone status | **active** |
| SSL mode | **strict** (unchanged) |
| Universal SSL | enabled, pack **universal/active** |
| www after mutation | `CNAME cname.vercel-dns-017.com`, **`proxied: true`** |
| apex | still **`proxied: false`** |
| Edge TLS | Google Trust Services `WE1`, SAN `visutry.com` + `*.visutry.com` |
| 525 / 526 | **none** |
| Worker Routes | **0** |
| Rollback | **not required** |
| Auth0 full E2E | **PASS** (operator completed login → callback → session → logout in production) |
| Observation window | **complete** (immediate / 5m / 15m / 30m / 60m); no rollback |
| P0 / Worker cutover | **NO-GO** |

B3 is complete. www is Cloudflare PROXIED. Worker Routes remain 0. Do not attach Worker Routes without separate approval.

## 2. Baseline

| Field | Value |
| --- | --- |
| `origin/main` | `aef2706346f5ea07de05f442486c4f6463006c62` |
| PR #99 merge present | YES |
| B1 | CLOSED / PASS |
| B2 | CLOSED / PASS |
| Fresh branch | `cursor/cloudflare-b4-2c-phase-b3-www-proxy` |
| Worktree | `/Users/yesun/Code/visutry-cf-b4-2c-phase-b3` |

## 3. Preflight

All B3 preflight gates **PASS** before the PATCH.

| Gate | Result |
| --- | --- |
| Zone ACTIVE | PASS |
| SSL `strict` | PASS |
| Universal SSL enabled | PASS |
| Pack active, hosts `visutry.com` + `*.visutry.com` | PASS |
| www CNAME `cname.vercel-dns-017.com` `proxied: false` | PASS (record `611c0c7ede4b475165cf14c36d451d50`) |
| apex `proxied: false` | PASS (record `8a00d7a80ff0579e0f68d09671c2ef68`) |
| Worker Routes 0 / Custom Domain none / `visutry-cf-production` ABSENT | PASS |
| Origin TLS for Full (strict) | PASS (Let’s Encrypt `YR2`, `CN=*.visutry.com`, unexpired) |
| Public www before mutation | Vercel, no `cf-ray` |

## 4. Mutation

| Field | Value |
| --- | --- |
| Executed | YES |
| Timestamp | **2026-08-18T07:26:33Z** |
| API `modified_on` | `2026-08-18T07:26:35.177881Z` |
| Endpoint | `PATCH /zones/:id/dns_records/611c0c7ede4b475165cf14c36d451d50` |
| HTTP | **200** |
| Change | `proxied: false` → **`true`** |
| Type / name / content | unchanged (`CNAME` / `www` / `cname.vercel-dns-017.com`) |
| Apex | unchanged |
| SSL mode | unchanged (`strict`) |
| Workers | unchanged |

Token values were not stored and were unset after use.

## 5. DNS / API confirmation

Re-read `2026-08-18T07:35:53Z`:

| Record | API |
| --- | --- |
| www | `proxied: true`, content `cname.vercel-dns-017.com` |
| apex | `proxied: false`, content `1c82e566126a58cc.vercel-dns-017.com` |
| pay | `hosted-checkout.stripecdn.com`, `proxied: false` |
| auth | Auth0 CNAME, `proxied: false` |

Authoritative and public recursive `A www.visutry.com` flatten to Cloudflare anycast **`104.21.42.69`** / **`172.67.158.125`**. CF NS no longer return the www CNAME. That is expected orange-cloud behavior.

## 6. Edge TLS vs origin TLS

Forced connect to `104.21.42.69:443` with SNI `www.visutry.com`:

| Field | Value |
| --- | --- |
| Issuer | Google Trust Services `WE1` |
| Subject | `CN=visutry.com` |
| SAN | `visutry.com`, `*.visutry.com` |
| Valid | 2026-08-18 → 2026-11-16T04:50:11Z |

Origin (Vercel IP `64.29.17.1:443`, SNI `www.visutry.com`) still presents Let’s Encrypt `YR2` for `*.visutry.com`. Full (strict) hostname match remains valid. No Origin CA was issued.

Do not confuse Cloudflare edge TLS with Vercel origin TLS. Both are valid.

## 7. HTTP / application

Apex remains DNS_ONLY: `307` → `https://www.visutry.com/`, `server: Vercel`, no `cf-ray`. No apex↔www or http↔https loop.

www through Cloudflare anycast (`--resolve` to `104.21.42.69`) is healthy. Representative results at `2026-08-18T07:37:33Z`:

| URL | Status | Notes |
| --- | --- | --- |
| `/` | 307 → `/en` | same as B1/B2 |
| `/en` | 200 | `server: cloudflare`, `cf-ray` present, canonical `https://www.visutry.com/en` |
| `/en/store` | 200 | Store hub |
| `/en/store/ello-sunglasses` | 200 | Store detail still on Vercel origin (`x-vercel-id`) |
| `/en/c/ello-sunglasses/petite-fit` | 200 | Campaign |
| `/en/try-on` | 307 | same as B1/B2 |
| `/en/face-analysis` | 200 | |
| `/en/pricing` | 200 | |
| `/en/auth/signin` | 200 | |
| `/api/health` | 200 JSON | `cf-cache-status: DYNAMIC` when edge headers present |
| `/api/glasses/brands` | 200 JSON | DYNAMIC |
| `/_next/image?...model-face-square-report.jpg...` | 200 JPEG | |
| `/_next/static` CSS/JS | 200 | JS `cf-cache-status: HIT` |
| `robots.txt` / `sitemap.xml` / `favicon.ico` / `llms.txt` | 200 | |

No `visutry.vercel.app` or `cname.vercel-dns-017.com` leak in `/en` HTML.

Local resolver / HTTP/2 Alt-Svc can still show `server: Vercel` without `cf-ray` for some www URLs. That is **not** treated as rollback: DNS API `proxied: true` plus forced-edge `cf-ray` samples prove the proxy path. No 52x.

## 8. Auth0

`/en/auth/signin` still loads. Agent browser navigation reached Auth0 Universal Login at `auth.visutry.com` (identifier page: email, Continue, Google, X) without using production credentials.

The operator then completed the full production flow:

```text
login → callback → authenticated session → logout
```

Result: **PASS**. Auth0 DNS was not changed. No cookies, session tokens, or Auth0 secrets were stored.

If a later Auth0 failure is confirmed to be caused by www proxy, rollback is `www.proxied true → false` only. Do not change Auth0 settings.

## 9. Cache

No Cache Rules created. Browser Cache TTL not changed. Cache Everything not enabled.

When Cloudflare edge headers are present, HTML and public APIs are **DYNAMIC**. A representative static JS file was **HIT**. No private/authenticated response caching was observed on the checked paths.

## 10. Mail / Stripe

Unchanged:

- MX `5 mxbiz1.qq.com` / `10 mxbiz2.qq.com`
- SPF `v=spf1 include:spf.mail.qq.com ~all`
- DMARC `v=DMARC1; p=none;`
- Resend DKIM present
- SES `send` MX + SPF present
- `pay.visutry.com` CNAME `hosted-checkout.stripecdn.com`, DNS_ONLY

No real payment was made.

## 11. Worker safety

Wrangler OAuth re-read `2026-08-18T07:37:20Z`:

| Item | Result |
| --- | --- |
| Worker Routes | **0** |
| Custom Domains | **0** |
| `visutry-cf-production` | **ABSENT** |
| Staging (untouched) | `visutry-cf-staging`, `visutry-cf-staging-router` |

www PROXIED does **not** mean Worker execution.

## 12. Observation window

| Checkpoint | Time (UTC) | Result |
| --- | --- | --- |
| immediate | 07:26:33Z | healthy, no 52x |
| 5m | 07:30:11Z | healthy, no rollback |
| ~11m | 07:37:33Z | application checks above |
| 15m | 07:42:47Z | healthy, no 52x, no rollback |
| 30m | 07:57:36Z | healthy, no 52x, no rollback (Campaign retry 200) |
| 60m | 08:26:51Z | healthy, no 52x, no rollback; homepage and Try-On now show `cf-ray`; Store hub first curl SSL_ERROR_SYSCALL then retry 200 |

Observation window is complete. Do not attach Worker Routes.

## 13. Rollback

Not required. If needed later:

```text
www.proxied: true → false
```

Do **not** weaken SSL from `strict`. Do not change CNAME content, Worker routes, or registrar NS.

## 14. B3 decision gate

| # | Requirement | Result |
| --- | --- | --- |
| 1 | www proxied = true | **PASS** |
| 2 | apex proxied = false | **PASS** |
| 3 | SSL mode remains strict | **PASS** |
| 4 | Cloudflare edge certificate valid | **PASS** |
| 5 | no 525/526 | **PASS** |
| 6–12 | homepage /en Store Campaign Try-On Face Analysis pricing | **PASS** (Try-On still 307) |
| 13 | Auth0 full login/session/logout | **PASS** (operator, production) |
| 14–16 | static assets / `_next/image` / public APIs | **PASS** |
| 17 | no private cache issue | **PASS** |
| 18–20 | Worker Routes 0 / Custom Domain none / production Worker absent | **PASS** |
| 21 | no rollback during observation window | **PASS** |

**B3 = PASS**

Worker Route cutover remains **NO-GO** without separate approval.

## 15. Runtime code

Application runtime and Cloudflare router Worker code are unchanged except the DNS desired-state record for www (`proxied: false` → `true`) so future `b4:dns:diff` matches live B3.

## 16. Validation

| Check | Result |
| --- | --- |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (existing warnings only) |
| `npm run test:critical:ci` | PASS (7 suites / 30 tests) |
| `tests/unit/cloudflare-b4-dns-zone-diff.test.ts` | PASS |
| `git diff --check` | PASS |
