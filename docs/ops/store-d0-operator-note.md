# VisuTry Store D0 Operator Note

**Status:** Active for D0 Sales Demo  
**Last updated:** 2026-08-05  
**Related:** `docs/product/specs/visutry-store-engineering-foundation.md`, ADR-006

---

## Purpose

Operator reference for seeding sample merchants, verifying the catalog, and knowing which external-traffic gates remain closed during D0.

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

## Gate A1 — external shopper traffic (CLOSED until complete)

Do **not** share a working Store URL for independent non-team shopper use until all are true:

1. server-issued MerchantSession capability enforced;
2. Store Demo allowance / abuse limits server-enforced;
3. shopper assets use controlled access (not permanent public URLs as authorization);
4. privacy notice before upload;
5. retention + idempotent cleanup active;
6. insights/events/logs exclude raw shopper images and sensitive face payloads;
7. external-traffic isolation / privacy tests pass.

### D0 asset limitation (current)

Store asset uploads may still use **publicly addressable Vercel Blob URLs** via the AssetStore adapter.

- Permanent public URLs are **not** an authorization mechanism.
- Merchant insight APIs/UI must still omit raw shopper images.
- Internal team-operated **screen-share demos** may proceed before Gate A1 if no external shopper receives independent access.

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
