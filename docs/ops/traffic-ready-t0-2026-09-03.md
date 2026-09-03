# VisuTry Traffic Ready Sprint — T0 Readiness

Date: 2026-09-03  
Starting `origin/main` SHA: `4662908a36df8d38ed22916ad19d90c4535f313f`  
Ending branch SHA: `110f1389374073977a51f59b0b9be1fd3d962cc9`
Working branch: `codex/traffic-ready-t0`  
PR: [#182 — Traffic Ready T0: close agent distribution observability](https://github.com/franksunye/VisuTry/pull/182)

## Scope and boundary

This audit is limited to traffic readiness for the existing Consumer, Store, and Campaign surfaces. It does not modify held PR #178 (canonical PostgreSQL migration track) or held PR #179 (Turso analytics event plane). No migration, provider, HA/DR, or indexability-policy work was introduced.

Reference Store/Campaign Experiences remain readable but `PUBLIC_NOINDEX` / `noindex, follow`, and remain excluded from the dynamic sitemap. The report does not invent a Consumer-to-Merchant join: Consumer funnel events and Merchant Store/Campaign sessions use separate identifiers and are presented as separate evidence streams.

## Baseline

The production database was queried read-only for `2026-08-20T00:00:00Z` through `2026-09-03T00:00:00Z` (UTC):

- 103 `MerchantSession` rows were read.
- 88 Reference/Internal sessions were excluded.
- 3 TEST/AUTOMATION sessions were excluded.
- 0 suspicious and 0 unscoped sessions remained.
- 0 production-eligible Store/Campaign sessions remained in this window.
- `aiAgentSource` was populated on 0 sessions.
- Merchant intents contained 3 `PRODUCT_CLICK` intents on `ello-sunglasses / petite-fit` and 1 `FAVORITE` intent on `ello-sunglasses / default`; these are Reference traffic and excluded from the genuine-traffic report.
- Observed acquisition sources were `visutry-reference-pilot` (43), `visutry` (54 across `internal` and unset medium), `codex-p0-verification` (2), `direct/none` (2), `safe-production-verification` (1), and unset source (1). No genuine AI-origin traffic was observed.

## Axiom credential and query state

A dedicated `visutry-agent-distribution-read` credential was provisioned in the authenticated `visutry` Axiom organization with a 90-day expiry. Its effective permissions are query/read on the production dataset only; ingest, update, delete, organization, billing, and other management permissions remain off. The credential is stored only in the ignored local environment configuration and no secret value is present in Git.

The requested logical dataset name `visutry-logs` is not present in the authenticated organization. The authoritative production environment is configured for `visutry-pro`, which is the production dataset listed by Axiom and used by the successful report runs below. No dataset was created, renamed, or altered, and ingestion configuration was not changed.

The initial report query also exposed a compatibility defect: Axiom stores the logger's nested payload as flattened `data.<field>` columns, so projecting the aggregate `data` column failed with `field 'data' not found`. The report now uses `column_ifexists` projections for the canonical fields and continues to treat an empty result as a valid report outcome.

## Six canonical Campaign Experiences identified

These are the six current featured Campaign Experiences from `src/config/discover.ts`, verified against the production database. All are ACTIVE Reference Experiences and therefore intentionally noindex.

| Merchant / Experience | Type | Production URL | Provenance / public status | Indexability | Guest health | Decision flow | Attribution health |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ello sunglasses / petite-fit | CAMPAIGN · 10 catalog / 10 destinations | `https://www.visutry.com/en/c/ello-sunglasses/petite-fit` | Reference · ACTIVE · public route | `noindex, follow` | PASS · 200 / H1 | PASS · Explore → recommendation/Try-On → Compare → Product Click | PASS · source/session/Experience path |
| Article One / find-your-fit | CAMPAIGN · 9 / 9 | `https://www.visutry.com/en/c/article-one/find-your-fit` | Reference · ACTIVE · public route | `noindex, follow` | PASS · 200 / H1 | PASS · shared Store/Campaign shell | PASS · source/session/Experience path |
| Article One / active-eyewear | CAMPAIGN · 9 / 9 | `https://www.visutry.com/en/c/article-one/active-eyewear` | Reference · ACTIVE · public route | `noindex, follow` | PASS · 200 / H1 | PASS · shared Store/Campaign shell | PASS · source/session/Experience path |
| Akila / statement-frames | CAMPAIGN · 9 / 9 | `https://www.visutry.com/en/c/akila/statement-frames` | Reference · ACTIVE · public route | `noindex, follow` | PASS · 200 / H1 | PASS · shared Store/Campaign shell | PASS · source/session/Experience path |
| lowercase nyc / sunglasses-edit | CAMPAIGN · 10 / 10 | `https://www.visutry.com/en/c/lowercase-nyc/sunglasses-edit` | Reference · ACTIVE · public route | `noindex, follow` | PASS · 200 / H1 | PASS · shared Store/Campaign shell | PASS · source/session/Experience path |
| Framed Ewe / find-your-frames | CAMPAIGN · 11 / 11 | `https://www.visutry.com/en/c/framed-ewe/find-your-frames` | Reference · ACTIVE · public route | `noindex, follow` | PASS · 200 / H1 | PASS · shared Store/Campaign shell | PASS · source/session/Experience path |

Production route smoke returned HTTP 200 for all six routes, with the expected H1, canonical URL, `noindex, follow`, and JSON-LD product counts matching the table.

## Gap audit and changes

### Fixed in this sprint

1. The daily Merchant report previously admitted TEST rows unless they were marked Reference/Internal. It now explicitly excludes `TEST`, `AUTOMATION`, and `SUSPICIOUS` classifications, plus unscoped sessions, and reports each exclusion bucket.
2. Merchant source classification now keeps Reddit and YouTube distinct from the broad Social bucket, including URL-host forms such as `www.youtube.com` and `www.reddit.com`.
3. The durable Merchant report now aggregates the same `MerchantSession` → `MerchantEvent` / `MerchantIntent` evidence by Experience as well as by source class, preserving merchant and Experience identity for reconstruction.
4. Consumer source classification uses the same Reddit/YouTube distinction, and direct traffic requires no referrer so a referrer-only YouTube/Reddit visit is not mislabeled as Direct.

### Preserved / deferred

- `MerchantSession` captures first-touch source, medium, campaign, surface, referrer, landing URL, and AI source; downstream Store/Campaign events and intents resolve through the session and its `experienceId`. This path is covered by the existing Store/Campaign application contracts and the updated report unit tests.
- Static public product-card outbound links remain a P1 tracking gap: they can carry attribution parameters but do not create a first-party Product Click intent when clicked before the interactive runtime is opened. This sprint leaves that larger product-surface change deferred.
- Consumer funnel telemetry remains anonymous and separate from MerchantSession. A cross-system join is intentionally not claimed.
- The six Reference Experiences remain excluded from genuine traffic and search indexing by policy.

## Exact daily and explicit 14-day report commands

Run with `DATABASE_URL`, `AXIOM_TOKEN`, and any configured `AXIOM_ORG_ID` / `AXIOM_DATASET` in the execution environment:

```bash
npm run report:agent-distribution -- --json
```

The canonical run succeeded with this UTC window and result:

- `2026-08-20T09:44:33.037Z` → `2026-09-03T09:44:33.037Z`
- Axiom events read: 0; production-candidate events: 0; Consumer Agent sessions: 0; Consumer decision-action sessions: 0.
- Merchant sessions read: 102; Reference/Internal excluded: 99; TEST/AUTOMATION excluded: 3; suspicious excluded: 0; unscoped excluded: 0; qualifying Store/Campaign sessions: 0.

The explicit rolling 14-day invocation used was:

```bash
npm run report:agent-distribution -- --from 2026-08-20T09:44:32Z --to 2026-09-03T09:44:32Z --json
```

It also succeeded with 0 Consumer events / 0 Agent sessions / 0 decision-action sessions and the same Merchant exclusion totals. A zero genuine-traffic result is recorded as zero, not treated as a permission failure or replaced with synthetic traffic.

The report exposes the server-derived source taxonomy, including ChatGPT/OpenAI, Gemini/Google AI, Claude/Anthropic, Perplexity, Google Organic, Reddit, YouTube, generic referral, direct, paid, social, other, and internal/test handling. This window observed none of those Consumer events, so no provider-specific production claim is made. The Consumer Axiom stream and durable Merchant Store/Campaign stream remain separate evidence planes with no fabricated cross-system join.

## Validation evidence

- `npm run typecheck` — PASS.
- `NEXT_PUBLIC_SITE_URL='' NEXT_PUBLIC_APP_URL='' npm run test:unit:ci` — PASS, 233 suites / 1,447 tests. The URL overrides isolate the existing Preview QA fixture from ambient production URL variables.
- `npm run test:critical:ci` — PASS, 7 suites / 34 tests.
- `npm run test:e2e:list` — PASS, 38 tests discovered.
- Read-only production Playwright checks for Consumer Face Analysis, Consumer Try-On/Compare, Store, and Campaign — PASS, 6/6.
- `SMOKE_ATTEMPTS=1 SMOKE_DELAY_MS=0 npm run test:smoke:production` — PASS, Next HTML/static assets/RSC and unauthenticated guards verified.
- `npm run test:migration-boundary` — PASS.
- `npm run test:sponsored:postgres` — PASS, disposable PostgreSQL sponsored usage, tenant-FK, and local entitlement contracts.
- `npm run build:ci` — PASS.
- `npm run lint` — PASS with existing warnings only.
- Focused attribution, Consumer funnel, Agent Distribution, Merchant Store/Campaign, and Merchant Control Center tests — PASS, 5 suites / 17 tests.
- `npm run typecheck` after the Axiom query-shape fix — PASS.
- Canonical and explicit rolling 14-day `report:agent-distribution` runs against the production Axiom dataset — PASS; empty Consumer result handled without error.
- `git diff --check` — PASS.

## T0 decision

Technical Store/Campaign production traffic contracts, source persistence, Experience/action reconstruction, consumer critical flows, Axiom query/read observability, and indexability policy are ready. The report is ready to receive genuine traffic and measure it without counting Reference/Internal/TEST traffic or inventing a Consumer-to-Merchant join. **TRAFFIC READY: YES**. The current genuine Agent observation is 0 sessions; that is an observation result, not a T0 blocker.
