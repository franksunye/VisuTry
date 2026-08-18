# VisuTry Cloudflare B4.2B — Scoped Production Worker Routes

**Status:** PASS with cutover gates — scoped routing architecture is unchanged. PR #95 hardening: directory `/*` static wildcards, snapshot `gitSha` same-commit parity, and exact remote P0 fail-open read-back.

**Date:** 2026-08-18 (review follow-up)

**Owner:** Product / Engineering

**Production nameservers changed:** NO  
**Production DNS changed:** NO  
**Production traffic moved:** NO  
**www.visutry.com Worker Custom Domain:** NO  
**Production Worker Routes registered:** NO  
**Merged:** NO

This document is the B4.2B evidence pack. It prepares a reviewed, machine-generated allowlist of Cloudflare Worker Routes for the first production public slice. It does **not** execute nameserver migration, DNS edits, or Worker-route activation.

Related:

- [`hosting-strategy-vercel-cloudflare.md`](./hosting-strategy-vercel-cloudflare.md) — canonical three-layer model
- [`cloudflare-b4-production-cutover-readiness.md`](./cloudflare-b4-production-cutover-readiness.md) — B4.1
- [`cloudflare-b4-2a-staging-public-slice.md`](./cloudflare-b4-2a-staging-public-slice.md) — B4.2A staging proof
- [`ADR-010-hybrid-edge-architecture-for-store-campaign-scale.md`](../decisions/ADR-010-hybrid-edge-architecture-for-store-campaign-scale.md) (not rewritten)
- Semantic source of truth: `cloudflare-router/b4-production-public-slice.ts`
- Route generator: `cloudflare-router/b4-production-routes.ts`
- Review manifest: `cloudflare-router/b4-production-routes.json`
- DNS inspect freeze: `cloudflare-router/b4-production-dns.inspect.json` (frozen in B4.2C Phase A to `cname.vercel-dns-017.com`)
- Hashed-asset parity gate: `cloudflare-router/b4-static-asset-parity.ts`

Canonical execution order is unchanged:

> Static Asset → Worker only if necessary → Backend only if necessary

Production routing decision (B4.2A §12, executed as design in B4.2B):

**USE SCOPED CLOUDFLARE WORKER ROUTES. DO NOT use `www.visutry.com/*` or a full www Worker Custom Domain.**

Reason: Layer 3 traffic must continue directly to Vercel whenever possible, instead of consuming Workers Free request quota merely to be proxied.

## 1. Baseline

| Item | Value |
| --- | --- |
| `origin/main` at worktree create | `14a82419c981ad9b301b366d7ae257990b215f8f` |
| PR #91 | Merged (Vercel ISR / Fast Origin Transfer reductions) |
| PR #92 | Merged (B3.2 capability routing) |
| PR #93 | Merged (B4.1 readiness, three-layer model, Free quota correction) |
| PR #94 | Merged at the SHA above (B4.2A staging public-slice activation) |
| Branch | `cursor/cloudflare-b4-2b-scoped-production-routes` |
| Staging Worker | `visutry-cf-staging` on `workers.dev` |
| Production Worker | **not created / not routed** |
| `wrangler.jsonc` production `routes` | **absent** (by design) |
| `custom_domain` | **absent** |
| CI deploy | `npm run deploy:cloudflare` → `--env staging` only. GitHub workflows do not run Wrangler deploy. |

Inspect generated routes without publishing:

```bash
npm run b4:routes:print
npm run b4:routes:print -- --priority P0
npx tsx cloudflare-router/print-b4-production-routes.ts --write-json
```

Do not paste the printed `wranglerSnippetPreview` into `wrangler.jsonc` until B4.2C Phase C.

B4.2C hard gates (not optional):

1. Same-commit hashed-asset parity before publishing `www.visutry.com/_next/static/*`. Default Phase C P0 **excludes** that pattern. Sequence: `build:ci` → `npm run b4:snapshot-vercel-next` (copies `.next` to `.artifacts/b4/vercel-next` and records `gitSha`) → `build:cloudflare` → `npm run b4:asset-parity`. Comparing live `.next` after the Cloudflare build is a false PASS and is not the default. Snapshot `gitSha` must equal `git rev-parse HEAD` or the gate fails. `generateBuildId` alone is not sufficient: `CLOUDFLARE_BUILD=1` webpack aliases can change chunk hashes.
2. Freeze `www` origin DNS from `vercel domains inspect www.visutry.com` into `cloudflare-router/b4-production-dns.inspect.json`. Do **not** assume `cname.vercel-dns.com` or `cname.vercel-dns-0.com`.
3. Every published Worker Route must have **request-limit fail-open** (`request_limit_fail_open: true` on the Cloudflare Routes API / dashboard toggle). Wrangler JSON currently only serializes `pattern` + `zone_name`; fail-open must be verified after attach. Volume is UNKNOWN, so fail-closed 1027 is not acceptable on public SEO/API paths.

