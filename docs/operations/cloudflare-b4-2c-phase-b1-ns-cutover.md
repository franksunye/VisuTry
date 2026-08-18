# VisuTry Cloudflare B4.2C Phase B — Checkpoint B1 (authoritative NS only)

**Status:** PARTIAL — CUTOVER HEALTHY / PROPAGATING  
**Date:** 2026-08-18  
**Owner:** Product / Engineering  
**Branch:** `cursor/cloudflare-b4-2c-phase-b1-ns-cutover`  
**Starting SHA:** `0881ef3c072fe9f430c93d42e23579edb495d663` (PR #97 merge on `origin/main`)

**Namecheap nameservers changed:** YES (Vercel → Cloudflare assigned pair)  
**www Cloudflare proxy:** NO (still DNS_ONLY)  
**Production Worker Routes:** 0  
**www Worker Custom Domain:** NONE  
**Auth0 / Stripe / mail provider / DNSSEC changed:** NO  
**B2 / B3 / P0 attach:** NOT EXECUTED  
**Merged:** NO

This checkpoint changes **only** registrar nameservers so Cloudflare becomes authoritative DNS. Traffic path after delegation:

```text
Browser → Cloudflare authoritative DNS → Vercel directly
```

Related:

- [`cloudflare-b4-2c-phase-a-dns-zone.md`](./cloudflare-b4-2c-phase-a-dns-zone.md)
- Preflight dump: [`evidence/cloudflare-b4-2c-b1-dns-preflight-dump.json`](./evidence/cloudflare-b4-2c-b1-dns-preflight-dump.json)
- Precutover public DNS: [`evidence/cloudflare-b4-2c-b1-public-dns-precutover.json`](./evidence/cloudflare-b4-2c-b1-public-dns-precutover.json)
- Application baseline: [`evidence/cloudflare-b4-2c-b1-application-baseline.json`](./evidence/cloudflare-b4-2c-b1-application-baseline.json)
- Propagation: [`evidence/cloudflare-b4-2c-b1-propagation.json`](./evidence/cloudflare-b4-2c-b1-propagation.json)
- Post-cutover dump: [`evidence/cloudflare-b4-2c-b1-dns-postcutover-dump.json`](./evidence/cloudflare-b4-2c-b1-dns-postcutover-dump.json)
- Post-cutover HTTP: [`evidence/cloudflare-b4-2c-b1-application-postcutover.json`](./evidence/cloudflare-b4-2c-b1-application-postcutover.json)

## 1. Result

| Item | Value |
| --- | --- |
| RESULT | **PARTIAL — HEALTHY / PROPAGATING** |
| PR #97 merge on main | YES (`0881ef3`) |
| Remote DNS diff (preflight) | **PASS** 19/19 |
| Remote DNS diff (post-cutover) | **PASS** 19/19 |
| www prepared / remote proxy | **DNS_ONLY** (`proxied: false`) |
| Zone status | **active** |
| `activated_on` | `2026-08-18T04:50:11.019408Z` |
| Rollback | **not required** |
| B2 | **NO-GO** / not executed |

Incomplete public NS TTL is **not** a fail. Parent `.com` NS TTL remains ~48h. Some resolvers still cache Vercel NS.

## 2. Preflight (before NS change)

| Gate | Result |
| --- | --- |
| origin/main | `0881ef3c072fe9f430c93d42e23579edb495d663` |
| Zone ID | `5e3dc058ed16f3aee917f1cef2e9f413` |
| Zone status before cutover | pending |
| Assigned NS | `romina.ns.cloudflare.com`, `stanley.ns.cloudflare.com` |
| `npm run b4:dns:diff -- --from-json` preflight | **pass**, www/apex/wildcard/auth/pay/mail **DNS_ONLY** |
| Production Worker Routes | **0** |
| Worker Custom Domains | **none** |
| `visutry-cf-production` | **absent** |
| Public NS before | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` |
| DNSSEC | off (`delegationSigned: false`, no DS) |
| Application baseline | Vercel serving; apex `307` → `https://www.visutry.com/`; www `307` → `/en`; no `cf-ray` on www |

## 3. NS cutover

| Field | Value |
| --- | --- |
| Executed | YES |
| Operator | Namecheap account owner (dashboard) |
| Timestamp | **2026-08-18 ~12:50 UTC+8** (`04:50` UTC). Cloudflare `activated_on` = `2026-08-18T04:50:11Z` |
| Registrar | Namecheap, Inc. |
| UI | Domain List → visutry.com → **Custom DNS** |
| Old NS | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` |
| New NS | `romina.ns.cloudflare.com`, `stanley.ns.cloudflare.com` |
| Third NS | NO |
| Stale Vercel NS in UI | NO |
| Other mutations in the same step | NONE (no DNS record edits, no proxy, no Worker) |

Registrar verification: Namecheap UI screenshot plus Verisign RDAP both show the Cloudflare pair.

## 4. Cloudflare zone after cutover

| Field | Value |
| --- | --- |
| Status | **active** |
| `activated_on` | `2026-08-18T04:50:11.019408Z` |
| Paused | false |
| Type | full |
| Assigned NS | unchanged (`romina` / `stanley`) |
| Application records | 19, all DNS_ONLY |
| www | `CNAME cname.vercel-dns-017.com` `proxied: false` |
| apex | `CNAME 1c82e566126a58cc.vercel-dns-017.com` `proxied: false` (API); public A from CF NS is Vercel anycast flattening |
| Universal SSL | unread (`certificate_packs` 403 on Zone/DNS token). **Not used in B1.** www stays DNS_ONLY. |

Do **not** orange-cloud www. B2 owns TLS readiness.

## 5. Propagation

Observed `2026-08-18T04:51:29Z`:

| Resolver | `dig NS visutry.com` |
| --- | --- |
| Namecheap UI | Cloudflare pair |
| Verisign RDAP | `ROMINA.NS.CLOUDFLARE.COM`, `STANLEY.NS.CLOUDFLARE.COM` |
| 1.1.1.1 | Cloudflare pair |
| 8.8.8.8 | Cloudflare pair |
| System resolver | still `ns1.vercel-dns.com` / `ns2.vercel-dns.com` (cached) |

`dig +trace` from this environment did not print a usable parent NS chain (timeouts). RDAP + 1.1.1.1 + 8.8.8.8 are sufficient to prove parent delegation moved.

Propagation is **not globally complete**. Do not mutate NS again to accelerate it.

## 6. Direct Cloudflare NS validation

`@romina.ns.cloudflare.com` and `@stanley.ns.cloudflare.com`:

| Query | Answer |
| --- | --- |
| www | `CNAME cname.vercel-dns-017.com` (no Cloudflare proxy A) |
| apex A | Vercel anycast (`64.29.17.x` / `216.198.79.x`) |
| MX | `5 mxbiz1.qq.com`, `10 mxbiz2.qq.com` |
| SPF | `v=spf1 include:spf.mail.qq.com ~all` |
| DMARC | `v=DMARC1; p=none;` |
| Resend DKIM | present |
| auth | existing Auth0 CNAME, DNS_ONLY |
| pay | `hosted-checkout.stripecdn.com`, DNS_ONLY |
| SES | `send` MX + TXT present |

8.8.8.8 (already on Cloudflare NS) follows www as CNAME → Vercel A. That is DNS_ONLY behavior.

## 7. Application / Auth0 / mail / Stripe

Post-cutover HTTP (same Vercel `server` header; **no `cf-ray` on www**):

| URL | Status | Notes |
| --- | --- | --- |
| `https://visutry.com` | 307 | `Location: https://www.visutry.com/` |
| `https://www.visutry.com` | 307 | `Location: /en` |
| `/en` | 200 | HTML |
| `/en/store` | 200 | HTML |
| `/en/store/ello-sunglasses` | 200 | Store detail |
| `/en/c/ello-sunglasses/petite-fit` | 200 | Campaign |
| `/en/try-on` | 307 | Vercel (same as baseline; no Cloudflare proxy) |
| `/en/face-analysis` | 200 | HTML |
| `/en/pricing` | 200 | payment entry (no purchase) |
| `/en/auth/signin` | 200 | Auth0 login entry |
| `auth.visutry.com` | 302 | Auth0 edge (`server: cloudflare` on the **Auth0** hostname, not www). CNAME unchanged. |

Interactive Auth0 login/logout was **not** completed in an automated browser (Namecheap/Cloudflare dashboard login walls). DNS + sign-in page are healthy.

Mail/Stripe provider settings were not changed. QQ DKIM selector remains **UNKNOWN** / not published.

## 8. Workers

| Check | Value |
| --- | --- |
| `visutry-cf-production` | absent |
| Production routes on this zone | **0** |
| Account Worker Custom Domains | **0** |
| Catch-all `www.visutry.com/*` | absent |

## 9. Rollback

Not used. Cloudflare zone kept intact.

Rollback target if needed later:

```text
ns1.vercel-dns.com
ns2.vercel-dns.com
```

## 10. B1 completion gate

| # | Gate | Status |
| --- | --- | --- |
| 1 | Namecheap uses Cloudflare assigned NS | **PASS** |
| 2 | Zone ACTIVE | **PASS** |
| 3 | Public resolvers progressively show Cloudflare NS | **PASS** (RDAP / 1.1.1.1 / 8.8.8.8; system resolver still cached) |
| 4 | Cloudflare-authoritative records match | **PASS** |
| 5 | www DNS_ONLY | **PASS** |
| 6 | Application healthy | **PASS** |
| 7 | Auth0 DNS / sign-in entry healthy | **PASS** (no automated full login) |
| 8 | Mail DNS healthy | **PASS** |
| 9 | Stripe/pay DNS healthy | **PASS** |
| 10 | Production Worker Routes = 0 | **PASS** |
| 11 | www Custom Domain = none | **PASS** |
| 12 | No rollback | **PASS** |

Global NS TTL cache is why the overall result is **PARTIAL**, not FAIL.

## 11. Stop — do not start B2

Even though the zone is **ACTIVE**:

- Do **not** enable www proxy
- Do **not** attach Worker Routes
- Do **not** bind `www.visutry.com` as a Custom Domain
- Do **not** treat Universal SSL as a B1 dependency

B2 remains a separate review.
