# Factory #406 — Explicit approved Draft Store shell creation

**Status:** Isolated implementation slice; stacked on Draft #400 and **not yet merged, locally accepted or commercially ready**.

A new Human OWNER-only endpoint `PUT /api/merchant/:merchantId/delivery-factory/create-store` provides a **read-only** exact-store-absent preflight of a strict v1 Manifest. It returns a normalized Manifest SHA-256 digest, before/after for the three initial persisted Store copy fields, a nonexisting-target precondition and an explicit list of pending Journey/Delivery/Presentation/selected Catalog fields. It writes nothing.

A separate `POST` at the same path accepts `approved:true`, `expectedStoreAbsent:true`, the exact digest and the same strict Manifest. It re-reads the authenticated tenant Plan, rejects any Brand/Campaign changes, blockers or existing Store, and then invokes **the existing canonical** `createMerchantStore`. It fails closed if another writer created a Store in the meantime, and does not publish, select frames, apply Journey/Kiosk or claim a complete configured Store.

**Limitations:** This is one independent CREATE_DRAFT command, not a multi-resource transaction, durable operation-ID idempotency or restore. All Catalog intake, Brand/media approval, Campaign creation/configuration and final operational receipt remain distinct P0 work under #406. Treat PostgreSQL conflict/duplicate as 409 requiring fresh Prepare; never claim success on replay without a persisted receipt. No external providers, Blob, production merchant write or commercial release is authorized. `releaseReady=false` always.

Merge gate: #395 → #398 → #400 merged in order; exact-head CI and real two-tenant disposable Local PostgreSQL/Chromium acceptance of this **new** create action, including race, nonmember/Admin denial, no false audit, protected Catalog, and before/after DB state. #407 final two-merchant combined RC comes after full #406 implementation.

When a strict Manifest also proposes other safe DRAFT resources, Store shell creation remains independently approvable. Global Plan blockers and live-impacting changes still reject; no pending fields are silently applied.