## 2. Current production domain state (read-only)

Re-verified 2026-08-18. No records were changed. Live dig is the current evidence; B4.2A §11 is the prior inventory this re-check agrees with.

| Fact | Current state |
| --- | --- |
| Authoritative nameservers | `ns1.vercel-dns.com`, `ns2.vercel-dns.com` |
| Cloudflare zone for `visutry.com` | **None** — Cloudflare is not authoritative |
| `www.visutry.com` | Vercel anycast A (`64.29.17.65`, `216.198.79.65`) |
| `visutry.com` apex | Vercel anycast A (`64.29.17.1`, `216.198.79.65`) |
| Vercel production domains | `www.visutry.com`, `visutry.com`, `visutry.vercel.app` |
| Fallback origin | `https://visutry.vercel.app` (outside this zone) |
| Staging Worker | `visutry-cf-staging` / `https://visutry-cf-staging.sunye.workers.dev` |
| Wrangler production routes | none |
| Mail | QQ Exmail MX + SPF; DMARC `p=none`; Resend DKIM TXT |
| Auth0 | `auth.visutry.com` CNAME → Auth0 edge (must stay DNS-only) |

Vercel DNS returns A records for arbitrary unused subdomains (`api`, `cdn`, `mail`, …). Those are **not** real hosts. Copy only records present in a full Vercel zone export.

## 3. Exact production route strategy

We are **not** using:

- `www.visutry.com/*`
- `custom_domain: true` on `www.visutry.com`
- infix wildcards (`www.visutry.com/*/store`) — Cloudflare does not support them
- `/api/glasses*` — would capture `/api/glasses/frames`
- `/:locale*` — would capture every Layer 3 path
- `/:locale/store*` — would capture Store detail
- `/:locale/style*` — would capture `/style-explorer`

The route set is generated from `classifyB4ProductionPublicSlice()` families, not from a hand-copied candidate list.

Cloudflare Worker Route syntax (documented):

- `*` matches zero or more of any character
- path `*` only at the **end**
- no query parameters in the pattern; query strings match only when the pattern ends with `*`
- more specific patterns win
- known greedy behavior: `example.com/images*` also matches `/images/hello` and `/imagesfoo`; `example.com/home*` matches `/homepage`. Those patterns can beat `example.com/images/*`. Static asset routes therefore use **directory** `/*` only (`/images/*`, never `/images*`).

Therefore Store hub is **exact** `www.visutry.com/{locale}/store`. Style landings use `/{locale}/style/*` (slash required). Try-on uses `/{locale}/try-on*`, which does **not** match `/{locale}/try/:slug`.

Generated set (from `npm run b4:routes:print`, not published):

| | Count |
| --- | --- |
| Total patterns | 286 |
| Layer 1 Static Asset | 9 |
| Layer 2 Worker | 277 |
| P0 | 13 |
| P1 | 203 |
| P2 | 70 |

