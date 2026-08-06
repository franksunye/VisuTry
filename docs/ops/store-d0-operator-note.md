# VisuTry Store D0 Operator Note

**Status:** Active for D0 Sales Demo (Gate A1 still CLOSED)  
**Last updated:** 2026-08-05  
**Related:** `docs/product/specs/visutry-store-engineering-foundation.md`, ADR-006,
`docs/ops/store-d0-production-verification-2026-08-05.md`

---

## Purpose

Operator reference for seeding sample merchants, verifying the catalog, and knowing which external-traffic gates remain closed during D0.

---

## Shopper Store URL

```text
/{locale}/store/luna-optical
```

The merchant route has its own merchant-first visual shell. For a demo, start at the
top of the page so the merchant sees its branding, real catalog preview, primary CTA,
and privacy positioning before the upload workflow. Do not begin the screen share on
an already-accepted or partially completed browser state.

The current D0 deployment explicitly uses **temporary public Blob objects** through
`STORE_ASSET_ACCESS_MODE=public-poc`. This is limited to controlled demos and early
validation; Gate External Traffic remains closed. Browser delivery still uses only
capability-authenticated application routes:

- `/api/store/sessions/assets/[assetId]`
- `/api/store/sessions/try-on/[taskId]/result`

Poll and upload APIs never return raw provider Blob URLs.

Gate A1 remains closed for independent external traffic.

Production verification passed on commit `a36e9ae` and deployment
`dpl_5bEE3YUqDy3wF8HLHsZFCM5FiRhD`. See the dated verification record for evidence.

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
| `/api/cron/cleanup-expired-tasks` | 02:00 UTC | TryOnTask blob-first cleanup (Consumer + Store batches isolated; ADR-007) |
| `/api/cron/sync-pending-consumer-tasks` | 03:15 UTC daily | Consumer GrsAi sync + Consumer quota settlement (Hobby-safe; live UX still uses client poll) |
| `/api/cron/sync-pending-store-tasks` | 03:45 UTC daily | Store GrsAi sync + Store usage settlement + **stale Store claim reconcile** (impl: `src/modules/store/infrastructure/cron/sync-pending-store-tasks.ts`) |
| `/api/cron/sync-pending-tasks` | (legacy combined) | Runs Consumer then Store with isolated failure domains; prefer dedicated crons |

> Note: Vercel Hobby only allows cron expressions that run **once per day**. More frequent pending-sync requires Pro (or an external scheduler).

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

Demo sequence:

1. Open the Store portfolio and confirm the merchant, catalog, session, intent, and
   retention-health summary.
2. Open `Luna Optical` intelligence and present the conversion story, catalog health,
   top frames, seven-day interest trend, recent inquiries, recommendation Fit Score,
   high-intent shortlists, full inventory, and recent anonymous sessions.
3. Confirm that every inventory image loads and that no shopper photo or raw asset URL
   appears in the admin UI.
4. Open the live Store from the merchant hero and continue the shopper demo.

The Luna seed also upserts a 14-day synthetic activity history with stable
`demo_luna_*` session IDs and `example.com` inquiry contacts. This makes the trend,
inquiry, initials-avatar, shortlist, and Fit Score modules demonstrable without
claiming that sample activity is genuine customer traffic. Re-running the seed
refreshes the rolling dates without multiplying or deleting records.

`Fit Score` means recommendation alignment from the ranking adapter. During the demo,
never describe it as frame sizing, pupillary distance, prescription suitability, or
physical fit. The shortlist is a purchase-intent signal, not a cart or checkout.

The production seed must be run only after the deployment containing the local catalog
assets is live. This prevents the database from referencing image paths that the active
deployment cannot serve.

---

## Gate A1 — CLOSED after controlled deployment smoke

Round 5 replaced metadata-only leases with atomic database CAS and stale-owner fencing. Takeover uploads use versioned paths, so compensation cannot delete a newer owner's assets. Retention now sends only owned Vercel Blob references to Blob deletion.

Completed:

- production migration and schema check;
- Luna Optical production seed with 16 active frames;
- page, session, photo upload, capability delivery, recommendation, one-frame Try-On,
  result delivery, event, usage, retention metadata, and lease-release smoke;
- final production runtime error scan.

Still required before opening external Gate A1:

1. restore private storage and set `STORE_ASSET_ACCESS_MODE=private`;
2. run two-request takeover smoke against the deployed PostgreSQL database and confirm one owner/version wins;
3. run takeover-versus-reconciler smoke and confirm a renewed task is not failed;
4. run concurrent result polling against private storage and confirm one persister wins or the loser reconciles the deterministic Blob;
5. complete browser Compare E2E for 2 / 3 / 4 frames and partial failures;
6. confirm expired Consumer tasks containing external provider result URLs do not enter `DELETE_BLOCKED`.

Still deferred beyond D0: session/batch restore, multi-merchant cookies, full composite tenant FKs, and broader generation-pipeline extraction.

Internal screen-share demos may proceed if no external shopper gets independent access.
