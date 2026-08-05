# VisuTry Store D0 Operator Note

**Status:** Active for D0 Sales Demo (Gate A1 still CLOSED)  
**Last updated:** 2026-08-05  
**Related:** `docs/product/specs/visutry-store-engineering-foundation.md`, ADR-006

---

## Purpose

Operator reference for seeding sample merchants, verifying the catalog, and knowing which external-traffic gates remain closed during D0.

---

## Shopper Store URL

After seeding Luna Optical:

```text
/{locale}/store/luna-optical
```

Example: `/en/store/luna-optical`

Flow:

1. Merchant branding + privacy notice
2. Accept privacy → `MerchantSession` + HttpOnly `vt_store_cap`
3. Upload photo → **private** Blob (`PRIVATE_SIGNED`); preview via capability media proxy
4. Recommend → select → try-on (claim-first private Blobs; no consumer credits)
5. Compare (≥2 completed Store tasks) / favorite / product click / inquiry

Gate A1 remains closed for independent external traffic.

---

## Ops prerequisite — private Blob store

Store shopper photos and Store try-on input/result objects use `@vercel/blob` `access: 'private'`.

1. Create/connect a **private** Vercel Blob store for this project.
2. Ensure `BLOB_READ_WRITE_TOKEN` / OIDC can write private objects.
3. Private put **fails closed** (no silent public fallback). If private storage is misconfigured, Store photo upload returns 503.

Consumer CONSUMER-origin try-on uploads may still use public Blob access in this pass.

---

## Retention crons

| Cron | Schedule | Role |
|------|----------|------|
| `/api/cron/cleanup-store-assets` | 02:30 UTC | StoreAsset + orphan Blob cleanup (multi-round + blocked slow-retry) |
| `/api/cron/cleanup-expired-tasks` | 02:00 UTC | TryOnTask blob-first cleanup (Consumer + Store) |

Rules:

- Blob delete success / not-found **before** clearing durable URL state.
- Failures increment `deleteFailCount`; after soft cap → `DELETE_BLOCKED` but **still selected** on a 24h slow retry forever.
- Admin `/admin/store` shows blocked asset/task counts, orphan count, oldest blocked expiry.

---

## Abuse limits (durable Postgres counters)

Enforced on session create, photo upload, and try-on attempts (IP / merchant buckets). Over limit → HTTP 429 + `Retry-After`.

---

## Internal merchant insights

```text
/admin/store
/admin/store/merchants/{merchantId}
```

Consumer Admin Try-On lists `origin: CONSUMER` only.

---

## Seed Luna Optical

```bash
npx tsx scripts/seed-store-luna.ts
# Production:
STORE_SEED_CONFIRM=yes npx tsx scripts/seed-store-luna.ts
```

---

## Gate A1 — CLOSED until re-review

Do **not** share Store URLs for independent external shoppers until Gate A1 re-review passes.

### Hardening landed (Four Epics)

- Physically private Store objects + capability media proxy
- Unified retention state machine (StoreAsset / TryOnTask / orphans)
- Claim-first Store try-on (no orphan race on unique key)
- Transactional attempt reservation + merchant/IP abuse counters
- Behavioral / integration tests (no source-text sniffing for settle)

### Still deferred (pre-M1)

- Session/batch restore after refresh
- Multi-merchant capability cookies
- Full composite DB FK suite
- Shared Consumer/Store generation pipeline extraction

Internal screen-share demos may proceed if no external shopper gets independent access.

---

## Module boundary

```text
src/modules/store/
  domain/ application/ infrastructure/ contracts/
```
