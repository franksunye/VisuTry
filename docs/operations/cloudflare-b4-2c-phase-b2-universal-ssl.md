# VisuTry Cloudflare B4.2C Phase B — Checkpoint B2 (Universal SSL readiness)

**Status:** BLOCKED — SSL/TLS mode is `full` (Full), not Full (strict)
**Date:** 2026-08-18
**Owner:** Product / Engineering  
**Branch:** `cursor/cloudflare-b4-2c-phase-b2-universal-ssl`  
**Starting SHA:** `b56e6487b0759fe7f3533cbdf4c56da0a6aec649` (PR #98 merge on `origin/main`)

**www Cloudflare proxy:** NO (still DNS_ONLY; B3 not executed)  
**SSL/TLS mode mutated:** NO  
**Universal SSL mutated:** NO  
**Certificate packs mutated:** NO  
**Origin certificates issued:** NO  
**Production Worker Routes:** 0  
**www Worker Custom Domain:** NONE  
**B3 / P0 attach:** NOT EXECUTED  
**Merged:** NO

This checkpoint is **readiness only**. It inspects whether Cloudflare edge TLS is fully ready for `visutry.com` and `www.visutry.com` before any orange-cloud change.

Current production path (unchanged):

```text
Browser → Cloudflare authoritative DNS → www DNS_ONLY → Vercel → VisuTry
```

Related:

- [`cloudflare-b4-2c-phase-b1-ns-cutover.md`](./cloudflare-b4-2c-phase-b1-ns-cutover.md)
- Evidence: [`evidence/cloudflare-b4-2c-b2-zone-ssl.json`](./evidence/cloudflare-b4-2c-b2-zone-ssl.json)

## 1. Result

| Item | Value |
| --- | --- |
| RESULT | **BLOCKED** |
| PR #98 merge on main | YES (`b56e648`) |
| Zone status | **active** |
| `activated_on` | `2026-08-18T04:50:11.019408Z` |
| SSL mode | **full** (Cloudflare **Full**, not **Full (strict)**) — **not changed** |
| Universal SSL enabled | **true** |
| Certificate pack type | **universal** |
| Certificate pack status | **active** |
| Hosts | `visutry.com`, `*.visutry.com` (wildcard covers `www.visutry.com`) |
| Issuer | Google Trust Services (`certificate_authority: google`) |
| Valid to | `2026-11-16T04:50:11Z` |
| Validation errors | none (`null`) |
| www / apex proxy | **DNS_ONLY** (`proxied: false` via DNS API) |
| Worker Routes | **0** |
| `visutry-cf-production` | **ABSENT** |
| Application | Vercel path healthy |
| B3 | **NO-GO** / not executed |

B2 cannot be **PASS**. The edge certificate is ACTIVE and Universal SSL is enabled, but SSL mode is **Full** (`value: full`), not **Full (strict)** (`value: strict`). Mode was **not** mutated.

B2 is **BLOCKED**, not **WAITING**: the pack is `active`; the remaining gate is SSL mode.

## 2. Baseline

| Field | Value |
| --- | --- |
| `origin/main` | `b56e6487b0759fe7f3533cbdf4c56da0a6aec649` |
| PR #98 merge present | YES |
| B1 | CLOSED / PASS |
| Fresh branch | `cursor/cloudflare-b4-2c-phase-b2-universal-ssl` |
| Worktree | `/Users/yesun/Code/visutry-cf-b4-2c-phase-b2` |
| Starting working tree | clean |

## 3. Production safety preflight

| Gate | Result |
| --- | --- |
| Zone ID | `5e3dc058ed16f3aee917f1cef2e9f413` |
| Zone status | **active** (`paused: false`, `type: full`) |
| Assigned NS | `romina.ns.cloudflare.com`, `stanley.ns.cloudflare.com` |
| Public NS (`1.1.1.1`, `8.8.8.8`, `@romina`) | Cloudflare pair |
| Local system resolver NS | still `ns1.vercel-dns.com` / `ns2.vercel-dns.com` (residual TTL; not used as source of truth) |
| www | authoritative `CNAME cname.vercel-dns-017.com` — **not** Cloudflare anycast A |
| apex | flattened A to Vercel (`216.198.79.x` / `64.29.17.x`) |
| Live DNS API `proxied` field | **re-read 2026-08-18T06:41:12Z** |
| www | `CNAME cname.vercel-dns-017.com`, **`proxied: false`** |
| apex | `CNAME 1c82e566126a58cc.vercel-dns-017.com`, **`proxied: false`** |
| Production Worker Routes | **0** |
| Worker Custom Domains | **none** |
| `visutry-cf-production` | **absent** (Wrangler deployments list code **10007**) |

www was **not** unexpectedly proxied. Checkpoint continued.

Do not infer proxy status from public A records alone. Source of truth for orange-cloud is the Cloudflare DNS `proxied` boolean, now confirmed `false` for www and apex.

## 4. Public DNS

Captured against system resolver, `1.1.1.1`, `8.8.8.8`, and `@romina.ns.cloudflare.com`.

| Query | Authoritative / public recursive | Notes |
| --- | --- | --- |
| `NS visutry.com` | `romina` / `stanley` | System resolver still cached Vercel NS |
| `CNAME www.visutry.com` | `cname.vercel-dns-017.com` | DNS_ONLY behavior: CNAME is visible |
| `A www.visutry.com` | follows Vercel CNAME (`64.29.17.x` / `216.198.79.x`) | not Cloudflare proxy IPs |
| `A visutry.com` | Vercel anycast A (flattening) | do not freeze these IPs |
| `MX visutry.com` | `5 mxbiz1.qq.com`, `10 mxbiz2.qq.com` | unchanged |

## 5. SSL API access

Retry 3 used a new temporary user API token in the shell only (Zone Read + SSL and Certificates Read + DNS Read + Zone Settings Read). Token values are not stored and were unset after the reads.

| Endpoint | Retry 1 | Retry 2 | Retry 3 |
| --- | --- | --- | --- |
| `GET /zones/:id/settings/ssl` | 403 / 9109 | 403 / 9109 | **200** `value: full` |
| `GET /zones/:id/ssl/universal/settings` | 403 / 9109 | 200 enabled | **200** enabled, CA google |
| `GET /zones/:id/ssl/certificate_packs?status=all` | 403 / 9109 | 200 active | **200** universal `active` |
| www / apex DNS `proxied` | unread | `false` | **`false`** |
| Worker Routes | 0 | 0 | **0** |

Do **not** change SSL mode to force a PASS.

## 6. SSL/TLS mode

Expected future architecture: **Full (strict)** (`value: strict`).

Actual value: **`full`** (dashboard label **Full**). Captured `2026-08-18T06:50:21Z`.

| Field | Value |
| --- | --- |
| `id` | `ssl` |
| `value` | `full` |
| `certificate_status` | `active` |
| `validation_errors` | `[]` |
| `editable` | `true` |
| `modified_on` | `null` |

`full` encrypts origin connections but does **not** validate the origin certificate. `strict` is required for B2 PASS. Mode was **not** PATCHed.

## 7. Universal SSL / certificate packs

Captured `2026-08-18T06:50:21Z` from `GET /zones/:id/ssl/certificate_packs?status=all` (unchanged ACTIVE pack).

| Field | API value |
| --- | --- |
| Universal SSL enabled | **true** |
| Preferred CA on Universal SSL setting | `google` |
| Pack ID | `c5ca5211-fb30-48b6-a518-d2700c1aefc2` |
| Pack type | **universal** |
| Pack status | **active** |
| Hosts / SANs | `visutry.com`, `*.visutry.com` |
| Covers `www.visutry.com` | YES via wildcard `*.visutry.com` (not a separate SAN) |
| Primary certificate | `bce46cee-1953-4ec6-849b-b381cf5dd2e9` |
| Certificate status | **active** |
| Issuer | `GoogleTrustServices` |
| Certificate authority | `google` |
| Signature | `ECDSAWithSHA256` |
| Uploaded on | `2026-08-18T06:50:26.184206Z` |
| Expires on | `2026-11-16T04:50:11.000000Z` |
| Validity days | 90 |
| Validation method | `txt` |
| Validation errors | `null` |

Public `https://www.visutry.com` TLS remains Vercel Let’s Encrypt and is still **not** the Cloudflare edge certificate (www is DNS_ONLY).

## 8. CAA review

Prepared zone CAA (re-read 2026-08-18T06:41:12Z, unchanged):

- `0 issue "letsencrypt.org"`
- `0 issue "pki.goog"`
- `0 issue "sectigo.com"`

Authoritative `dig CAA visutry.com @romina.ns.cloudflare.com` also returns Cloudflare-synthesized records (not shown in the DNS API dump), including `ssl.com`, `issuewild` variants, `pki.goog; cansignhttpexchanges=yes`, plus `comodoca.com` / `digicert.com` answers. Cloudflare states auto-added CAA will not appear in the dashboard.

CAA was **not** modified.

Compatibility: current edge issuer is **Google Trust Services**. Prepared CAA includes `pki.goog`. Pack `validation_errors` is `null`. CAA was **not** modified. CAA is compatible and is **not** the B2 blocker.

Vercel CNAME-target CAA (`cname.vercel-dns-017.com`) is a separate set (`globalsign.com`, `letsencrypt.org`, `pki.goog`, `sectigo.com`) and was not changed.

## 9. Public TLS (Vercel path — not Cloudflare edge)

Because www remains DNS_ONLY, `https://www.visutry.com` still terminates TLS at **Vercel**.

| Host | Issuer | CN / SAN | Validity | Server |
| --- | --- | --- | --- | --- |
| `www.visutry.com` | Let’s Encrypt `YR2` | `*.visutry.com`, `visutry.com` | 2026-06-22 → 2026-09-20 | `Vercel` |
| `visutry.com` | Let’s Encrypt `YR2` | `visutry.com` | 2026-06-23 → 2026-09-21 | `Vercel` |

www `cf-ray`: **absent**  
www `cf-cache-status`: **absent**  
www `server: cloudflare`: **NO**

This public certificate is **not** proof of Cloudflare Universal SSL readiness.

`https://auth.visutry.com` returns `server: cloudflare` and a `cf-ray`. That is **Auth0’s** edge, not VisuTry www orange-cloud.

## 10. Origin TLS for future Full (strict)

Connecting to `cname.vercel-dns-017.com:443` with SNI `www.visutry.com` presented the same valid Let’s Encrypt certificate (`CN=*.visutry.com`, SAN includes `visutry.com` and `*.visutry.com`, unexpired).

Normal production HTTPS for `www.visutry.com` / `visutry.com` also presents valid Vercel certificates. No Origin CA certificates were created. Host handling was not changed.

This shows the **current Vercel origin** can satisfy Full (strict) hostname matching. Cloudflare edge certs are ACTIVE in the API, but www still does not use them because it remains DNS_ONLY.

## 11. Application health

All checks still served by Vercel. No data created. Auth settings not mutated.

| URL | Status | Server | `cf-ray` |
| --- | --- | --- | --- |
| `https://visutry.com` | 307 → `https://www.visutry.com/` | Vercel | none |
| `https://www.visutry.com` | 307 → `/en` | Vercel | none |
| `https://www.visutry.com/en` | 200 | Vercel | none |
| `https://www.visutry.com/en/store` | 200 | Vercel | none |
| `https://www.visutry.com/en/store/ello-sunglasses` | 200 | Vercel | none |
| `https://www.visutry.com/en/c/ello-sunglasses/petite-fit` | 200 | Vercel | none |
| `https://www.visutry.com/en/try-on` | 307 | Vercel | none (same as B1) |
| `https://www.visutry.com/en/face-analysis` | 200 | Vercel | none |
| `https://www.visutry.com/en/pricing` | 200 | Vercel | none |
| `https://www.visutry.com/en/auth/signin` | 200 | Vercel | none |

## 12. Worker safety recheck

| Item | Result |
| --- | --- |
| Production Worker `visutry-cf-production` | ABSENT |
| Worker Routes | 0 |
| www Worker Custom Domain | NONE |
| Staging workers present (untouched) | `visutry-cf-staging`, `visutry-cf-staging-router` |

Nothing was deployed.

## 13. B2 decision gate

| # | Requirement | Result |
| --- | --- | --- |
| 1 | Cloudflare zone ACTIVE | **PASS** |
| 2 | SSL mode = Full (strict) | **BLOCKED** (actual `full` / Full; not mutated) |
| 3 | Universal SSL enabled | **PASS** (`enabled: true`) |
| 4 | Active edge certificate exists | **PASS** (universal pack `active`) |
| 5 | Certificate covers `visutry.com` | **PASS** |
| 6 | Certificate covers `www.visutry.com` | **PASS** via `*.visutry.com` |
| 7 | Certificate currently valid | **PASS** (expires `2026-11-16T04:50:11Z`) |
| 8 | No issuance / CAA error | **PASS** (`validation_errors: null`; CAA includes `pki.goog`) |
| 9 | www remains DNS_ONLY | **PASS** (`proxied: false`) |
| 10 | Worker Routes = 0 | **PASS** |
| 11 | Custom Domain = NONE | **PASS** |
| 12 | Production application healthy | **PASS** |

**B2 = BLOCKED** (SSL mode is Full, not Full (strict))

Changing `full` → `strict` is a **separate approval**. It is not part of B2 inspect-only work and was **not** executed. Do not enable www proxy.

## 14. B3

**NO-GO.**

Even a future B2 PASS does not execute B3. B3 remains a separate approval:

```text
Cloudflare authoritative DNS → www PROXIED → Cloudflare edge → Vercel origin
```

Worker Routes must still be 0 after B3. This task did **not**:

- set www DNS_ONLY → PROXIED
- enable orange-cloud on apex
- attach Worker Routes
- bind www as a Worker Custom Domain
- change SSL mode / Always Use HTTPS / Redirect Rules
- change Auth0 / Stripe / mail / registrar NS

## 15. Runtime code

No application or Cloudflare router runtime code changed in this checkpoint. Docs and sanitized evidence only.
