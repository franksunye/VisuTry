# Factory #406 — single Draft Campaign policy/configuration approval

A Human OWNER reviews a strict v1 Manifest against live tenant-owned Draft Campaign state. Read-only `PUT /api/merchant/:merchantId/delivery-factory/configure-campaign` returns exact Campaign ID, revision, SHA-256 normalized Manifest, and only changed allowed fields Before/After.

Explicit approved `POST` re-reads current authenticated Plan and exact target, checks digest/revision, then uses the canonical `updateCampaign` with Factory-only `draftOnly + expectedUpdatedAt`. Supported fields are exactly name, headline, description, Presentation, canonical fixed-stage Journey and bounded Web/Kiosk Delivery. Catalog selection stays a separate Owner-approved action, along with Brand, creation, billing and high-impact publishing. Other **safe pending Draft Manifest steps** do not prevent this field-scoped action.

This service does not write directly to Prisma, does not publish, and does not assert public rendering. It remains `releaseReady=false`, Draft and unmerged until #410 parent accepted, exact-head CI and real PG16 concurrency/browser QA. Durable operation receipts, restore and final #407 remain independent P0 scope.
