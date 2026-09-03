# VisuTry Traffic Ready Sprint — T0 Readiness

Date: 2026-09-03  
Starting `origin/main` SHA: `4662908a36df8d38ed22916ad19d90c4535f313f`  
Ending branch SHA: final committed branch SHA (record with `git rev-parse HEAD` at handoff)  
Working branch: `codex/traffic-ready-t0`  
PR: Not created; T0 remains NO pending Axiom query/read access.

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

The production `report:agent-distribution` command was attempted with the production environment. It failed closed before emitting a report because the configured Axiom token lacks `query`/`read` access to `visutry-logs`: `token does not have access to resource: query with action: read`. This is an external credential-scope blocker, not a data join or code fallback.

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

## Exact daily report command

Run with `DATABASE_URL`, `AXIOM_TOKEN`, and any configured `AXIOM_ORG_ID` / `AXIOM_DATASET` in the execution environment:

```bash
npm run report:agent-distribution -- --from 2026-08-20T00:00:00Z --to 2026-09-03T00:00:00Z --json
```

For the normal rolling 14-day window, omit `--from` and `--to`:

```bash
npm run report:agent-distribution -- --json
```

The command must continue to fail closed until the Axiom token has query/read permission for `visutry-logs`; it must not substitute incomplete Consumer evidence or fabricate a Consumer-to-Merchant join.

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

## T0 decision

Technical Store/Campaign production traffic contracts, source persistence, Experience/action reconstruction, consumer critical flows, and indexability policy are ready. **TRAFFIC READY: NO** because the exact daily observation command cannot read the Consumer Axiom stream with the currently available token scope. After query/read access is provisioned, rerun the command and begin the 14-day observation window.
