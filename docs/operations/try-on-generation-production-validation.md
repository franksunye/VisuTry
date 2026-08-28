# Try-On Generation — Production Validation Package

**Status:** Ready to execute after production deploy  
**Commit:** `ad315cd9b627d72bd74c187f570e465df1c30caa` (plus this ops package)  
**Owner:** Engineering  
**Last updated:** 2026-08-28

This document makes Phase 1 measurement **operationally executable**. It does not change provider selection, retry count, timeouts, async behavior, fallback, UX, or reliability policy.

Do not start Baseline Day 0 from this document alone. Day 0 starts only after the gate in section 9 passes.

---

## 1. Production deployment checklist

Production Next.js is owned by Vercel. `package.json` `build` is:

```
prisma generate && bash scripts/migrate-deploy.sh && next build
```

`postinstall` also runs `prisma generate`. Preview / CI / local builds skip migrations: `scripts/migrate-deploy.sh` is a no-op unless `VERCEL_ENV=production`. Production migrate is fail-closed unless `VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1`.

Migrations use the **direct** Neon URL (`DATABASE_URL_UNPOOLED` via `prisma.config.ts`). Runtime Prisma uses pooled `DATABASE_URL`.

### Required application commit

Deploy the telemetry revision that includes:

- `20260828120000_add_generation_telemetry`
- `20260828140000_generation_telemetry_validation`
- telemetry writer + admin/API/CLI report + inspect script

Minimum known-good measurement SHA: `ad315cd9b627d72bd74c187f570e465df1c30caa`. Prefer the merge commit of this branch once this ops package is included.

### Required environment (already part of production architecture)

| Variable | Role |
| --- | --- |
| `DATABASE_URL` | Runtime Prisma (pooled Neon) |
| `DATABASE_URL_UNPOOLED` | `prisma migrate deploy` / `migrate status` |
| `VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1` | Required for production migrate during Vercel build |
| `AXIOM_TOKEN`, `AXIOM_ORG_ID`, `AXIOM_DATASET` (default `visutry-logs`) | Axiom correlation. Ingest only when `NODE_ENV=production` |
| `GEMINI_API_KEY` / `GRSAI_API_KEY` | Existing providers. Unchanged. |
| `ENABLE_SERVICE_TIERING` | Default on. Premium Consumer → Gemini. Do not change for this validation. |
| `GRSAI_SUBMIT_TIMEOUT_MS` | Existing submit abort (default 25000, cap 45000). Do not change. |

No new telemetry-specific env vars.

### Schema / Prisma client

- `prisma generate` is required and already runs on `postinstall` and at the start of `npm run build`.
- Do not run a separate generate step on production hosts.
- Do not run `prisma db push` in production.

### Migration vs app deploy dependency

Telemetry writes are **fail-open**. If the app ships before tables exist, generation still works and rows are missing. Smoke then cannot pass.

The Vercel production build applies pending migrations **before** `next build` in the same deploy. That is the intended sequence.

Preview deployments of this branch do **not** migrate production and must not be used as Day 0 evidence.

### Recommended sequence

1. Confirm a Neon production backup / PITR window is available.
2. Confirm Vercel Production env: `VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1`, `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, Axiom vars, existing provider keys.
3. Merge this branch to `main` (or promote the commit with a production Vercel deploy). Do not deploy preview as a substitute.
4. Watch the production build log for `scripts/migrate-deploy.sh`:
   - pending: `20260828120000_add_generation_telemetry` then `20260828140000_generation_telemetry_validation`
   - success: `migrate deploy succeeded` or `Schema is up to date`
5. Confirm production health: `https://www.visutry.com/en/try-on/glasses` returns the Vercel Next app (existing production-smoke gate).
6. Verify telemetry schema in Neon (see section 2).
7. Start the smoke matrix (section 4). Record IDs in the worksheet at the end.

Do not apply the two migrations in reverse order. Prisma applies timestamp order: `120000` then `140000`.

No extra application restart is required after a successful Vercel production deploy.

---

## 2. Migration safety review

### `20260828120000_add_generation_telemetry`

- Additive: new enums + empty `GenerationRequest` / `GenerationAttempt`.
- No `DROP`, no `ALTER` of `TryOnTask`, no FK to `TryOnTask`.
- Uniqueness: `tryOnTaskId`; `(requestId, attemptNumber)`. Empty tables at first apply.
- Runtime: create empty tables/indexes. Acceptable at current production volume.
- Exactly-once: Prisma `_prisma_migrations` checksum.
- Rollback if the **app** is rolled back first: leave tables in place (safe; unused).
- Manual full rollback: `DROP TABLE "GenerationAttempt"; DROP TABLE "GenerationRequest";` then drop the four enums.

