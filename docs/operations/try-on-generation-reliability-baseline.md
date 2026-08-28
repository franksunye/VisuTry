# Try-On Generation Reliability Baseline

**Status:** Active measurement process  
**Owner:** Engineering  
**Last updated:** 2026-08-28

This document defines how VisuTry measures Try-On generation reliability. This work does **not** establish a production SLO and does **not** change provider selection, retry count, timeouts, or routing.

---

## A. Definitions

### GenerationRequest

One logical product/user generation request. Examples:

- One Consumer `/api/try-on/submit` (or Compare/Top Picks frame) that creates one `TryOnTask`
- One Store/Campaign frame render that creates one `TryOnTask`

One shopper action can create multiple GenerationRequests when it truly generates multiple images. Face Analysis Top Picks (`browline-classic`, `rectangle-classic`, `wayfarer-classic`) and Frame Compare are separate logical requests, not duplicates.

Provider retries do **not** create a new GenerationRequest.

Final request status is written only from `STARTED`. `COMPLETED` and `FAILED` are sticky. An intermediate timeout that still has a retry path leaves the request `STARTED`. Duplicate polls after a terminal state do not rewrite `completedAt` / `endToEndDurationMs`.

### GenerationAttempt

One actual provider invocation. Polling the same GrsAi `taskId` is not a new attempt. A timeout retry that submits a new provider task is attempt 2 of the same request.

### First-attempt success

The request’s attempt number 1 reached usable output (`GenerationAttempt.status = COMPLETED`). Terminal requests are the denominator.

### Final success

The request ended with usable output available to VisuTry (`GenerationRequest.finalStatus = COMPLETED`). Provider “accepted task” is not success.

### Timeout

An attempt classified as timeout (`isTimeout = true`, typically `PROVIDER_TIMEOUT`). Request-level timeout rate is the share of terminal requests that had at least one timeout attempt.

`errorCode = PROVIDER_TIMEOUT` is not enough on its own. Use `failureStage` to tell layers apart:

| failureStage | Typical case |
| --- | --- |
| `SUBMIT` | GrsAi HTTP submit abort (~25s default) |
| `PROVIDER_PROCESSING` | Async provider task timed out after a task ID was returned, or sync Gemini generation failed |
| `POLL_NETWORK` | Poll HTTP/network error |
| `STALE_DISPATCH` | Consumer dispatch with no `externalTaskId` failed after 2 minutes |
| `ASSET_UPLOAD` | Result/source persist/upload |
| `INTERNAL` | Claim/internal failure |
| `UNKNOWN` | Unclassified |

Timeout thresholds themselves are unchanged.

### Latency families

These fields are not interchangeable:

| Field | Meaning |
| --- | --- |
| `GenerationRequest.endToEndDurationMs` | Logical request: `startedAt` → terminal usable success or terminal failure |
| `GenerationAttempt.submitDurationMs` | Submit/API: HTTP submit start → provider task ID returned (async GrsAi only) |
| `GenerationAttempt.providerDurationMs` | Provider processing. Async GrsAi: `completedAt − (submittedAt + submitDurationMs)`. Sync Gemini: full attempt span |
| `GenerationAttempt.attemptDurationMs` | Full attempt wall clock: `submittedAt` → `completedAt` |

Report P50/P90/P95/P99 use `endToEndDurationMs` on terminal requests with a finite duration. Attempt percentiles use `providerDurationMs` on terminal attempts (`COMPLETED` / `FAILED` / `TIMEOUT`) only. Submit percentiles use `submitDurationMs` where recorded. In-flight rows are excluded.

### Origin

`GenerationRequest.origin` is `STORE` or `CAMPAIGN` (or `CONSUMER`) at request creation, from Experience type / `metadata.telemetryOrigin`. Retries and polls reuse the same request row, so origin does not change.

### Test / QA exclusion

`GenerationRequest.isTest` is the canonical QA marker, derived from existing `Merchant.referenceData` / `Experience.referenceData` / `MerchantSession.referenceData`. `environment` is `VERCEL_ENV` or `NODE_ENV` at insert time.

Default reports exclude `isTest=true`. Pass `includeTest=1` (admin/API) or `--include-test` (CLI) to include them. Baseline Day 0 must use production rows with `isTest=false`.

---

## B. Data source

| System | Role |
| --- | --- |
| **Postgres (`GenerationRequest` / `GenerationAttempt`)** | System of record for historical reliability metrics. Independent of Try-On image retention. |
| **Axiom** | Operational logs. Reconstruct a request with `requestId`, `attemptId`, `providerTaskId`, `clientSubmissionId`, `failureStage`. |
| **GA4** | Product/funnel events (`try_on_started`, `try_on_completed`, `try_on_failed`). Not used for provider reliability baseline. |

Telemetry is fail-open: a DB telemetry write failure must not fail generation. Tables do not store image blobs, raw base64, or full provider payloads.

---

## C. Baseline process

Baseline accumulation starts only after production reconciliation passes.

- **Day 0:** first full production day after telemetry is proven trustworthy. Exclude pre-deploy history, incomplete windows, and `isTest=true` QA smoke.
- **Day 1–7:** collect without changing provider behavior.
- **Day 7:** intermediate review.
- **Day 8–14:** continue collection.
- **Day 14:** freeze Baseline v1.

No SLO (for example success ≥ 98% or P95 ≤ 60s) is established in this phase.

---

## D. How to query

Admin (internal): `/admin/generation-reliability?period=24h|7d|14d`

API (admin auth): `GET /api/admin/generation-reliability?period=24h|7d|14d` or `from` / `to`. Optional: `includeTest=1`, `environment=production`.

CLI:

```
npm run report:generation-reliability -- --period 7d
npm run report:generation-reliability -- --from 2026-08-14T00:00:00.000Z --to 2026-08-28T00:00:00.000Z
npm run report:generation-reliability -- --period 7d --include-test --environment production
```

The three surfaces read the same `GenerationRequest` / `GenerationAttempt` rows.

---

## E. Correlation

Search Axiom by `requestId` (preferred), then `tryOnTaskId` / `providerTaskId` / `clientSubmissionId`. Lifecycle events:

- `REQUEST_STARTED` / `REQUEST_COMPLETED` / `REQUEST_FAILED`
- `ATTEMPT_STARTED` / `ATTEMPT_SUBMITTED` / `ATTEMPT_COMPLETED` / `ATTEMPT_FAILED` / `ATTEMPT_TIMEOUT`

Multi-frame mapping:

`clientSubmissionId` (batch/client action) → one or more `TryOnTask.id` → one `GenerationRequest.id` per task → one or more `GenerationAttempt.id` → `providerTaskId`.

---

## F. Migrations

1. `20260828120000_add_generation_telemetry` — create tables. Additive. Unique on `tryOnTaskId` and `(requestId, attemptNumber)`. No FK to `TryOnTask`.
2. `20260828140000_generation_telemetry_validation` — add `failureStage`, `attemptDurationMs`, `isTest`, `environment`. Additive nullable/defaulted columns. Rollback SQL is in the migration file.

Current production TryOnTask volume does not require a table rewrite. New indexes are btree on low-cardinality flags + `startedAt`.

---

## G. Retention

`GenerationRequest` is not a foreign key of `TryOnTask`, so image retention cleanup does not delete baseline rows. Phase 1 does not auto-expire telemetry. Revisit if volume grows (90-day retention is a reasonable follow-up).
