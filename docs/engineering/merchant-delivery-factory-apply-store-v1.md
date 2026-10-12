# Merchant Delivery Factory — bounded Human Draft Store Apply v1

**Status:** Owner-authored feature, stacked and not yet independently accepted. This is **NOT** bulk Factory Apply or commercial release authorization.

## Explicit Prepare → Approval → Apply

First call **read-only** `POST /api/merchant/:merchantId/delivery-factory/prepare-store` with the strict canonical v1 Manifest. This returns an exact tenant-owned Draft Store ID, `expectedStoreUpdatedAt`, a SHA-256 `manifestDigest` over the normalized Manifest, bounded changed fields and a **reviewChanges** list of their exact persisted **before** and proposed **after** values, and `HUMAN_APPROVAL_REQUIRED` or `ALREADY_MATCHED`. It performs no writes.

The authenticated Owner must review the returned before/after differences (only the six allowlisted Draft Store fields; no shopper identity, billing, product-media or unrelated merchant data) and explicitly submit `approved:true` to the separate Apply endpoint, with **the same Manifest + returned Store ID + digest + revision**. The server independently normalizes and hashes the input again and rejects a mismatch as HTTP 409; thus changing the Manifest after Prepare cannot silently change an approved target. An updated Store revision or ACTIVE transition conflicts; a new Prepare/approval is needed.

## Endpoint

`POST /api/merchant/:merchantId/delivery-factory/apply-store`

Body (strict):
- `approved: true` — explicit approval for this single command; never accept an approval embedded in the Manifest.
- `expectedStoreUpdatedAt` — exact ISO-8601 timestamp returned by Prepare. A stale timestamp returns HTTP 409 and requests a new Prepare.
- `expectedStoreId` — the exact Store ID returned by Prepare; rejects substitution of a different Store even if two rows share a revision.
- `manifestDigest` — the exact 64-character lowercase SHA-256 digest returned by Prepare; prevents substituting another Manifest under the same approval.
- `manifest` — the same canonical strict v1 Merchant Delivery Manifest used by Plan/Verify. No unknown top-level, Store or Catalog fields.

Only a fresh authenticated **Human OWNER** membership for the path Merchant ID can execute this command. Agent tokens, unauthenticated requests and Admin-only accounts have no access to this route. Returns `Cache-Control: private, no-store`.

## Strictly bounded mutation

This command is intentionally limited to exactly **one existing private Draft Store**. Before any write, it re-reads a fresh canonical tenant Plan, then rejects:
- Any Plan blocker, incomplete/unusable selected Store product, foreign Merchant or ambiguous multiple Stores.
- Any Brand/Catalog/Campaign step requiring modification.
- Any Store creation, ACTIVE/ENDED/ARCHIVED Store, or selected Catalog frame replacement.
- Any unsupported or high-impact field (including status, hero, scripts, payment, publish, archive, direct SQL).
- Stale `updatedAt`, checked **again under PostgreSQL row lock within the same canonical Store update transaction**.

Allowed fields only: `name`, `headline`, `description`, `presentationMode`, canonical fixed-stage `journeyPolicy`, and bounded `deliveryPolicy`. The implementation reuses `updateMerchantStore` → `experienceCommands.updateSharedConfiguration`, preserving existing normalization, activation audit and discovery invalidation. Existing HUMAN Store edit paths are unchanged; the optimistic revision is opt-in for this approved Factory command.

The first call returns `DRAFT_STORE_CONFIGURATION_APPLIED` with a bounded changedFields list. A no-change call with the **same currently valid revision** is `ALREADY_MATCHED`, without a DB write. A stale request conflicts; **no cross-request idempotency receipt or replay-as-success is asserted**. This does not apply frames, create campaigns, modify Brand, publish or upload.

## Evidence limitations and merge gate

Even with successful Store Apply, `publicRender=NOT_EXECUTED`, `releaseReady=false`. Independent local PostgreSQL race and browser checks, actual private Store Try-On/Result/Kiosk verification and payment evidence remain required. No Production database/Blob/Stripe mutation is authorized.

Dependency chain: **#391 read-only Plan (real two-tenant PG QA) → #395 Store display eligibility → #398 private Verify → this stacked Apply Store PR**. Keep drafts until each predecessor is accepted and exact-head Quality Gate / Merchant Executed Foundation pass. Catalog selection writes depend on #385 race PASS; this initial Apply deliberately does not perform them.