**PASS**

### `20260828140000_generation_telemetry_validation`

- Additive: `GenerationFailureStage` enum; nullable `failureStage` / `attemptDurationMs` / `environment`; `isTest BOOLEAN NOT NULL DEFAULT false` (PostgreSQL 11+ constant default is metadata-only).
- Indexes on new/small telemetry tables (`isTest`, `environment`, `failureStage`). Justified for baseline filters.
- No rewrite of merchant/consumer business tables.
- Rollback SQL is in the migration file. After app rollback, extra columns are unused and safe.
- Must run after migration 1.

**PASS**

**Production migration risk: LOW**

Do not alter these migrations unless a checksum/deploy failure is observed.

Historical note: some prior pilots saw a blank `prisma migrate status` schema-engine error. `migrate-deploy.sh` treats inconclusive status as “attempt deploy”. Confirm `_prisma_migrations` finished timestamps after the build rather than relying on status text alone.

---

## 3. Smoke identities / test objects

### Store / Campaign — existing QA objects: YES

Do **not** create a new merchant.

Designated REFERENCE pilot (already verified in production on 2026-08-11):

| Object | Value |
| --- | --- |
| Merchant slug | `lowercase-nyc` |
| Merchant id | `cmsor0lvi00006wi81kr12rkw` |
| `pilotType` | `REFERENCE` |
| `referenceData` | `true` |
| Store | `https://www.visutry.com/en/store/lowercase-nyc` (`default` STORE, id `cmsor128k000m6wi8uwrobdzm`) |
| Campaign | `https://www.visutry.com/en/c/lowercase-nyc/find-your-frame` (CAMPAIGN, id `cmsor10da000l6wi8kp01ujgr`) |

Recognition: `Merchant.referenceData` / `Experience.referenceData` / session `referenceData`. The writer sets `GenerationRequest.isTest=true` from those flags.

Before smoke, confirm the merchant and both experiences are still `ACTIVE`. Other REFERENCE pilots (`framed-ewe`, `article-one`, `akila`, `ello-sunglasses`) are acceptable substitutes. Do not use them if they are live commercial, not `referenceData`.

If none of these routes are ACTIVE: **blocker** = missing designated QA experience. Minimum object: one ACTIVE STORE experience and one ACTIVE CAMPAIGN experience on a `referenceData=true` merchant. Do not invent a new production catalog unless that blocker is confirmed.

### Consumer

Consumer Try-On does not use merchant `referenceData`. Smoke on production Consumer accounts is **`isTest=false`**. Do not change product identity to force `isTest=true`.

Record exact `GenerationRequest.id` / `TryOnTask.id` for every Consumer smoke row (worksheet below). Exclude those IDs only during baseline **interpretation**. Do not delete telemetry rows.

Required people/objects (existing, do not create merchants):

- One production user with **active Premium** (`isPremium` and unexpired `premiumExpiresAt`)
- One production user with **Free** quota remaining (at least 2 Consumer tries + Top Picks 4 + Compare up to 4 credits)
- An Admin session (`session.user.role === 'ADMIN'`) for `/admin/generation-reliability` and the API
- Axiom UI access for dataset `visutry-logs` (or `AXIOM_DATASET`)

---

## 4. Smoke matrix

Host: `https://www.visutry.com`. Poll Consumer tasks via `POST /api/try-on/poll` `{ "taskId" }`. Poll Store via `POST /api/store/sessions/try-on/poll`. Wait until the task is terminal. Do **not** load-test.

Expected counts below are for **first-attempt success**. A timeout retry adds a second `GenerationAttempt` on the **same** `GenerationRequest`. That is still a valid telemetry sample; record it. Do not interpret provider success/latency as a baseline metric.

