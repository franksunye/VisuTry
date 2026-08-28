# Try-On Generation Reliability Baseline

**Status:** Active measurement process  
**Owner:** Engineering  
**Last updated:** 2026-08-28

This document defines how VisuTry measures Try-On generation reliability. This PR does **not** establish a production SLO.

---

## A. Definitions

### GenerationRequest

One logical product/user generation request. Examples:

- One Consumer `/api/try-on/submit` (or Compare/Top Picks frame) that creates one `TryOnTask`
- One Store/Campaign frame render that creates one `TryOnTask`

One shopper action can create multiple GenerationRequests when it truly generates multiple images. Face Analysis Top Picks (`browline-classic`, `rectangle-classic`, `wayfarer-classic`) and Frame Compare are separate logical requests, not duplicates.

Provider retries do **not** create a new GenerationRequest.

### GenerationAttempt

One actual provider invocation. Polling the same GrsAi `taskId` is not a new attempt. A timeout retry that submits a new provider task is attempt 2 of the same request.

### First-attempt success

The request’s attempt number 1 reached usable output (`GenerationAttempt.status = COMPLETED`). Terminal requests are the denominator.

### Final success

The request ended with usable output available to VisuTry (`GenerationRequest.finalStatus = COMPLETED`). Provider “accepted task” is not success.

### Timeout

An attempt classified as timeout (`isTimeout = true`, typically `PROVIDER_TIMEOUT`). Request-level timeout rate is the share of terminal requests that had at least one timeout attempt.

### End-to-end latency

`GenerationRequest.endToEndDurationMs` = `completedAt - startedAt` for terminal requests. Provider attempt latency is `providerDurationMs` on completed attempts. Percentiles use completed observations only (`percentile_cont` interpolation).

---

## B. Data source

| System | Role |
| --- | --- |
| **Postgres (`GenerationRequest` / `GenerationAttempt`)** | System of record for historical reliability metrics. Independent of Try-On image retention. |
| **Axiom** | Operational logs. Reconstruct a request with `requestId`, `attemptId`, `providerTaskId`, `clientSubmissionId`. |
| **GA4** | Product/funnel events (`try_on_started`, `try_on_completed`, `try_on_failed`). Not used for provider reliability baseline. |

Telemetry tables do not store image blobs or raw provider payloads.

---

## C. Baseline process

1. Deploy this instrumentation.
2. Validate telemetry correctness (request/attempt counts, origins, no duplicate rows on poll).
3. Collect 7 days.
4. Intermediate review.
5. Collect 14 days.
6. Freeze the first production baseline from that window.

No production SLO is being established in this PR. The baseline starts accumulating only after deploy and validation.

---

## D. How to query

Admin (internal): `/admin/generation-reliability?period=7d`

API (admin auth): `GET /api/admin/generation-reliability?period=24h|7d|14d` or `from` / `to`

CLI:

```
npm run report:generation-reliability -- --period 7d
npm run report:generation-reliability -- --from 2026-08-14T00:00:00.000Z --to 2026-08-28T00:00:00.000Z
```

---

## E. Correlation

Search Axiom by `requestId` (preferred), then `tryOnTaskId` / `providerTaskId` / `clientSubmissionId`. Lifecycle events:

- `REQUEST_STARTED` / `REQUEST_COMPLETED` / `REQUEST_FAILED`
- `ATTEMPT_STARTED` / `ATTEMPT_SUBMITTED` / `ATTEMPT_COMPLETED` / `ATTEMPT_FAILED` / `ATTEMPT_TIMEOUT`

---

## F. Retention

`GenerationRequest` is not a foreign key of `TryOnTask`, so image retention cleanup does not delete baseline rows. Phase 1 does not auto-expire telemetry. Revisit if volume grows (90-day retention is a reasonable follow-up).