Zone limit: **1,000 routes per zone** ([Workers limits](https://developers.cloudflare.com/workers/platform/limits/)). 286 is well under that. `wrangler dev --remote` is limited to 50 routes; do not use remote-dev against the production zone. Locale expansion of exact pages is the bulk of P1; that is generated from `B4_LOCALES`, not hand-copied.

### 3.1 Feasibility classes

| Class | Meaning | Used for |
| --- | --- | --- |
| A | Exact route possible | locale homes, Store hub, exact marketing pages, exact public APIs, control files, sitemaps |
| B | Safe prefix wildcard | `/_next/static/*`, `/images/*`, `/blog*`, `/brand*`, `/try-on*`, `/style/*` |
| C | Unsafe — wildcard captures excluded routes | **not emitted** (`/store*`, `/style*`, `/api/glasses*`, `/:locale*`, `www.visutry.com/*`) |
| D | Needs architectural adjustment | none for the first slice if Class C patterns stay unpublished |

### 3.2 Priority ramp

| Priority | Contents | When |
| --- | --- | --- |
| **P0** | public asset **directory** prefixes (`/images/*`, `/home/*`, …), favicon/robots/llms, exact public APIs. **`/_next/static/*` is generated but not activated** until snapshot parity is `pass` | first Worker-route enablement (Phase C) |
| **P1** | `/`, locale homes, exact marketing pages, Store hub, try-on*, static sitemaps | after P0 24h is under warning |
| **P2** | blog*, brand*, glasses-guide*, face-shapes*, sunglasses-for*, hairstyles-for*, style/* | after P1 is under warning |

Exact routes without a trailing `*` do **not** match query strings. `/en?utm_source=...`, `/en/store?utm_...`, and `/api/health?x=1` stay on Vercel. That is safe. Wildcard families such as `/en/blog*` do match `?utm_*`. Account for this split when reading Vercel usage after P1.

Do not assume everything must move on day one. Locale expansion is generated from `B4_LOCALES` in the classifier. Do not hand-edit locale copies.

## 4. Negative route set (must remain Vercel)

These paths must **not** match any published Worker Route. Unmatched proxied www traffic goes to the DNS origin (Vercel) **without** Worker invocation.

| Family | Example | Why |
| --- | --- | --- |
| Next image optimizer | `/_next/image*` | high volume, Vercel-native |
| Auth | `/api/auth/*`, `/auth/*` | host-only cookies; no Worker forwarding |
| Merchant / admin / agent | `/api/merchant/*`, `/api/admin/*`, `/api/agent/*` | writes / auth |
| MCP | `/api/mcp*` | OAuth/DCR |
| Payments | `/api/payment/*` | Stripe |
| Uploads / cron | `/api/upload*`, `/api/cron/*` | Blob / scheduled |
| Face-analysis submit | `/api/face-analysis/submit*` | write + AI |
| Store sessions / try-on API | `/api/store/sessions*`, `/api/try-on/*` | application |
| Frames catalog | `/api/glasses/frames*`, `/api/frames*` | not first-slice |
| Store detail | `/:locale/store/:merchantSlug` | Store scale; exact hub only |
| Campaign | `/:locale/c/:merchantSlug/:experienceSlug` | Campaign scale |
| Category / try dynamic | `/:locale/category/*`, `/:locale/try/*` | not first-slice |
| Discover / style-explorer | `/:locale/discover*`, `/:locale/style-explorer*` | not first-slice |
| Dynamic sitemap | `/sitemaps/dynamic.xml` | Store/Campaign URLs |
| Dashboard / merchant admin / user / share / admin | `/en/dashboard`, `/en/merchant`, `/en/user/*`, `/en/share/*`, `/admin` | authenticated surfaces |
| Unknown APIs | `/api/unknown-capability` | UNKNOWN → Vercel |

`assertSafeB4ProductionRoutes()` and `tests/unit/cloudflare-b4-production-routes.test.ts` fail the PR if any of these match.

Critical distinctions the matcher must keep:

| MATCH Worker | DO NOT MATCH (direct Vercel) |
| --- | --- |
| `/en/store` | `/en/store/ello-sunglasses` |
| `/en/try-on/glasses` | `/en/try/round-glasses` |
| `/api/glasses/brands` | `/api/glasses/frames` |
| `/en/style/round-face` | `/en/style-explorer` |
| `/en/blog` | (unknown blog slug still matches `blog*` and 404s on CF HTML — not a Layer 3 open) |
| `/_next/static/...` **after parity gate** | `/_next/image`; `/_next/static` **before** the gate (stays Vercel) |

Cloudflare cannot express “Store hub but not Store detail” with a prefix. The generator therefore **never** emits `/store*`. If a future operator adds `www.visutry.com/*/store*` or `www.visutry.com/en/store*`, Store detail would enter the Worker. That is a **hard fail**.

## 5. Layer 1 Static Asset delivery model

`workers.dev` behavior is **not** the production www model.

On `visutry-cf-staging.sunye.workers.dev`, every path already hits that Worker hostname. `run_worker_first: false` then lets exact files in `.open-next/assets` skip Worker JS.

On production `www.visutry.com`, Cloudflare Zone Routes only send **matching** patterns to the Worker. Unmatched paths never see the Worker or its `ASSETS` binding; they go to the www DNS origin (Vercel).

Therefore Layer 1 FOT offload on www **requires** explicit Worker Routes on the asset prefixes (model **A**). Model B (zone CDN of Vercel-origin files without Worker Routes) would still pull those bytes from Vercel (Fast Origin Transfer), which is the opposite of the B4 goal for hashed/public assets.

Chosen model: **A — explicit Worker Routes for static asset prefixes, `run_worker_first=false`, `ASSETS` binding, `not_found_handling=none`.**

| Asset family | Enters Worker Route? | Static Assets intercept before Worker JS? | Worker quota | Hits Vercel? | Physical source |
| --- | --- | --- | --- | --- | --- |
| `/_next/static/*` exact file | **no until parity gate**; then yes | yes, after gate | no on hit | **yes until gate** | Vercel until gate; then OpenNext assets |
| `/images/*`, `/home/*`, `/experience-heroes/*`, `/blog-covers/*`, `/assets/*` exact file | yes (P0) | yes | no | no | same |
| `/favicon.ico`, `/robots.txt`, `/llms.txt` | yes (P0 exact) | yes | no | no | same |
| asset **miss** on a routed prefix | yes | no | **yes** (Worker JS) | only if classifier falls back | Worker then optional `visutry.vercel.app` |
| `/_next/image*` | **no route** | n/a | **no** | yes | Vercel |
| unrouted HTML/API | **no route** | n/a | **no** | yes | Vercel |
| exact HTML/API with `?query` | **no** (pattern has no trailing `*`) | n/a | **no** | yes | Vercel |

Do not set `run_worker_first: true`. Do not enable Workers Caching as a 100k-quota strategy (cache hits still count as Worker requests and can bill otherwise-free Static Assets).

## 6. Production origin model (future, not applied)

```
browser
  → Cloudflare authoritative DNS (after Phase B)
  → www orange-cloud record whose **target is frozen from `vercel domains inspect www.visutry.com`**
      → matching Worker Route: this Worker (Layer 1 asset or Layer 2)
      → no matching route: Vercel origin directly (Layer 3, 0 Worker requests)
```

| Item | Value |
| --- | --- |
| Record | **Unknown until Phase A inspect.** Official examples include `cname.vercel-dns-0.com`; older docs used `cname.vercel-dns.com`; some projects get a unique CNAME. Freeze `cloudflare-router/b4-production-dns.inspect.json`. |
| Proxy | **Proxied** (orange cloud) so Worker Routes can intercept |
| SSL/TLS | Full (strict) |
| Vercel domain | keep `www.visutry.com` as a Vercel production domain (origin ownership) |
| Worker fetch | **only** `https://visutry.vercel.app{path}{search}` |
| `Host` rewrite | origin host `visutry.vercel.app`; send `X-Forwarded-Host: www.visutry.com` |
| Loop | none if Worker never fetches `www.visutry.com` |

Custom Domain is forbidden here: Cloudflare would point www DNS at the Worker as origin and every non-asset path would invoke the Worker.

### Apex `visutry.com`

Do **not** run the app Worker on the apex.

Preferred first-cutover treatment: **Cloudflare Redirect Rule** `https://visutry.com/*` → `https://www.visutry.com/$1` (301/308), with a proxied placeholder A `192.0.2.0` / AAAA `100::` on the apex. Existing Vercel apex redirect is the pre-NS-move behavior and remains valid until Phase B.

Do not implement the production Redirect Rule in this PR.

## 7. Auth safety

Scoped routing is the auth isolation mechanism.

| Surface | Worker Route match | Path after Phase B |
| --- | --- | --- |
| `/api/auth/*` | no | Cloudflare DNS/proxy → Vercel directly |
| `/auth/*` | no | same |
| dashboard / merchant / payments / protected pages | no | same |

Consequences:

- host-only cookies remain `www.visutry.com`
- `NEXTAUTH_URL` remains `https://www.visutry.com`
- Auth0 callbacks (`auth.visutry.com`, www callbacks) unchanged
- `Set-Cookie` is set by Vercel, not rewritten by a Worker
- no Worker forwarding, no extra 100k quota for auth

`auth.visutry.com` stays **DNS-only**. Proxying it would break Auth0.

## 8. Store / Campaign safety

| Path | Route | Layer |
| --- | --- | --- |
| `/{locale}/store` | exact `www.visutry.com/{locale}/store` | Layer 2 Worker |
| `/{locale}/store/{merchantSlug}` | **no route** | Vercel directly |
| `/{locale}/c/{merchant}/{campaign}` | **no route** | Vercel directly |

Cloudflare route syntax **can** distinguish hub vs detail **only** because the hub is exact. It **cannot** safely express `/store*` or `/*/store`. Flag: if an operator later “simplifies” to a prefix, Store detail would enter the Worker. Do not silently broaden.

No Worker fallback is required for detail pages when the published set stays exact.

## 9. SEO route safety

P2 wildcards (`/blog*`, `/brand*`, `/glasses-guide*`, `/face-shapes*`) intentionally match **unknown** slugs. That is not a Layer 3 open:

- known slug → OpenNext HTML on Cloudflare (canonical `https://www.visutry.com/...`)
- unknown slug → same Worker HTML runtime, expected **404** (not a soft 404 rewrite, not Vercel ISR population of unknown Store slugs)
- locale-less `/blog` → 308 to `/{locale}/blog` as today
- hreflang / status codes come from the existing Next/OpenNext app; this PR does not change `src/lib/seo.ts`

Do not add a Worker Route that would execute unknown **dynamic application** slugs (Store, Campaign, `/try/*`, `/category/*`). Those stay unrouted.

`PROGRAMMATIC_SEO_ENABLED` remains off. Scoped routes do not expand unpublished programmatic slugs.

## 10. Quota model (scoped routing)

Layer 3 Worker requests for non-matching production routes: **0**.

That is the main benefit versus a www Custom Domain.

| Class | Counts toward 100k/day? |
| --- | --- |
| Layer 1 exact Static Asset hit | no |
| Layer 1 asset miss on a routed prefix | yes |
| Layer 2 HTML / 308 / public API / sitemap | yes |
| Layer 3 unmatched | **no** (never enters Worker) |

Do not fabricate a production Worker request count from ISR units, Fast Origin Transfer, or “all www hits”. A typical HTML view is one Layer 2 Worker request plus many free Layer 1 subresources.

Production HTML/API volume is **not** logged as Worker invocations today (www is still Vercel). Staging `workers.dev` is not a production sample because every path enters that hostname.

| Estimate | Worker requests/day |
| --- | --- |
| LOW | UNKNOWN (P0-only may be near API + asset-miss volume; HTML not yet routed) |
| EXPECTED | UNKNOWN |
| HIGH | UNKNOWN |

Thresholds (unchanged from B4.1/B4.2A):

| Pace | Action |
| --- | --- |
| 70,000/day | operational warning; halt expansion |
| 80,000/day | strong review / prepare rollback |
| 90,000/day | rollback |
| 100,000/day | hard Free limit; Error 1027 |

**Free-plan result: WARNING** (volume unproven), not BLOCKED. Classification and Layer 3 exclusion are SAFE. Because HIGH is unknown, **do not enable P1/P2 on day one**. P0-first is the quota control.

B4.2B is **not** a NO-GO for preparing routes. It **is** a NO-GO for publishing the full P2 set until P0 (then P1) 24h pace is observed under 70k.

## 11. DNS migration manifest (import only; do not apply)

Create the Cloudflare zone **without** changing registrar nameservers until Phase B. Import grey-cloud first.

| Name | Type | Current | Cloudflare target | Proxied | TTL | Risk | Verify |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `@` NS | NS | `ns1/ns2.vercel-dns.com` | Cloudflare assigned NS **only in Phase B** | n/a | SOA | High | `dig NS visutry.com` |
| `@` | A | Vercel `64.29.17.1`, `216.198.79.65` | placeholder `192.0.2.0` for Redirect Rule **or** keep Vercel until rule is live | Proxied when redirecting | export | Apex must 301/308 to www | `curl -I https://visutry.com` |
| `www` | A | Vercel `64.29.17.65`, `216.198.79.65` | **Freeze from `vercel domains inspect www.visutry.com`** (do not assume `cname.vercel-dns.com` / `cname.vercel-dns-0.com`) | **Proxied** | export | Medium (routes off until Phase C) | `curl -I https://www.visutry.com` still Vercel after NS |
| `@` | MX | `5 mxbiz1.qq.com`, `10 mxbiz2.qq.com` | identical | **DNS only** | export | Mail outage if proxied | MX lookup + send test |
| `@` | TXT SPF | `v=spf1 include:spf.mail.qq.com ~all` | identical | DNS only | 60s observed | SPF fail | `dig TXT visutry.com` |
| `_dmarc` | TXT | `v=DMARC1; p=none;` | identical | DNS only | export | Low | `dig TXT _dmarc.visutry.com` |
| `@` | CAA | letsencrypt, sectigo, pki.goog | identical; add Cloudflare CAA only if Universal SSL requires it | DNS only | export | TLS issuance | `dig CAA visutry.com` |
| `auth` | CNAME | Auth0 `dev-ho4e6glpvc4ux5uw-cd-cobhapsbopdfpybl.edge.tenants.us.auth0.com` | identical | **DNS only** | export | Login break if proxied | Auth0 login |
| `resend._domainkey` | TXT | Resend DKIM | identical | DNS only | export | Transactional mail | DKIM check |
| Google/Bing/Stripe/Vercel verification TXT | TXT | **must come from Vercel zone export** | identical | DNS only | export | Domain verification loss | export diff |
| `visutry.vercel.app` | — | Vercel platform DNS | unchanged | n/a | n/a | Loop if www Worker fetches www | never fetch www |

Mail-related records (MX, SPF, DKIM, DMARC) and `auth.visutry.com` **must remain DNS-only**.

Do not copy Vercel catch-all unused-subdomain A records.

## 12. Cutover runbook (DO NOT EXECUTE in B4.2B)

Nameserver migration and Worker-route activation are **separate checkpoints**. After NS migration, www must still work on Vercel **before** Worker Routes are enabled.

### Phase A — DNS preparation (no traffic change)

1. Export the complete Vercel DNS zone. Diff against §11. Record MX/TXT/DKIM/SPF/DMARC/CAA/`auth`/verification TXT.
2. Run `vercel domains inspect www.visutry.com` and **freeze** `recordType` + `target` + `inspectedAt` in `cloudflare-router/b4-production-dns.inspect.json`. `requireFrozenWwwDnsTarget()` must succeed before Phase B www records are written.
3. Create Cloudflare zone `visutry.com`. Import records **grey-cloud**. Do **not** change registrar nameservers.
4. Keep www pointing at the **inspected** Vercel target (grey-cloud CNAME/A is fine in this phase; traffic still uses Vercel NS).
5. Confirm `auth.visutry.com`, MX, SPF, DKIM present and DNS-only.
6. Record Vercel ISR / FOT / function / middleware baselines.
7. Confirm staging Worker gzip < 3072 KiB and Layer 1/2/3 smoke still green.
8. Prepare rollback evidence: Vercel NS names, current A/CNAME values, zone export file, inspect output.

Traffic remains on Vercel. This phase is the only B4.2C step that may proceed immediately after this PR is reviewed.

### Phase B — Nameserver migration (still no Worker Routes)

1. Change authoritative NS to Cloudflare **only after** grey-cloud records match the export.
2. Wait for NS propagation (`dig NS visutry.com`).
3. Orange-cloud `www` to the **frozen inspect target**. **Do not** add Worker Routes yet. **Do not** add a Custom Domain.
4. Verify before any route: `https://www.visutry.com` HTML, `/api/auth/session`, Store detail, Campaign, Try-On, payment entry, AI entry, mail (MX/SPF).
5. Apex: enable Redirect Rule to `https://www.visutry.com` (or confirm Vercel still redirects until the rule is ready).
6. SSL/TLS Full (strict). Confirm certificate on www.

Success gate: www still reaches Vercel; Worker request count for the production Worker is **0**.

### Phase C — P0 route enablement

Required order. Do not skip the read-back.

1. Create/deploy the production Worker with **zero** `www.visutry.com` routes. Verify the Worker version / gzip. Staging remains `--env staging`.
2. Attach **ungated P0** only (`routesForPriority('P0')`, default excludes `/_next/static/*`).
3. Read back every attached zone route (Cloudflare API `GET /zones/:zone_id/workers/routes` or dashboard export).
4. Run `npx tsx cloudflare-router/b4-fail-open-remote.ts --from-json attached-routes.json`. The remote www set must **exactly** equal ungated P0: every expected route present, **no extra** `www.visutry.com` routes (including `www.visutry.com/*` and P1/P2), `script === visutry-cf-production`, and `request_limit_fail_open: true`. Missing `script` is **FAIL**. Empty remote list is **FAIL**, not skip-as-pass. Local `requestLimitFailOpen` is intent only.
5. Only then declare Phase C PASS.

`/_next/static/*` stays off unless:

```bash
npm run build:ci
npm run b4:snapshot-vercel-next
npm run build:cloudflare
npm run b4:asset-parity
```

returns `pass` for that commit.

**Hard activation gates — all required:**

1. Hashed static: snapshot parity `pass` **only if** publishing `/_next/static/*`. Otherwise leave it on Vercel.
2. `cloudflare-router/b4-production-dns.inspect.json` has `resolved: true` with the inspect timestamp.
3. **Remote** fail-open read-back PASS. Wrangler `pattern`/`zone_name` deploy does **not** prove this. Fail-closed would serve Error 1027 on public paths after 100k/day.

Immediate smoke:

- `/_next/static/...` — still Vercel (no router header) unless the parity gate passed and the gated route was explicitly included
- `/robots.txt`, `/favicon.ico`, `/images/...`
- `GET /api/health`, `GET /api/glasses/brands`
- `/api/health?x=1` — still Vercel (exact route, query not matched)
- `/api/glasses/frames` — still Vercel (no router header)
- `/api/auth/session` — still Vercel
- `/en/store/ello-sunglasses` — still Vercel
- `/en` — still Vercel until P1

### Phase D — observe

| T+ | Watch |
| --- | --- |
| 5 min | smoke above; 5xx; auth |
| 30 min | Worker requests, CPU, error rate |
| 2 h | quota pace vs 70k/day |
| 6 h | Vercel ISR / FOT / function / middleware vs baseline |
| 24 h | Worker requests/day; route-family distribution; product availability |

Halt expansion at 70k projected pace. Strong review at 80k. Rollback before 90k. Do not wait for Error 1027.

### Phase E — expand to P1 then P2 only if safe

Enable P1 (locale homes, marketing, Store hub, try-on, sitemaps) only if P0 24h is under warning. Repeat observe. Then P2 SEO wildcards.

## 13. Rollback (DO NOT EXECUTE)

**Primary:** delete/disable Worker Routes for `www.visutry.com`.

Result: matching requests return directly to Vercel again (www still orange-cloud to Vercel origin). No application deploy. No Auth0 change.

Target: **< 5–10 minutes**.

Dashboard:

1. Workers & Pages → production Worker → Settings → Domains & Routes
2. Delete the www path routes (P0/P1/P2 as published)
3. Leave www DNS on Vercel origin
4. Confirm `/en` and `/en/store/ello-sunglasses` both reach Vercel

Wrangler (only if a production env exists later): remove `routes` from that env and deploy **staging is the wrong target** — do not run `npm run deploy:cloudflare` as rollback (it is `--env staging`). Prefer dashboard route deletion so staging stays untouched.

**Secondary:** restore Vercel nameservers (`ns1.vercel-dns.com`, `ns2.vercel-dns.com`) only if Cloudflare authoritative DNS itself is wrong. TTL-bound; 30–60 minutes. NS rollback is **not** normally required for a Worker-route incident.

**Fail-open is a B4.2C hard gate on remote state, not local JSON.** After attach, `assertRemoteFailOpenActivation()` must pass against the Cloudflare Routes API dump. Fail-open bypasses the Worker to the Vercel origin at the Free 100k/day cap. Fail-closed returns Error 1027. Public SEO/API routes must not fail-closed while Worker volume is UNKNOWN. An empty dump cannot be treated as PASS.

Dashboard: Workers & Pages → production Worker → Settings → Domains & Routes → each route → request-limit fail mode = Fail open.

API (do not run in B4.2B): create/update route with `"request_limit_fail_open": true`. `proposedCloudflareRouteApiPayload()` already emits this field. Wrangler config cannot currently express it.

## 14. Observability

No Cookie, Authorization, body, email, tokens, image data, or secrets in logs.

Cloudflare:

- Worker requests (not Static Asset count)
- CPU
- error rate / 5xx
- route-family distribution (P0 vs P1 vs P2; HTML vs API vs asset-miss)
- Static Asset delivery (absence of router headers on hashed files)
- request quota pace toward 70k / 100k UTC day

Vercel:

- ISR Reads
- Fast Origin Transfer
- Function Invocations
- Middleware Invocations
- errors

Product:

- page availability (`/`, `/en`, one SEO URL)
- auth (`/api/auth/session`)
- Store hub vs Store detail
- Campaign
- Try-On
- payment entry
- AI entry

## 15. Wrangler / CI activation safety

| Control | Evidence |
| --- | --- |
| No production `routes` in `wrangler.jsonc` | file comment + tests |
| No `env.production` | tests |
| No `custom_domain` | tests |
| `deploy:cloudflare` | `--env staging` only |
| GitHub Actions | no Wrangler/OpenNext deploy job |
| Manifest | `activated: false` in JSON |
| Hashed `/_next/static/*` | `activationGate: same-commit-asset-parity`; excluded from default `routesForPriority('P0')`; compare `.artifacts/b4/vercel-next` not live `.next`; snapshot `gitSha` must equal current HEAD |
| Fail-open | local intent `requestLimitFailOpen: true`; Phase C PASS = `b4:fail-open:assert --from-json` exact ungated-P0 www set, script, and remote fail-open |
| www DNS target | inspect file `resolved: false` until Phase A |
| Fail-open | `requestLimitFailOpen: true` on every generated route; API payload includes `request_limit_fail_open` |

If routes were copied into `wrangler.jsonc` now, the next `npm run deploy:cloudflare` would still target **staging** (no www zone). The remaining risk is a human adding `env.production` and deploying it. Keep routes in the reviewed TS/JSON until Phase C.

A leftover B3.2 config `cloudflare-router/wrangler.jsonc` (`visutry-cf-staging-router`) must **not** be deployed.

## 16. Validation (this PR)

| Check | Result |
| --- | --- |
| `npm ci` | PASS |
| `CI=1 npm run build:ci` | PASS — `BUILD_ID=OhQNBBIoJmuTikwqUzx02`, 1576/1576 static pages (Node 20 + stdin keep-alive; Node 25 non-TTY does not produce a `BUILD_ID`) |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS (existing `@next/next/no-img-element` / hook warnings only) |
| `npm run test:critical:ci` | PASS |
| B4 classifier / staging / new route tests | PASS |
| B3.2 `cloudflare-router-worker` tests | PASS |
| Quota ISR segment tests | PASS |
| SEO locale-less redirect tests | PASS |
| Cloudflare OpenNext build | PASS |
| `npx wrangler deploy --dry-run --env staging` | PASS — gzip **2817.59 KiB** / 3072 KiB |
| `git diff --check` | PASS |
| Production DNS / Worker Routes changed | NO |

```bash
npm ci
CI=1 npm run build:ci
npm run typecheck
npm run lint
npm run test:critical:ci
npx jest tests/unit/cloudflare-b4-production-routes.test.ts tests/unit/cloudflare-b4-production-public-slice.test.ts tests/unit/cloudflare-b4-staging-router.test.ts tests/unit/cloudflare-router-worker.test.ts --runInBand
npx tsx cloudflare-router/print-b4-production-routes.ts
npm run b4:snapshot-vercel-next
npm run build:cloudflare
npm run b4:asset-parity
npx tsx cloudflare-router/b4-fail-open-remote.ts
npx wrangler deploy --dry-run --env staging
git diff --check
```

## 17. GO / NO-GO

| Gate | Result |
| --- | --- |
| B4.2B prepare scoped routes, tests, runbook | **PASS / GO** |
| Change production DNS / NS in this PR | **NO-GO** |
| Register production Worker Routes in this PR | **NO-GO** |
| Bind www Custom Domain | **NO-GO** |
| Enable full P2 on day one of cutover | **NO-GO** (quota UNKNOWN) |
| B4.2C Phase A (copy DNS, no NS change) | **GO** after inspect freeze + this PR is reviewed |
| B4.2C Phase B (NS) then Phase C (P0 only) | **GO** only as separate operational checkpoints, with **remote** fail-open read-back and `/_next/static/*` still Vercel unless snapshot parity is `pass` |
| Publish `/_next/static/*` without snapshot parity | **NO-GO** |
| Static asset `/images*` (non-directory) | **NO-GO** |
| Declare Phase C PASS from local fail-open intent only | **NO-GO** |
| Hardcode `cname.vercel-dns.com` / `cname.vercel-dns-0.com` | **NO-GO** |
| Attach www routes fail-closed | **NO-GO** |

Blockers for live P1/P2: production Worker volume still UNKNOWN; Cloudflare zone does not exist yet; NS still Vercel; hashed-static parity not yet proven.

Not blockers: Auth0 setting changes, Store/Campaign on Cloudflare, `_next/image` on Cloudflare, Paid plan.

## 18. Next step (do not execute here)

1. Review and merge this PR (human merge; this task does not merge).
2. **Phase A:** `vercel domains inspect www.visutry.com`, freeze `b4-production-dns.inspect.json`, export Vercel DNS, create Cloudflare zone, copy records grey-cloud, verify MX/TXT/DKIM/SPF/DMARC/`auth`. Traffic unchanged.
3. **Phase B (later window):** move NS; confirm www still Vercel via the frozen inspect target; verify app/auth/mail.
4. **Phase C:** deploy production Worker with **zero** www routes; attach ungated P0; read back routes; `b4:fail-open:assert --from-json` must PASS; leave `/_next/static/*` on Vercel unless snapshot parity is `pass`; smoke; observe 24h.
5. Expand P1/P2 only if Worker pace stays under 70k/day.