| Case | UI | API | Provider | Model | Origin | Requests (1 action) | Attempts if first-attempt success | TryOnTask | isTest | Report |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A. Consumer Premium ×1 | `/en/try-on/glasses` | `POST /api/try-on/submit` then poll | `gemini` | `gemini-2.5-flash-image` | `CONSUMER` | 1 | 1 | 1 = 1 request | `false` | included in default report |
| B. Consumer Free ×2 | `/en/try-on/glasses` | same, twice | `grsai` | `nano-banana-fast` | `CONSUMER` | 1 per submit (2 total) | 1 per request | 1 per request | `false` | included |
| C. Top Picks ×1 | `/en/face-analysis` (unlocked report → generate) | `POST /api/face-analysis/top-picks-try-on` | `grsai` (forced) | `nano-banana-fast` | `CONSUMER` | **4** default presets | 4 | 4 | `false` | included |
| D. Frame Compare ×1 | `/en/try-on/glasses/compare` | `POST /api/try-on/glasses/compare` then one `.../compare/frame` per preset | `grsai` (forced) | `nano-banana-fast` | `CONSUMER` | **N = selected presets** (UI default 4, max 4) | N | N | `false` | included |
| E. Store ×1 | `/en/store/lowercase-nyc` | `POST /api/store/sessions/try-on` | `grsai` | `nano-banana-fast` | `STORE` | 1 | 1 | 1 | `true` | **excluded** unless `includeTest=1` |
| F. Campaign ×1 | `/en/c/lowercase-nyc/find-your-frame` | same Store API | `grsai` | `nano-banana-fast` | `CAMPAIGN` | 1 | 1 | 1 | `true` | **excluded** unless `includeTest=1` |

Axiom fields to confirm on every sample (under log `data`): `requestId`, `attemptId`, `providerTaskId` (GrsAi after submit), `clientSubmissionId`, `origin`, `tryOnTaskId`, `failureStage` when failed.

Premium Gemini has **no** `ATTEMPT_SUBMITTED` and `submitDurationMs` is null. That is correct.

---

## 5. Multi-frame expectations

Default Top Picks / Compare presets (`DEFAULT_TOP_PICK_PRESET_IDS`):

`rectangle-classic`, `browline-classic`, `wayfarer-classic`, `geometric-classic`

One user action is **not** one GenerationRequest.

```
One Top Picks (or Compare) action
→ N frame generations (default N=4)
→ N TryOnTask
→ N GenerationRequest
→ N GenerationAttempt on first-attempt success
```

These are **not** duplicates. Provider retries stay inside the same `GenerationRequest`.

| Field | Top Picks | Compare |
| --- | --- | --- |
| Batch key | `face-top-picks-{faceAnalysisTaskId}-v1` | `frame-compare-{userId}-{timestamp}` |
| `clientSubmissionId` | `{batchId}:{presetId}:{attempt}` | `{batchId}:{presetId}` |
| Frame id | `metadata.framePresetId` | `metadata.framePresetId` |
| `TryOnTask.id` | 1 per preset | 1 per preset |
| `GenerationRequest.id` | 1 per `TryOnTask.id` | 1 per `TryOnTask.id` |
| `GenerationAttempt.id` | 1+ per request | 1+ per request |
| `providerTaskId` | GrsAi task id on the attempt | same |

### Reconciliation query (multi-frame)

```sql
-- Replace the batch prefix after smoke.
SELECT
  t."id" AS try_on_task_id,
  t."clientSubmissionId",
  t."batchId",
  t."status" AS task_status,
  t."metadata"->>'framePresetId' AS frame_preset_id,
  r."id" AS generation_request_id,
  r."origin",
  r."finalStatus",
  r."attemptCount",
  r."isTest",
  a."id" AS generation_attempt_id,
  a."attemptNumber",
  a."providerTaskId",
  a."status" AS attempt_status
FROM "TryOnTask" t
LEFT JOIN "GenerationRequest" r ON r."tryOnTaskId" = t."id"
LEFT JOIN "GenerationAttempt" a ON a."requestId" = r."id"
WHERE t."clientSubmissionId" LIKE 'face-top-picks-%'
   OR t."clientSubmissionId" LIKE 'frame-compare-%'
ORDER BY t."clientSubmissionId", a."attemptNumber";
```

Expect N distinct `try_on_task_id` and N distinct `generation_request_id` for one action. Duplicate `(requestId, attemptNumber)` is a defect.

CLI equivalent:

```
npm run inspect:generation-telemetry -- --clientSubmissionId '<exact id>'
```

For a whole batch, use the SQL above or inspect each task id.

---

## 6. Production reconciliation queries

Prefer the inspect script (strips images/prompts):

