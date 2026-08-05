# VisuTry Store D0 Operator Note

**Status:** Active for D0 Sales Demo (Gate A1 still CLOSED)  
**Last updated:** 2026-08-05  
**Related:** `docs/product/specs/visutry-store-engineering-foundation.md`, ADR-006

---

## Purpose

Operator reference for seeding sample merchants, verifying the catalog, and knowing which external-traffic gates remain closed during D0.

---

## Shopper Store URL (STORE-2+)

After seeding Luna Optical:

```text
/{locale}/store/luna-optical
```

Example: `/en/store/luna-optical`

Flow:

1. Merchant branding + privacy notice
2. Accept privacy → server creates `MerchantSession` and sets HttpOnly `vt_store_cap` cookie
3. Upload front-facing photo → AssetStore (`PRIVATE_SIGNED` access mode); shopper preview via capability-authenticated `/api/store/sessions/assets/[assetId]`
4. On-device face landmarks → `POST /api/store/sessions/recommend` → merchant-only shortlist
5. Select up to 4 frames → `POST /api/store/sessions/select-frames`
6. Try-on selected frames → `POST /api/store/sessions/try-on` + poll (Store Demo allowance; no consumer credits)
7. Compare completed results in-page → `POST /api/store/sessions/compare` (requires ≥2 completed Store tasks)
8. Favorite / product click / inquiry → `POST /api/store/sessions/intent` (product URL resolved server-side from frame)

Gate A1 remains closed for independent external traffic.

---

## Internal merchant insights (STORE-5)

D0 insights are **admin-only** (not merchant login):

```text
/admin/store
/admin/store/merchants/{merchantId}
```

Shows sessions, photos uploaded (counts only), recommendations, try-ons, compares, favorites, product clicks, inquiries, top frames, and recent session signal flags. Shopper photos and face payloads are never shown.

Consumer Admin Try-On (`/admin/try-on`) lists **CONSUMER** origin only; Store tasks belong under `/admin/store`.

---

## Seed a sample merchant (Luna Optical)

Non-destructive upsert by stable slug / SKU. Does **not** call `deleteMany()` on shared tables.

```bash
# Local / preview
npx tsx scripts/seed-store-luna.ts

# Production (explicit confirmation required)
STORE_SEED_CONFIRM=yes npx tsx scripts/seed-store-luna.ts
```

Behavior:

- upserts merchant slug `luna-optical`;
- upserts 16 frames by `(merchantId, sku)`;
- sets frames to `ACTIVE` with `enrichmentStatus=APPROVED` (D0 seeded data may be pre-approved);
- re-running is safe and updates metadata in place.

### Verify

1. Merchant exists: `slug = luna-optical`, `status = ACTIVE`.
2. At least 12 active `MerchantFrame` rows for that merchant.
3. Frames include rectangle, round, cat-eye, aviator, browline, geometric (and related) shapes.
4. Prices are integer minor units; currency is lowercase (`usd`).

To deactivate a frame after it has session/intent/event/generation history: set `status = INACTIVE` — do not hard-delete.

To suspend a merchant: set `status = SUSPENDED` or `INACTIVE` — do not hard-delete during D0/M1.

---

## Gate A1 — external shopper traffic (CLOSED until re-review)

Do **not** share a working Store URL for independent non-team shopper use until all are true:

1. server-issued MerchantSession capability enforced;
2. Store Demo allowance / abuse limits server-enforced;
3. shopper assets use controlled access (not permanent public URLs as authorization);
4. privacy notice before upload;
5. retention + idempotent cleanup active;
6. insights/events/logs exclude raw shopper images and sensitive face payloads;
7. external-traffic isolation / privacy tests pass.

### Hardening landed (pre–Gate A1 re-review)

- StoreAsset cleanup cron: `/api/cron/cleanup-store-assets` (daily 02:30 UTC).
- Blob delete must succeed (or blob already gone) before `deletedAt` is written; failures increment `deleteFailCount` and remain retryable.
- Shopper preview is capability-bound via app media route; provider URL alone is not shopper authorization.
- Store usage settle is transactional (claim + `RENDER_SUCCESS` ledger); attempt limits count `RENDER_ATTEMPT` only; submit resolves idempotency before attempt writes.
- Product click / compare metrics are server-validated against catalog URL and completed tasks.

### Residual limitations (keep Gate A1 closed)

- Underlying Blob SDK still uploads with public-read store URLs for StoreAsset / Store TryOnTask inputs; **authorization** is app-mediated, but the physical object may remain fetchable if the provider URL leaks.
- Session/batch recovery after refresh and multi-merchant cookie coexistence are **not** done (pre-M1).
- Shared Consumer/Store generation pipeline extraction is deferred (P2).
- Full Postgres composite FK / trigger suite for every cross-table tenant edge is partial; application tenant guards cover hot write paths.

Internal team-operated **screen-share demos** may proceed if no external shopper receives independent access.

---

## Module boundary reminder

```text
src/modules/store/
  domain/          # pure policies — no Prisma/Next/Blob
  application/     # use cases + ports
  infrastructure/  # Prisma + Blob adapters
  contracts/       # runtime request validators
```

API routes validate with contracts, resolve auth, call one use case, map to HTTP. UI must not decide usage policy or call Prisma.

---

## PR checklist (every Store PR)

1. What tenant owns each new record?
2. Where is tenant access enforced?
3. Who is the actor, and who pays for usage?
4. What makes the mutation idempotent?
5. First-class columns vs metadata — why?
6. Does the change expose or extend retention of a shopper image?
7. Which events are authoritative server records vs best-effort analytics?
8. How is existing consumer behavior protected?
9. Which automated tests prove isolation and failure behavior?
10. Is this abstraction required by D0/M1, or premature platform work?
