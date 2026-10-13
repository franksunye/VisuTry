# Factory #406 — tenant-scoped durable operation ledger (source contract)

**This is an independent foundational PR; not an activated write orchestration or Factory G4 certification.**

`MerchantFactoryOperation` persists a unique `(merchantId, operationId)` claim for one **Human Owner-authorized** Factory operation. The server fingerprint binds tenant, action, target, expected version and strict **normalized Manifest**. Claims are unique and first-writer-only. A matching `COMPLETED` operation returns only its original bounded sanitized receipt, never replays the underlying business write. A mismatched fingerprint/owner or a still-`IN_PROGRESS` operation rejects, because a crash may have left a partially completed canonical command. Unknown SQL faults are not hidden as retries.

Completion is a status CAS `IN_PROGRESS → COMPLETED` with strict receipt schema: version, finite action status, resource ID, changed-field names, explicit `NOT_EXECUTED` public rendering and `releaseReady:false`. No arbitrary customer data, token, raw manifest, provider payload or shopper PII in receipt. A pending claim is **not** automatically retried or treated as a success; reconciliation requires independent real DB readback and explicit Owner action.

This ledger intentionally does NOT yet claim:
- Atomic cross-service business-write + ledger completion (existing canonical commands own their transactions);
- wiring into #408/#409/#400/#411, which is required in a dependent reviewed PR before using those as durable idempotent operations;
- a full beforeSnapshot/afterSnapshot restore, Campaign/Store publish, Billing, or G4 release.

Migration is additive, with tenant FK, unique key and indexed status. Needs exact-head CI, PostgreSQL migration and two-tenant runtime readback, then integration and restore acceptance. `releaseReady=false`.
