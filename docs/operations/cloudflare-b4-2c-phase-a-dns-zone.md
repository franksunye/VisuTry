# VisuTry Cloudflare B4.2C Phase A — Production DNS / Cloudflare Zone Preparation

**Status:** PARTIAL — www origin frozen; NS-cutover www is DNS_ONLY; inactive Cloudflare zone **not** created (`zone.create` 403)
**Date:** 2026-08-18  
**Owner:** Product / Engineering  
**Branch:** `cursor/cloudflare-b4-2c-phase-a-dns-zone`  
**Starting SHA:** `ea7d4bf01ba013eb03571e5ba81d2c2d62c52c60` (PR #95 merge on `origin/main`)

**Production nameservers changed:** NO  
**Production DNS changed at Vercel:** NO  
**Production traffic moved:** NO  
**www Worker Custom Domain:** NO  
**Production Worker Routes:** 0  
**Auth0 / Stripe / mail provider changed:** NO  
**Merged:** NO

This phase prepares Cloudflare DNS so a later nameserver switch can be an independent checkpoint. It does **not** cut over traffic, attach Worker Routes, or bind `www.visutry.com` as a Custom Domain.

Related:

- [`cloudflare-b4-2b-scoped-production-routes.md`](./cloudflare-b4-2b-scoped-production-routes.md)
- Frozen www target: `cloudflare-router/b4-production-dns.inspect.json`
- Desired inactive-zone records: `cloudflare-router/b4-production-dns.desired.json`
- Live snapshot: [`evidence/cloudflare-b4-2c-dns-precutover.json`](./evidence/cloudflare-b4-2c-dns-precutover.json)
- Diff validator: `cloudflare-router/b4-dns-zone-diff.ts`

## 1. Result

| Item | Value |
| --- | --- |
| RESULT | **PARTIAL** |
| PR #95 merge on main | YES (`ea7d4bf`) |
| `requireFrozenWwwDnsTarget()` | **PASS** (`CNAME cname.vercel-dns-017.com`) |
| Live DNS inventory | **PASS** (`vercel dns ls` + dig + RDAP) |
| www NS-cutover proxy | **DNS_ONLY** (`futureProxy: PROXIED` after Universal SSL) |
| Cloudflare zone exists | **NO** |
| Zone created this phase | **NO** — temporary API token retry: account `8f2fca159ffbd0e5d9446dfa6280f40d` confirmed; `GET /zones?name=visutry.com` result_count=0; `POST /zones` HTTP 403: `Requires permission "com.cloudflare.api.account.zone.create" to create zones for the selected account`. Token was not persisted, printed, or written to the repo. Permissions were not broadened. |
| Records copied into Cloudflare | **NO** |
| Cloudflare publicly authoritative | **NO** |
| B4.2C Phase B | **NO-GO** |

Creating `visutry.com` in Cloudflare does **not** change Namecheap nameservers. The blocker is API permission, not a safety stop. Do not change NS at the registrar to work around it.

## 2. Current authoritative DNS

| Field | Live value |
| --- | --- |
| Authoritative provider | Vercel DNS |
| Registrar | Namecheap, Inc. (IANA 1068) |
| Public NS | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` |
| Parent `.com` NS TTL | **172800** (48h) |
| In-zone NS TTL | 86400 |
| Apex | Flattened A (Vercel anycast). HTTPS `307` → `https://www.visutry.com/` (`server: Vercel`) |
| www | Flattened A (Vercel anycast). HTTPS `307` → `/en` (`server: Vercel`) |
| AAAA | none |
| MX | `5 mxbiz1.qq.com`, `10 mxbiz2.qq.com` (TTL 60) |
| SPF | `v=spf1 include:spf.mail.qq.com ~all` |
| DMARC | `v=DMARC1; p=none;` |
| DNSSEC | **Off** (`secureDNS.delegationSigned: false`, no DS at parent) |
| Catch-all | Vercel `* ALIAS cname.vercel-dns-017.com` — unused names (`mail`, `api`, `_vercel`, …) also return Vercel A. Those are **not** real hosts. |

Frozen Vercel origin (do **not** use docs examples):

| Host | Vercel-managed ALIAS | Cloudflare record to prepare |
| --- | --- | --- |
| `www` / `*` | `cname.vercel-dns-017.com` | `CNAME www → cname.vercel-dns-017.com` |
| apex `@` | `1c82e566126a58cc.vercel-dns-017.com` | `CNAME @ → 1c82e566126a58cc.vercel-dns-017.com` (flattening) |

`cname.vercel-dns.com` and `cname.vercel-dns-0.com` were **not** returned for this project.

## 3. Complete record inventory

Source of truth: `vercel dns ls visutry.com` (2026-08-18), confirmed with `dig @ns1.vercel-dns.com`.

| hostname | type | value | TTL | Cloudflare proxy (prepared) |
| --- | --- | --- | --- | --- |
| `@` | ALIAS → CNAME | `1c82e566126a58cc.vercel-dns-017.com` | 1800 flattened | DNS_ONLY |
| `www` / `*` | ALIAS → CNAME | `cname.vercel-dns-017.com` | 1800 flattened | www **DNS_ONLY** at NS cutover; `futureProxy: PROXIED` after Universal SSL ACTIVE; `*` DNS_ONLY |
| `@` | MX | `5 mxbiz1.qq.com` / `10 mxbiz2.qq.com` | 60 | DNS_ONLY |
| `@` | TXT | QQ SPF | 60 | DNS_ONLY |
| `@` | CAA | letsencrypt / pki.goog / sectigo | 60 | DNS_ONLY |
| `_dmarc` | TXT | `v=DMARC1; p=none;` | 60 | DNS_ONLY |
| `resend._domainkey` | TXT | Resend DKIM | 60 | DNS_ONLY |
| `auth` | CNAME | Auth0 edge tenant | 60 | DNS_ONLY |
| `pay` | CNAME | `hosted-checkout.stripecdn.com` | 60 | DNS_ONLY |
| `_acme-challenge.pay` | TXT | Stripe ACME | 60 | DNS_ONLY |
| `send` | MX + TXT | SES feedback + SES SPF | 60 | DNS_ONLY |
| `thangka` | CNAME | `thangkavault.pages.dev` | 60 | DNS_ONLY |
| `cf-test` | CNAME | `stockwise-pages-test.pages.dev` | 60 | DNS_ONLY |
| `answer` | CNAME | `franksunye.github.io` | 60 | DNS_ONLY |

Not present in the Vercel zone (do not invent):

- Google / Bing verification TXT
- QQ Exmail DKIM selector (`s1` / `s2` / `tencent` / `default._domainkey`) — **UNKNOWN / NEEDS HUMAN CONFIRMATION** if Tencent requires a selector that was never published

## 4. Mail safety

| Record | hostname | current | future CF | proxy |
| --- | --- | --- | --- | --- |
| MX | `@` | QQ `mxbiz1`/`mxbiz2` | identical | DNS_ONLY |
| SPF | `@` | `include:spf.mail.qq.com ~all` | identical | DNS_ONLY |
| DKIM | `resend._domainkey` | Resend public key | identical | DNS_ONLY |
| DKIM | QQ selectors | **not in zone** | do not invent | n/a |
| DMARC | `_dmarc` | `p=none` | identical | DNS_ONLY |
| SES | `send` MX/TXT | Amazon SES | identical | DNS_ONLY |

Mail provider configuration was not changed. Risk if MX/SPF/DKIM are dropped or orange-clouded: inbound QQ mail and Resend authentication fail. Validator fails on proxied MX.

## 5. Cloudflare zone state

| Field | Value |
| --- | --- |
| Existed before | NO (`GET /zones?name=visutry.com` → empty) |
| Created | NO |
| Authoritative publicly | NO — parent still delegates to Vercel |
| Assigned CF NS | unknown until zone exists |
| Production Worker | **absent** (`visutry-cf-production` 404) |
| Staging Worker | `visutry-cf-staging` (`workers.dev` enabled) |
| Worker Custom Domains | none |
| Production routes | 0 |

Wrangler OAuth on this machine can read zones and Workers. A temporary account-scoped API token authenticated to the correct account and could list zones, but `POST /zones` still returned HTTP 403 missing `com.cloudflare.api.account.zone.create`. **Zone:DNS:Edit is not enough.** The next token needs account-scoped **Zone:Zone:Edit** (include all zones from this account, because `visutry.com` does not exist yet) plus **Zone:DNS:Edit**. Do not paste the token into chat or the repo.

**Allowed next operator action (not done here):** create `visutry.com` as a full zone with jump-start **off**, leave Namecheap NS on Vercel, copy `b4-production-dns.desired.json`. If any integration would mutate registrar NS automatically: **STOP**.

## 6. www future origin

Prepared (not live):

```text
www.visutry.com  CNAME  cname.vercel-dns-017.com  DNS_ONLY
```

| Field | Value |
| --- | --- |
| Record type | CNAME |
| Target | `cname.vercel-dns-017.com` (frozen; unchanged) |
| TTL | Cloudflare Auto (`1`); live flattened TTL is 1800 — reported, not a fail |
| NS-cutover proxy (B1) | **DNS_ONLY** |
| Future proxy (B3) | **PROXIED**, only after zone ACTIVE **and** Universal SSL ACTIVE |
| Current inactive-zone proxy | not applied (no zone) |
| Affects traffic now | **NO** |
| Vercel ownership | `www.visutry.com` remains a Vercel project domain |
| SSL | Full (strict) after the zone is Active. Universal SSL typically issues only once Cloudflare is authoritative. Do not lower SSL to Flexible. Do not orange-cloud www until that certificate is ACTIVE. |

B1 expected path (nameserver only, www grey-cloud):

```text
Browser → Cloudflare authoritative DNS → Vercel directly
```

B3 expected path (after TLS PASS, www orange-cloud, still zero Worker Routes):

```text
Browser → Cloudflare edge → Vercel origin
```

Do **not** combine NS migration, proxy activation, and TLS issuance in one checkpoint.

## 7. Apex plan

Current: `https://visutry.com` → Vercel `307` → `https://www.visutry.com/`.

Prepared: apex CNAME flattening to `1c82e566126a58cc.vercel-dns-017.com`, **DNS_ONLY**. That keeps the Vercel redirect after NS cutover without a Cloudflare Redirect Rule and without running the application Worker on apex.

Do **not** activate a Cloudflare Redirect Rule in this phase. Evaluate Redirect Rule vs Vercel 307 only after nameserver health is proven.

## 8. Proxy-status matrix

See §3. Rules applied:

- MX / SPF / DKIM / DMARC / verification / Auth0 / Stripe / SES / legacy CNAMEs = DNS_ONLY
- `*` wildcard = DNS_ONLY (must not feed the Worker)
- `www` = **DNS_ONLY** for NS cutover; `futureProxy: PROXIED` is B3 after Universal SSL
- Live Vercel records were not proxied and were not edited

## 9. DNS diff validator

```bash
npm run b4:dns:diff
# skipped (exit 2) until a Cloudflare dump exists

npm run b4:dns:diff -- --from-json attached-dns.json
```

Detects missing / unexpected / value / MX priority / TXT / CAA / unexpected proxy. TTL inequality is reported by operators, not treated as a fail. Compares desired state vs Cloudflare dump, not live flattened A vs CNAME.

Phase A/B1 **fails** if remote `www` is proxied. It **passes** only when `www` is DNS_ONLY.

This run: `npm run b4:dns:diff` → **skipped** (no dump). Zone create is blocked on API token permission (see §5).

## 10. SSL / TLS

| Item | Finding |
| --- | --- |
| Planned mode | Full (strict) |
| Vercel origin HTTPS | YES (`server: Vercel`, HTTP→HTTPS 308) |
| Universal SSL / edge cert | not issuable until the zone is Active and publicly authoritative |
| Proxy activation allowed now | **NO** |
| Hard gate | zone ACTIVE **and** Universal SSL ACTIVE before `www DNS_ONLY → PROXIED` |

Do not infer certificate readiness. Read the actual Cloudflare certificate state in B2. If pending: **STOP**.

Do not change public SSL now.

Cloudflare may add extra CAA authorizations for Universal SSL after activation. Copy the current Vercel CAA set faithfully. Do not invent extra CAA values to make the diff pass. Document any Cloudflare-managed CAA difference before Phase B; do not hide it.

## 11. Worker + route revalidation (main)

Runtime Worker/router code was **not** changed in this phase.

| Check | Result |
| --- | --- |
| Generated total | 286 |
| Ungated P0 | 12 |
| Catch-all `www.visutry.com/*` | absent |
| Custom Domain | absent |
| Greedy `/images*` | absent (`/images/*` only) |
| Store detail | unmatched → Vercel |
| Campaign | unmatched → Vercel |
| Auth | unmatched → Vercel |
| `/_next/image` | unmatched → Vercel |
| `/api/glasses/frames` | unmatched → Vercel |
| `/_next/static/*` | parity-gated |

`wrangler.jsonc` still has staging `workers_dev` only. `deploy:cloudflare` remains `--env staging`.

## 12. Nameserver change plan — DO NOT EXECUTE

| | Value |
| --- | --- |
| Current NS | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` |
| Future NS | Cloudflare-assigned pair (unknown until zone exists) |
| Where | Namecheap → Domain List → visutry.com → Nameservers (custom) |
| DNSSEC | Off. Phase B is **not** blocked by DS/DNSSEC. Do not enable/disable DNSSEC now. |
| Parent TTL | 48h at `.com`. Plan the cutover with that lag. |

### TTL recommendation (do not apply now)

| Record | Current | Recommended before Phase B | Restore |
| --- | --- | --- | --- |
| Apex/www flattened A | 1800 | optional 300 ≥ 24h before NS change (Vercel DNS edit — **not done**) | after stability |
| MX/TXT/auth | 60 | already low | keep |
| Parent NS | 172800 | cannot be lowered from in-zone records; registrar/TLD TTL | n/a |

Do **not** edit live Vercel TTLs in this phase.

## 13. Rollback

**Worker Route rollback (later phase):** delete attached routes. Minutes. Does not restore NS.

**Phase B DNS rollback:** at Namecheap, set nameservers back to:

```text
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Propagation follows the **48h parent NS TTL** (often faster, never guaranteed instant). Keep the Vercel zone intact so rollback has a complete origin.

## 14. Phase B sequence — DO NOT EXECUTE

T-24h / preparation (still Phase A leftovers if the zone is missing)

1. Create Cloudflare zone `visutry.com` (full, jump-start off) **without** touching Namecheap NS.
2. Copy `b4-production-dns.desired.json` with **www DNS_ONLY**.
3. `npm run b4:dns:diff -- --from-json <cloudflare-dns-dump.json>` must PASS, including `www` proxy = DNS_ONLY.
4. Verify MX/SPF/DKIM/DMARC/`auth`/`pay` grey-cloud.
5. Confirm DNSSEC still unsigned.
6. Confirm public NS still Vercel until B1.
7. Snapshot live DNS again.

### CHECKPOINT B1 — authoritative DNS only

Namecheap:

```text
ns1.vercel-dns.com / ns2.vercel-dns.com
→ Cloudflare assigned NS
```

At this point:

- `www` = DNS_ONLY
- Worker Routes = 0
- Custom Domain = none

Expected request path:

```text
Browser → Cloudflare authoritative DNS → Vercel directly
```

Verify:

- www
- apex redirect
- Auth0 login/logout
- Store
- Campaign
- Try-On
- payments
- AI entry
- MX / SPF / DKIM / DMARC
- Auth0 CNAME
- Stripe / `pay` CNAME

No Cloudflare application proxy or TLS certificate dependency yet.

### CHECKPOINT B2 — Cloudflare TLS readiness

Wait until:

- zone status = **ACTIVE**
- Universal SSL covering `visutry.com` and `www.visutry.com` is **ACTIVE**

Do not infer certificate readiness. Read the actual Cloudflare certificate state. If pending: **STOP**.

### CHECKPOINT B3 — enable www proxy

Only after B2 PASS:

```text
www: DNS_ONLY → PROXIED
```

Still: Worker Routes = 0.

Expected:

```text
Browser → Cloudflare edge → Vercel origin
```

Verify TLS, HTTP status, redirects, canonical host, Auth0, Store, Campaign, Try-On, payments, static assets, and no origin loop. Observe before proceeding.

### CHECKPOINT B4 — Worker work is later

Do **not** attach P0 Worker Routes here. Worker activation remains a separate later phase.

Nameserver migration, Cloudflare proxy/TLS, and Worker activation **must remain separate**.

## 15. Production safety (this phase)

| Check | Value |
| --- | --- |
| Authoritative NS changed | NO |
| Live Vercel DNS changed | NO |
| Traffic moved | NO |
| www Cloudflare proxy active publicly | NO |
| Worker Routes activated | NO |
| www Custom Domain | NO |
| Auth0 production changed | NO |
| Stripe production changed | NO |
| Mail provider changed | NO |

## 16. Next step

Create a new temporary API token with account-scoped **Zone:Zone:Edit** + **Zone:DNS:Edit** (include all zones from account `8f2fca159ffbd0e5d9446dfa6280f40d`). Put it in the shell only as `CLOUDFLARE_API_TOKEN`. Then create the inactive full zone, copy www **DNS_ONLY** records, and run `b4:dns:diff`. Do **not** change Namecheap NS. Revoke the previous token; it lacked `zone.create`.

**Do not execute Phase B from this PR.**
