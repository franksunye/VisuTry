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

Flow uses **private** Blobs for shopper photos and Store try-on inputs/results. Browser delivery is only via capability-authenticated routes:

- `/api/store/sessions/assets/[assetId]`
- `/api/store/sessions/try-on/[taskId]/result`

Poll APIs never return raw private Blob URLs.

Gate A1 remains closed for independent external traffic.

---

## Ops prerequisite — private Blob store

1. Private Vercel Blob store connected to the project.
2. `BLOB_READ_WRITE_TOKEN` / OIDC can write private objects.
3. Private put fails closed (no public fallback).
4. Store result completion fails closed if private persistence fails (task stays PROCESSING for retry).

---

## Retention crons

| Cron | Schedule | Role |
|------|----------|------|
| `/api/cron/cleanup-store-assets` | 02:30 UTC | StoreAsset + orphan Blob cleanup |
| `/api/cron/cleanup-expired-tasks` | 02:00 UTC | TryOnTask blob-first cleanup |

Deletion emails are sent **only** for users whose tasks were confirmed deleted in that cron run.

---

## Abuse / allowance

- Attempt + placeholder task + merchant/IP abuse counters are claimed in one Serializable transaction.
- Validation failures (missing photo/frame) do not burn generation budget.
- Over limit → HTTP 429 + `Retry-After`.

---

## Admin

```text
/admin/store
```

Shows retention health (DELETE_BLOCKED counts, orphans, oldest blocked expiry).

---

## Gate A1 — CLOSED until re-review

Still deferred: session/batch restore, multi-merchant cookies, full composite tenant FKs, shared generation pipeline.

Internal screen-share demos may proceed if no external shopper gets independent access.
