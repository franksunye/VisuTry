# Database Migration Baseline Governance

**Status:** DB1A safety preparation; no baseline is active and no database was changed by this work.\
**Frozen future baseline identity:** `20261003000000_canonical_schema_baseline`\
**DB1A source base:** `acbb581c03c1931e4e14c2e8715b8ef902dc9a47`\
**Immutable file provenance:** [`migration-history-provenance-20261003.md`](./migration-history-provenance-20261003.md)

## Staged cutover boundary

The 53 current migration directories remain in `prisma/migrations` unchanged. DB1A adds only a fail-closed deployment guard, tests, and historical provenance. It does not activate candidate baseline SQL, change `db-local.sh`, remove `prisma db push`, edit `_prisma_migrations`, run `migrate resolve`, or deploy.

The future baseline is a new identity after the current active history. Do not reuse `00000000000000_canonical_baseline` or any historical migration name. Historical backfill SQL is provenance of one-time data repair and must not be replayed on a fresh database.

The deploy wrapper keeps the legacy-tree behavior while the future baseline is absent. Once the canonical baseline file exists in the configured active tree, the wrapper performs a read-only direct-connection check of `_prisma_migrations` and requires exactly one row for the frozen baseline name, with `finished_at IS NOT NULL`, `rolled_back_at IS NULL`, and a checksum matching the active baseline file. Missing, failed, rolled-back, duplicate, mismatched, malformed, or unreadable adoption state fails closed before stale-lock cleanup or `migrate deploy`.

After a valid adoption anchor, Prisma 7.1 may report old ledger-only migration names as absent from the active directory. Such history differences are not blanket-rejected: a pending future delta is deployable only when Prisma reports the canonical baseline as the exact last common migration, the status exit is the known pending exit, and no failure/checksum/divergence signal is present. DB0 observed an up-to-date exit after successful baseline adoption, which skips deploy. Preview, CI, and Local continue to skip Production migrations.

## Historical ledger facts from DB0

The read-only DB0 audit recorded 56 Production ledger rows across 55 unique names: 55 finished rows and one rolled-back row. `20260605120000_add_face_analysis_task` has both a rolled-back and a finished ledger row; this is historical evidence, not permission to edit or normalize the ledger.

Two Production ledger names have no active migration directory in the audited source tree:

| Production-only name | Recorded checksum / provenance |
| --- | --- |
| `00000000000000_canonical_baseline` | Historical baseline SQL checksum `f9a2b98a7ec4fc519bbd38edcb95c76d29ecddeacbf4eb55a6eb2d8f01d2326e`; exact historical source is recoverable from commit `b1d5442ac8aa9d3297db12ca77abc498b2bc83a6`. Production recorded this name; do not reuse it. |
| `20241121_add_try_on_type` | Production recorded checksum `0`; no source migration was found in the audited repository history. |

The Production-applied variant of `20260805180000_store_gate_a1_four_epics` is preserved at commit `3cb445f8c96b2e4ee547aac1e7db1f439621629a`, SHA-256 `0a188ff7e5ef2abf6311247f7c5e7e436952f0facd384ded4b0c1bbb0cc5e4c9`. At DB1A base, the current repository file has SHA-256 `6cbfc91e29ff2e176cfff1fce8f3da46f55390347474107d3de1ff36df53ccc4`. This is a known checksum mismatch. Neither variant or ledger checksum is to be “fixed” as part of DB1A; both bytes remain independently recoverable.

The previous runbook’s note that a Production baseline transition had not been executed conflicts with the Production-only old baseline ledger row. Preserve that discrepancy as provenance; DB1A does not infer or rewrite how the row was created.

The one-time `20260826120000_backfill_ello_sponsored_usage` and `20260826150000_reconcile_ello_sponsored_usage` SQL is historical data backfill/reconciliation. It is not fresh-database schema construction and must not be replayed when creating a new baseline database.

## Future baseline structural contract

Any future baseline candidate must retain the following DB0-accepted contracts in addition to the Prisma schema representation:

### Seven array `NOT NULL` contracts

- `Merchant.commercialAddOns`
- `MerchantAgentCredential.scopes`
- `MerchantFrame.collectionTags`
- `MerchantOAuthAuthorization.scopes`
- `MerchantOAuthAuthorizationCode.scopes`
- `MerchantOAuthAuthorizationRequest.scopes`
- `MerchantOAuthClient.redirectUris`

### Two `CHECK` constraints

- `Merchant_maxCompareFrames_check`: `Merchant.maxCompareFrames IN (2, 3, 4)`.
- `try_on_task_actor_check`: consumer tasks require a user and forbid merchant/session/frame identity; Store demo/pilot tasks require merchant, MerchantSession, and MerchantFrame identity.

### Partial unique index

- `Experience_one_active_store_per_merchant_idx`: unique `Experience.merchantId` where `type = 'STORE' AND status = 'ACTIVE'`.

### Column comment

- `User.premiumUsageCount`: `Premium subscription usage count (resets on billing cycle renewal)`.

### Four accepted custom raw-query indexes

- `StoreAsset_deletedAt_deleteFailCount_lastDeleteAttemptAt_idx` on `StoreAsset(deletedAt, deleteFailCount, lastDeleteAttemptAt)`.
- `MerchantUsageLedger_merchantId_kind_createdAt_idx` on `MerchantUsageLedger(merchantId, kind, createdAt)`.
- `Merchant_commercialStatus_idx` on `Merchant(commercialStatus)`.
- `MerchantSession_merchantId_billableAICommerceSession_idx` on `MerchantSession(merchantId, billableAICommerceSession)`.

Production presence of all four custom raw-query indexes is a **DB3 read-only prerequisite** before any Production baseline adoption/cutover. DB1A does not query or alter Production.

## Operational gates

1. **DB1A:** guard, status matrix, and provenance only; active migration history unchanged.
2. **DB1B:** baseline cutover implementation only after Lead accepts the guard and strategy.
3. **DB2:** fresh/replay/schema equivalence and complete validation.
4. **DB3:** read-only Production prerequisite checks, separately authorized adoption, then controlled cutover.

No gate authorizes Preview or Production as a debugging environment. A failed status, uncertain ledger state, or missing structural prerequisite stops the sequence for explicit review.
