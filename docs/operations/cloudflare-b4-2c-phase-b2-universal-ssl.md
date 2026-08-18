# VisuTry Cloudflare B4.2C Phase B — Checkpoint B2 (Universal SSL readiness)

**Status:** BLOCKED — SSL API permissions insufficient  
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
| SSL mode | **UNKNOWN** (API HTTP 403 / code 9109) |
| Universal SSL enabled | **UNKNOWN** (API HTTP 403 / code 9109) |
| Certificate pack status | **UNKNOWN** (API HTTP 403 / code 9109) |
| Covers `visutry.com` / `www.visutry.com` | **UNKNOWN** |
| www proxy | **DNS_ONLY** (authoritative CNAME still returned; no `cf-ray` on www) |
| Worker Routes | **0** |
| `visutry-cf-production` | **ABSENT** |
| Application | Vercel path healthy |
| B3 | **NO-GO** / not executed |

B2 cannot be **PASS**. Certificate pack `ACTIVE` was not read from the Cloudflare SSL API. Public `https://www.visutry.com` TLS is Vercel Let’s Encrypt and is **not** proof of Cloudflare Universal SSL.

B2 is **BLOCKED**, not **WAITING**: issuance status itself was never visible. Waiting would require a seen pack in `pending_*` / `initializing`.

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
| Live DNS API `proxied` field | **not re-read** — Wrangler OAuth `GET /zones/:id/dns_records` HTTP **403** code **10000** |
| Last B1 API dump | www `proxied: false` (`docs/operations/evidence/cloudflare-b4-2c-b1-dns-postcutover-dump.json`) |
| Production Worker Routes | **0** |
| Worker Custom Domains | **none** |
| `visutry-cf-production` | **absent** (Wrangler deployments list code **10007**) |

www was **not** unexpectedly proxied. Checkpoint continued.

Do not infer proxy status from public A records alone. Source of truth for orange-cloud is the Cloudflare DNS `proxied` boolean. That field could not be re-read in B2; the authoritative CNAME answer plus absent `cf-ray` on www are consistent with DNS_ONLY.

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

No temporary **SSL and Certificates Read** token was present in the shell. Inspection used Wrangler OAuth (`cfoa…`, scopes include `zone:read` and `ssl_certs:write`). Token values are not stored.

Wrangler `ssl_certs` is **not** equivalent to zone **SSL and Certificates Read**. It did not authorize certificate-pack or SSL-mode reads.

| Endpoint | HTTP | Cloudflare code | Meaning |
| --- | --- | --- | --- |
| `GET /zones/5e3dc058ed16f3aee917f1cef2e9f413` | 200 | — | zone readable |
| `GET /zones/:id/settings/ssl` | **403** | **9109** | SSL mode unread |
| `GET /zones/:id/ssl/universal/settings` | **403** | **9109** | Universal SSL unread |
| `GET /zones/:id/ssl/certificate_packs` | **403** | **9109** | packs unread |
| `GET /zones/:id/ssl/certificate_packs?status=all` | **403** | **9109** | packs unread |
| `GET /zones/:id/dns_records` | **403** | **10000** | DNS unread |
| `GET /zones/:id/workers/routes` | 200 | — | routes = `[]` |
| `GET /accounts/:id/workers/domains` | 200 | — | custom domains = `[]` |
| `GET /accounts/:id/workers/scripts` | 200 | — | no `visutry-cf-production` |

Required minimum token to finish B2 (read only; do not widen):

- Zone / Zone / Read
- Zone / SSL and Certificates / Read
- Zone / DNS / Read (to reconfirm `proxied: false`)

Do **not** guess certificate state. Do **not** change SSL mode to force a PASS.

## 6. SSL/TLS mode

Expected future architecture: **Full (strict)**.

Actual value: **UNKNOWN**.

Per B2 gate: if the value is not confirmed Full (strict), B2 is **BLOCKED**. Mode was **not** changed.

## 7. Universal SSL / certificate packs

| Field | API value |
| --- | --- |
| Universal SSL enabled | UNKNOWN |
| Pack type | UNKNOWN |
| Pack status | UNKNOWN |
| Hosts / SANs | UNKNOWN |
| Issuer | UNKNOWN |
| Validity | UNKNOWN |
| Certificate authority | UNKNOWN |
| Validation errors | UNKNOWN |

Zone **active** is not treated as certificate **ACTIVE**.

Indirect CAA observation (not used for PASS): Cloudflare nameservers now answer extra CAA records that are **not** in the B1 API dump. Cloudflare documents this auto-insertion when Universal SSL is on and the zone already has CAA records. That is compatible with Universal SSL being enabled, but it is **not** a certificate-pack status.

## 8. CAA review

Prepared zone CAA (B1 API dump, unchanged in this task):

- `0 issue "letsencrypt.org"`
- `0 issue "pki.goog"`
- `0 issue "sectigo.com"`

Authoritative `dig CAA visutry.com @romina.ns.cloudflare.com` also returns Cloudflare-synthesized records (not shown in the DNS API dump), including `ssl.com`, `issuewild` variants, `pki.goog; cansignhttpexchanges=yes`, plus `comodoca.com` / `digicert.com` answers. Cloudflare states auto-added CAA will not appear in the dashboard.

CAA was **not** modified.

Compatibility: the prepared set already authorizes Let’s Encrypt, Google Trust Services, and Sectigo — the CAs Cloudflare currently uses for Universal SSL. No CAA issuance-failure object was readable from the API. CAA is **not** treated as a B2 fail; it also cannot upgrade B2 to PASS.

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

This only shows the **current Vercel origin** can satisfy Full (strict) hostname matching. It does not show that Cloudflare edge certs are ACTIVE.

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
| 2 | SSL mode = Full (strict) | **UNKNOWN → BLOCKED** |
| 3 | Universal SSL enabled | **UNKNOWN → BLOCKED** |
| 4 | Active edge certificate exists | **UNKNOWN → BLOCKED** |
| 5 | Certificate covers `visutry.com` | **UNKNOWN → BLOCKED** |
| 6 | Certificate covers `www.visutry.com` | **UNKNOWN → BLOCKED** |
| 7 | Certificate currently valid | **UNKNOWN → BLOCKED** |
| 8 | No issuance / CAA error | **UNKNOWN** (CAA compatible; issuance errors unread) |
| 9 | www remains DNS_ONLY | **PASS** (authoritative CNAME; no www `cf-ray`) |
| 10 | Worker Routes = 0 | **PASS** |
| 11 | Custom Domain = NONE | **PASS** |
| 12 | Production application healthy | **PASS** |

**B2 = BLOCKED**

Unblock: provide a temporary shell token with Zone Read + SSL and Certificates Read (+ DNS Read). Re-run the three SSL GET endpoints only. Do not enable www proxy to “see” a cert.

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