```
npm run inspect:generation-telemetry -- --tryOnTaskId <id>
npm run inspect:generation-telemetry -- --requestId <id>
npm run inspect:generation-telemetry -- --providerTaskId <id>
```

SQL (Neon console). Do not `SELECT` image URL or prompt columns.

```sql
-- Lookup by TryOnTask.id, GenerationRequest.id, or providerTaskId
WITH target AS (
  SELECT r."id"
  FROM "GenerationRequest" r
  LEFT JOIN "GenerationAttempt" a ON a."requestId" = r."id"
  WHERE r."tryOnTaskId" = :try_on_task_id
     OR r."id" = :generation_request_id
     OR a."providerTaskId" = :provider_task_id
)
SELECT
  r."id" AS request_id,
  r."tryOnTaskId",
  r."origin",
  r."requestedProvider",
  r."requestedModel",
  r."finalStatus",
  r."finalErrorCode",
  r."failureStage",
  r."startedAt",
  r."completedAt",
  r."endToEndDurationMs",
  r."attemptCount",
  r."isTest",
  r."environment",
  r."clientSubmissionId",
  t."id" AS task_id,
  t."origin" AS task_origin,
  t."status" AS task_status,
  t."clientSubmissionId" AS task_client_submission_id,
  t."batchId",
  t."merchantFrameId",
  t."metadata"->>'framePresetId' AS frame_preset_id,
  t."metadata"->>'externalTaskId' AS task_external_task_id,
  t."metadata"->>'telemetryOrigin' AS task_telemetry_origin,
  a."id" AS attempt_id,
  a."attemptNumber",
  a."provider",
  a."model",
  a."providerTaskId",
  a."status" AS attempt_status,
  a."isTimeout",
  a."errorCode",
  a."failureStage" AS attempt_failure_stage,
  a."submittedAt",
  a."completedAt" AS attempt_completed_at,
  a."submitDurationMs",
  a."attemptDurationMs",
  a."providerDurationMs"
FROM "GenerationRequest" r
JOIN target ON target."id" = r."id"
LEFT JOIN "TryOnTask" t ON t."id" = r."tryOnTaskId"
LEFT JOIN "GenerationAttempt" a ON a."requestId" = r."id"
ORDER BY r."startedAt", a."attemptNumber";
```

`finalErrorCode` is the normalized failure category. `failureStage` is the layer.

Post-migrate sanity:

```sql
SELECT migration_name, finished_at, rolled_back_at
FROM "_prisma_migrations"
WHERE migration_name IN (
  '20260828120000_add_generation_telemetry',
  '20260828140000_generation_telemetry_validation'
);

SELECT COUNT(*) FROM "GenerationRequest";
SELECT COUNT(*) FROM "GenerationAttempt";
```

---

## 7. Axiom reconciliation procedure

Dataset: `AXIOM_DATASET` or `visutry-logs`. Category is a first-class field. Lifecycle **message** is structured (`REQUEST_STARTED`, …), not an error-string scrape.

Filter by `data.requestId` (preferred). Also: `data.attemptId`, `data.providerTaskId`, `data.clientSubmissionId`, `data.tryOnTaskId`.

```
['visutry-logs']
| where category == "generation"
| where data.requestId == "<GenerationRequest.id>"
| sort by _time asc
| project _time, message, ['data.requestId'], ['data.attemptId'], ['data.attemptNumber'], ['data.providerTaskId'], ['data.status'], ['data.origin'], ['data.failureStage'], ['data.tryOnTaskId']
```

If the UI stores nested maps, use `data.requestId` or `['data']['requestId']` as the dataset actually projects.

### GrsAi (Free / Top Picks / Compare / Store / Campaign)

`REQUEST_STARTED` → `ATTEMPT_STARTED` → `ATTEMPT_SUBMITTED` (has `providerTaskId`) → provider poll logs (`tryon-service` / `grsai`, same ids) → `ATTEMPT_COMPLETED` or `ATTEMPT_FAILED` / `ATTEMPT_TIMEOUT` → `REQUEST_COMPLETED` or `REQUEST_FAILED`.

Timeout-then-retry: `ATTEMPT_TIMEOUT` **without** `REQUEST_FAILED`, then `ATTEMPT_STARTED` attemptNumber=2, then terminal request event.

### Gemini Premium (sync)

`REQUEST_STARTED` → `ATTEMPT_STARTED` → `ATTEMPT_COMPLETED` / `ATTEMPT_FAILED` → `REQUEST_COMPLETED` / `REQUEST_FAILED`.

