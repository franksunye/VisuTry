# G1-B — Face Analysis idempotency and quota-once design (proposal only)

**Date:** 2026-10-22  
**Status:** DESIGN / ZERO-SPEND; **NOT IMPLEMENTED**, no database migration authorized.  
**Tracking:** #430, #434; G1-R1 #439 is Consumer Try-On only.

## Verified current behavior at #439 baseline

- `src/app/api/face-analysis/submit/route.ts` checks quota **before** reading `clientSubmissionId`, calls `submitFaceAnalysis` for each accepted POST, and calls `deductUserQuota` on each completed response.
- `src/lib/face-analysis-service.ts` uploads a photo to Blob, inserts a new `FaceAnalysisTask`, sends an external GrsAi vision/chat request, and then updates the task. The `clientSubmissionId` is only stored in JSON metadata.
- `FaceAnalysisTask` currently has neither a first-class submission ID/unique constraint nor a `quotaSettledAt` field. `deductUserQuota` is a per-call debit, not bound transactionally to a FaceAnalysis task.
- The existing `tests/unit/api/face-analysis-submit-critical.test.ts` characterizes concurrent same-key calls as two upstream submissions and two deductions. Treat that test as **historical red evidence** until a corrected contract supersedes it.
- The provider wrapper avoids automatic retry after an ambiguous fetch, but a browser retry is a **new HTTP request** and still creates a new task today.

## Proposed contract (requires a separately approved migration)

1. Persist `clientSubmissionId` as a nullable first-class `FaceAnalysisTask` field with database-enforced uniqueness on `(userId, clientSubmissionId)`. Existing null-key records retain legacy behavior; **new clients must supply a stable non-empty key** and hold it through lost responses.
2. Resolve an existing same-user/key task **before** denying exhausted quota, uploading another photo, or invoking GrsAi. A different actor must not retrieve another user's task. Reject reuse with conflicting logical input parameters; define an explicit input digest or immutable request fingerprint without logging/retaining raw face bytes.
3. The winner reserves exactly one logical task via a DB unique insert/transaction; losers return or poll the winner. Handle `P2002` race and transaction conflicts. If Blob upload happens before reservation because `userImageUrl` is non-nullable, define orphan-blob cleanup that never erases the winner's media; prefer reservation before any external provider POST.
4. Before a non-idempotent GrsAi request, persist an ambiguous acceptance fence. Distinguish `UNKNOWN` (the provider might have accepted/billed) from definitively unsubmitted, accepted, completed and terminal failed. On crash/timeout with unknown acceptance **do not auto-resubmit**, even after lease expiry or browser replay.
5. Settle quota **exactly once** per completed task with a durable `quotaSettledAt` / `quotaSource` marker, in the same serializable transaction as the user counter update (pattern: `settleTryOnTaskQuota`). Concurrent replay, route retry, worker restart, and exhausted quota must not cause a second debit. Do not debit a failed/ambiguous task.
6. Keep Face Analysis output privacy and report-unlock entitlement stable across replay; never leak full paid reports to a caller who is not entitled. The original quota source determines `reportUnlocked` for the same task. User-visible retries fetch the existing task rather than re-uploading the user's face.
7. Use a separate Face Analysis delivery flag/adapter for any future alternative **vision/chat** provider. Kie image-to-image test SKUs are not automatically eligible as Face Analysis replacements.

## Offline contract test matrix

| Case | Required result |
| --- | --- |
| Concurrent same-user same-key first POSTs | One task, at most one external call, one quota settlement on success |
| Same key after successful completion / exhausted quota | Same result/task/entitlement; no new external call/debit |
| Same key while processing | Same task; no new external call |
| Same key after lost submit response or crashed worker | Reuse fenced task, preserve `UNKNOWN`, no blind POST |
| Same key with conflicting photo or geometry | Explicit conflict without exposing stored media |
| Different users with same key | Distinct tenant-scoped tasks |
| Failure before provider dispatch | No quota debit; guarded explicit new-attempt policy |
| Terminal provider failure, 408/429/503 query transient | Terminal failure no debit; transient query is not a new generation |
| Completion settlement race / transaction conflict | Serializable retry, exactly one task marker and user debit |
| No-key legacy request | Existing behavior explicitly documented; migration/cutover test |
| Premium/free-trial report entitlement | Result access remains tied to original task's entitlement |

## Gate sequence

- **G1-B0**: review exact schema, quota mutations and privacy/retention boundaries; approve a migration-backed or alternative durable uniqueness strategy.
- **G1-B1**: isolated code + Jest/PostgreSQL concurrency tests against synthetic inputs; turn historical doubled-debit assertion into a corrected positive test.
- **G1-B2**: local synthetic UI Golden Path, failure/unknown scenarios and no-leak review; full CI.
- **G1-B3**: separately authorized production release/rollback (GrsAi primary unchanged). Any live or paid provider study needs its own approval.

**Non-goals now:** no provider signup or spend, production route switching, Kie uploads, real customer faces, schema edits, acceptance/charge reconciliation writes, or automatic cross-provider failover.
