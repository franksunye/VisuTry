# AI Provider Resilience — G1-R1 Consumer Dispatch Safety

**Date:** 2026-10-22  
**Status:** Draft PR #436, engineering-only, NOT APPROVED FOR MERGE OR PRODUCTION  
**Tracking:** [#430](https://github.com/franksunye/VisuTry/issues/430), [#434](https://github.com/franksunye/VisuTry/issues/434), [#435](https://github.com/franksunye/VisuTry/issues/435)

## Scope and invariants

This slice protects the existing Consumer Grsai Try-On path. Grsai stays Production Primary. It does not dispatch Kie, install credentials, route production traffic, change database schema, or make an external test call. Store/Campaign dispatch ownership and Premium Direct routing remain separate.

One logical Consumer `clientSubmissionId` is one reusable task per user. A new user-facing submission with no key is **not** a replay: callers must preserve the same key across network retries. Reusing a key for another Try-On type is rejected. Quota-exhausted requests may read/reuse an existing same-user task, but may not create a new task.

## Consumer task metadata contract

| Field | Meaning |
| --- | --- |
| `dispatchOutcome: UNKNOWN` | Grsai may have accepted/billed the POST, but acceptance is not confirmed. Do **not** resubmit, including after lease expiry. |
| `dispatchOutcome: SUBMITTING` | A fenced Consumer timeout retry was claimed. The next result may be unknown. Do **not** re-dispatch from another poller. |
| `dispatchOutcome: ACCEPTED` | `externalTaskId` was durably recorded and may be polled. |
| `dispatchVersion` | Database CAS fence for Consumer retry owner and stale poll writers. Store continues its own dispatch flow. |
| `dispatchLeaseOwner` / `dispatchLeaseUntil` | One retry claimer. Lease expiry alone never establishes non-acceptance or authorizes a new POST. |
| `retryCount` | Bounded existing Grsai generation timeout retry (maximum one); updated with the retry claim. |
| `nextProviderPollAt` | Consumer-only transient poll backoff, 2 seconds escalating to at most 60 seconds. |
| `providerPollNeedsAttention` | Set after 15 minutes of consecutive transient provider-query errors; **not** evidence the generation failed. |

The initial Consumer Grsai call writes `PROCESSING/UNKNOWN` before the outbound POST. On accepted task ID it writes `PROCESSING/ACCEPTED`; transient POST ambiguity leaves `UNKNOWN` for explicit reconciliation. An old `PENDING` Consumer record can be stale-failed only when no outbound dispatch was recorded. Do not turn `UNKNOWN` into `FAILED` based on age.

A provider **status-query** HTTP 408/429/5xx, transient business code, or network timeout is not a **generation** failure. Consumer polling backs off without new generation cost. A documented terminal generation failure remains distinct. Existing result-persistence fencing, task ownership, and quota settlement stay in the same logical task.

## Operator reconciliation — fail closed

1. Look up the **same logical task** by `TryOnTask.id`, user-scoped `clientSubmissionId`, `GenerationRequest` / `GenerationAttempt`, and sanitized Axiom correlation. Never print or export face-photo payloads, source URLs, or API keys.
2. If there is an `externalTaskId`, query **that exact existing task** through an authorized read-only provider/status mechanism. A transient query error does not permit resubmission.
3. If the submit outcome is `UNKNOWN` with no external ID, request vendor acceptance/charge ledger evidence (time window, request correlation). Until verified **not accepted and not charged**, keep the logical task blocked for automatic dispatch. Document uncertainty, customer support/credit remediation separately.
4. Any repair of task metadata or decision for a new billable attempt requires a reviewed, fenced operator procedure and explicit authorization. **This Draft PR provides no admin unlock or automatic failover.**
5. If result persistence races with a retry claim, the Consumer `dispatchVersion` and result-persistence lease prevent a stale poll from overwriting a newer attempt. Investigate conflicts rather than resetting lease/version counters.

## Offline acceptance and release gates

- Synthetic/mocked 2+ pollers for the same provider timeout produce one retry claim and one outbound call.
- Initial submit timeout and retry timeout remain `UNKNOWN`, with no blind replay.
- Same-key Consumer replay, exhausted-quota replay, 429/503 bounded query retry, and terminal generation failure stay separate.
- Preserve Store/Campaign tenant and settlement boundaries, paid multi-image workflows, Premium Direct, and private Blob access.
- Full repository regression, exact-head CI, and local Mock/DB/browser QA are required. The GitHub PR stays Draft until Lead approval; no merge, migration, deployment, real user-media transfer, or billable Kie/OpenRouter test is authorized.
- Kie `nano-banana-2-lite` and `flux-2/pro-image-to-image` are future **mock-only contract** work in G1-R1-B after separate R1-A review, not enabled provider routing.

## Known operational limitation

Without a vendor-side lookup/idempotency/ledger mechanism, `UNKNOWN` cannot be automatically resolved safely. This favors one possibly stalled user-facing task over an uncontrolled duplicate paid generation. A customer-facing resolution and bounded operator queue must be reviewed before Production activation. Face Analysis replay/charging is a separate G1-B lane, not remediated here.
