# G1-R1 — Consumer Try-On UNKNOWN reconciliation (zero-spend operator runbook)

**Date:** 2026-10-22  
**State:** Draft only; PR #439 is not deployed. GrsAi remains production Primary.  
**Scope:** Consumer origin, existing TryOnTask/GenerationRequest/GenerationAttempt evidence. No provider dispatch or DB repair.

## Why this exists

A provider generation POST is non-idempotent unless its acceptance can be proved otherwise. The Consumer service marks a task `PROCESSING/UNKNOWN` before the initial outbound call, or `PROCESSING/SUBMITTING` when it fences a timeout retry. A network timeout, crashed process or lost response cannot prove the provider did not accept/charge the request. Do **not** turn such tasks into `FAILED` on an age threshold and do **not** automatically POST again. A lost poll/status response is different: back off **querying**, never generating.

The Consumer UI may time out after five minutes even while the server holds an unresolved task. A browser timeout is **not** a provider failure. This branch keeps the in-page task ID for resumed polling, and the original clientSubmissionId for a lost submit response; neither action authorizes a new paid generation. A newly selected photo/frame creates a distinct logical request and can have separate cost; the user must not mistake this for resuming the first request.

## Read-only triage

Run only in an approved read-only PostgreSQL connection and with a narrow time window. The following query emits no image URLs, face contents, user PII or provider secrets. It is a **candidate queue**, not a charge/failure determination.

```sql
SELECT
  t.id AS task_id,
  t.status,
  t."dispatchVersion" AS dispatch_version,
  t."createdAt" AS created_at,
  t."updatedAt" AS updated_at,
  t.metadata ->> 'dispatchOutcome' AS dispatch_outcome,
  (t.metadata ->> 'externalTaskId') IS NOT NULL AS has_provider_task_id,
  (t.metadata ->> 'providerPollNeedsAttention') = 'true' AS poll_attention,
  t."dispatchLeaseUntil" AS lease_until
FROM "TryOnTask" AS t
WHERE t.origin = 'CONSUMER'
  AND t."createdAt" >= now() - interval '24 hours'
  AND (
    t.metadata ->> 'dispatchOutcome' IN ('UNKNOWN', 'SUBMITTING')
    OR t.metadata ->> 'providerPollNeedsAttention' = 'true'
  )
ORDER BY t."createdAt" DESC
LIMIT 100;
```

Use the **task ID**, not photo URL, as the primary case reference. For a single flagged task, inspect telemetry without image data:

```sql
SELECT
  gr.id AS generation_request_id,
  gr."tryOnTaskId" AS task_id,
  gr."finalStatus" AS request_status,
  gr."attemptCount" AS attempt_count,
  ga."attemptNumber" AS attempt_number,
  ga.provider,
  ga.status AS attempt_status,
  ga."providerTaskId" IS NOT NULL AS has_provider_task_id,
  ga."isTimeout" AS is_timeout
FROM "GenerationRequest" AS gr
LEFT JOIN "GenerationAttempt" AS ga ON ga."requestId" = gr.id
WHERE gr."tryOnTaskId" = :task_id
ORDER BY ga."attemptNumber";
```

`:task_id` means a bound, validated task ID provided by the **read-only client** (not unescaped SQL interpolation). Telemetry may be incomplete; a null task ID in telemetry is **not** evidence that a generation was unbilled. Query sanitized Axiom correlation by task/request/attempt ID if needed; never collect API keys, data URIs, source/result image URLs, faces, or request bodies.

## Human decision table

| Observed state | Safe next action | Explicitly prohibited |
| --- | --- | --- |
| `UNKNOWN` or `SUBMITTING`, no provider ID | Mark **acceptance unverified**. Gather provider request/charge-ledger evidence; hold automatic retry. Offer customer support/credit review through an approved separate process. | New POST, lease reset, status rewrite to FAILED because of age |
| Provider ID known; status not terminal | Poll **that same ID** via approved read-only path with backoff. | New generation or cross-provider failover |
| Poll receives 408/429/5xx or timeout | Wait/back off; escalate prolonged errors. | Treat query error as a generation failure or consume additional quota |
| Definitive terminal result with durable image | Verify same task and quota-settled-once contract. | Duplicate user debit or duplicate result settlement |
| Conflicting DB rows/telemetry | Preserve exact IDs, versions and timestamps; request a reviewed case-specific reconciliation. | Blindly edit metadata, delete task, lower CAS version, or force-delete leases |

## Operator handoff / customer messaging

- Case record: task ID, created/last-updated timestamps, dispatch version, outcome, whether ID is known, attempt count, sanitized error code, evidence links, owner, next-check deadline.
- Public-facing copy: **“We have not yet confirmed your Try-On result. Please check the same request again later; you do not need to submit the same photos again. If it remains unresolved, contact support with your task reference.”** Never assert an extra charge, refund or failure without evidence.
- Triage target (proposed, not an automated SLA): review the queue daily; review a previously-accepted task stuck in repeated query errors after 15 minutes; flag any unknown acceptance older than 5 minutes for human inspection. None of these time thresholds is permission to re-dispatch.
- If the provider supplies neither stable acceptance lookup nor charge evidence, resolution remains **unverified**. A manual goodwill credit or new task is a separate customer/business decision, not a silent technical replay.
- The existing `pending-tasks` API excludes tasks older than 30 minutes; after browser refresh those may no longer auto-resume. A durable customer-support experience for such cases is a **release blocker to be addressed before Production activation**, not something this runbook falsely declares solved.

## Verification and authority

- Local Codex: real disposable PostgreSQL CAS probes plus synthetic 4-image browser Golden Path for #439 exact head. No vendor API calls or real faces.
- ChatGPT Lead: code review, zero-spend mock tests, CI, operational case design.
- Separate approval required for schema changes, data repair, provider ledger access, production release, vendor spending, account setup and any new billable generation.

See also [G1-R1 dispatch safety](./ai-provider-resilience-g1-r1-dispatch-safety-2026-10-22.md) and [integration review](./ai-provider-resilience-g1-r1-integration-review-2026-10-22.md).