No `ATTEMPT_SUBMITTED`. `submitDurationMs` stays null.

Axiom ingest is fail-open. Missing Axiom rows with present DB rows is an observability delivery issue, not a reason to change providers.

---

## 8. Admin / API / CLI report validation

After smoke, as an Admin:

1. Browser: `https://www.visutry.com/admin/generation-reliability?period=24h`
2. Same session: `GET https://www.visutry.com/api/admin/generation-reliability?period=24h`
3. From a laptop with production `DATABASE_URL` (read):  
   `npm run report:generation-reliability -- --period 24h`

Then repeat with test traffic visible:

- Admin: `?period=24h&includeTest=1`
- API: `?period=24h&includeTest=1`
- CLI: `--period 24h --include-test`

Compare, same window:

- `requests`, `attempts`, `inFlight`, `terminalRequests`
- first-attempt success, final success, failure, timeout (as **counts implied by rates × terminalRequests**, not as SLOs)
- provider / model / origin breakdowns
- normalized error (`breakdowns.error`)
- failure stage (`breakdowns.failureStage`)
- P50/P90/P95/P99 = `endToEndDurationMs`; attempt P* = `providerDurationMs`; submit P* = `submitDurationMs`

All three surfaces call `queryGenerationReliabilityReport`. They must match.

Default report (`isTest=false`): Consumer smoke **in**; Store/Campaign QA **out**.  
`includeTest=1`: Store/Campaign QA **in**.

Do not treat smoke percentages as baseline metrics.

---

## 9. Baseline Day 0 gate

Declare Day 0 only if **all** are true:

- Both migrations finished in `_prisma_migrations` with `rolled_back_at` null
- Production app is the telemetry revision (Vercel production deployment of this commit)
- Smoke A–F executed at low volume
- Each sample reconstructs: UI task id → `GenerationRequest` → attempts → `providerTaskId` (GrsAi) → Axiom `data.requestId`
- No duplicate `GenerationRequest` per `tryOnTaskId`; no duplicate `(requestId, attemptNumber)` from polling
- Store origin `STORE`; Campaign origin `CAMPAIGN`; retries keep the same `GenerationRequest.id` and origin
- Top Picks / Compare: N tasks = N requests (not collapsed)
- Admin / API / CLI match for the same period
- Gemini vs GrsAi latency fields are distinct (no silent reuse of submit as provider duration)

If all pass:

- Phase 1 Measurement = **PASS**
- Baseline Collection = **START**
- **Baseline Day 0** = the next full UTC production day after that confirmation  
  Exclude: pre-deploy rows, incomplete hours before confirmation, `isTest=true`, and listed Consumer smoke IDs during interpretation only

If any fail: Phase 1 Measurement = **NOT PASS**; Baseline Collection = **BLOCKED**. Do not start the 7-day window.

---

## 10. Smoke data handling

- Store/Campaign QA: `isTest=true` → excluded from default baseline queries.
- Consumer smoke: `isTest=false`. Record IDs in the worksheet. Do not delete rows.
- Optionally exclude known Consumer smoke IDs only when interpreting Day 0–14.
- Do not change product identity, routing, or telemetry writers solely for cleaner reports.

---

## 11. Post-deploy observation freeze

Once Day 0 begins, do **not** change for the first 7 days unless there is a production-severity incident:

- provider routing
- retry policy (`MAX_GRSAI_TIMEOUT_RETRIES`)
- timeout thresholds (`GRSAI_SUBMIT_TIMEOUT_MS`, stale dispatch 2 minutes)
- model selection
- provider integration behavior

Changing these during observation invalidates the baseline.

---

## 12. Smoke worksheet (fill during execution)

Copy and fill. Do not commit production user PII.

| Case | Time (UTC) | TryOnTask.id | GenerationRequest.id | attemptCount | providerTaskId | origin | isTest | Axiom requestId found |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Premium |  |  |  |  |  | CONSUMER | false |  |
| Free 1 |  |  |  |  |  | CONSUMER | false |  |
| Free 2 |  |  |  |  |  | CONSUMER | false |  |
| Top Picks (×N) |  |  |  |  |  | CONSUMER | false |  |
| Compare (×N) |  |  |  |  |  | CONSUMER | false |  |
| Store |  |  |  |  |  | STORE | true |  |
| Campaign |  |  |  |  |  | CAMPAIGN | true |  |
