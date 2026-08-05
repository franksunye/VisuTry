# VisuTry Store D0 Operator Note

**Status:** Active for D0 Sales Demo (Gate A1 still CLOSED)  
**Last updated:** 2026-08-05  
**Related:** `docs/product/specs/visutry-store-engineering-foundation.md`, ADR-006

---

## Purpose

Operator reference for seeding sample merchants, verifying the catalog, and knowing which external-traffic gates remain closed during D0.

---

## Shopper Store URL

```text
/{locale}/store/luna-optical
```

The current D0 deployment explicitly uses **temporary public Blob objects** through
`STORE_ASSET_ACCESS_MODE=public-poc`. This is limited to controlled demos and early
validation; Gate External Traffic remains closed. Browser delivery still uses only
capability-authenticated application routes:

- `/api/store/sessions/assets/[assetId]`
- `/api/store/sessions/try-on/[taskId]/result`

Poll and upload APIs never return raw provider Blob URLs.

Gate A1 remains closed for independent external traffic.

---

## Temporary Public POC storage policy

1. Public mode activates only with the exact value `STORE_ASSET_ACCESS_MODE=public-poc`.
2. Missing configuration defaults to private; invalid values fail closed.
3. Use synthetic, operator-owned, or explicitly authorized photos only.
4. Raw provider URLs must not appear in shopper API responses, analytics, or general Store events.
5. Retention cleanup remains mandatory for photos, inputs, and generated results.
6. Before independent external traffic, connect a private Blob store, set the mode to `private`, redeploy, and rerun Gate A1 verification.
7. Concurrent result persistence remains fenced; COMPLETED is never rolled back.

---

## Retention crons

| Cron | Schedule | Role |
|------|----------|------|
| `/api/cron/cleanup-store-assets` | 02:30 UTC | StoreAsset + orphan Blob cleanup |
| `/api/cron/cleanup-expired-tasks` | 02:00 UTC | TryOnTask blob-first cleanup (per-field pathname ?? URL) |
| `/api/cron/sync-pending-tasks` | (existing) | GrsAi sync + **stale Store claim reconcile** |

Deletion emails are sent **only** for users whose tasks were confirmed deleted in that cron run.

Stale claim: Store `PENDING` + `pending://` placeholders with expired dispatch lease and no `externalTaskId` are marked `FAILED` so they cannot block forever. Dispatch and private-result leases use first-class database `owner + until + version` fields; every owner write is fenced by owner/version.

---

## Abuse / allowance

- Attempt + placeholder task + merchant/IP abuse counters are claimed in one Serializable transaction.
- Frame/photo bytes are fetched **before** claim; post-claim failures mark the task `FAILED`.
- Same idempotency key can take over an **expired** placeholder lease and finish dispatch.
- Validation failures (missing photo/frame) do not burn generation budget.
- Over limit → HTTP 429 + `Retry-After`.

---

## Admin

```text
/admin/store
```

Shows retention health (DELETE_BLOCKED counts, orphans, oldest blocked expiry).

---

## Gate A1 — CLOSED until deployment smoke

Round 5 replaced metadata-only leases with atomic database CAS and stale-owner fencing. Takeover uploads use versioned paths, so compensation cannot delete a newer owner's assets. Retention now sends only owned Vercel Blob references to Blob deletion.

Before opening external Gate A1:

1. deploy migration `20260805190000_add_tryon_task_fenced_leases`;
2. run two-request takeover smoke against the deployed PostgreSQL database and confirm one owner/version wins;
3. run takeover-versus-reconciler smoke and confirm a renewed task is not failed;
4. after restoring private storage, run concurrent result polling and confirm one persister wins or the loser reconciles the deterministic Blob;
5. confirm expired Consumer tasks containing external provider result URLs do not enter `DELETE_BLOCKED`.

Still deferred: session/batch restore, multi-merchant cookies, full composite tenant FKs, shared generation pipeline, browser Compare E2E.

Internal screen-share demos may proceed if no external shopper gets independent access.
