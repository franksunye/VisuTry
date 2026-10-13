# Factory #406 — resource-scoped approved Draft Catalog selection

**Status:** Source development stacked on Draft #410, not merged or locally accepted.

For an existing DRAFT Store or Campaign, `PUT /api/merchant/:merchantId/delivery-factory/selection` (Human OWNER) prepares **only a selectedFrameIds change** from the strict Merchant Manifest; all other Manifest Plan steps must be NO_CHANGE and there must be zero blockers. The response contains exact target ID, current Experience revision, normalized Manifest digest, and selected product IDs before/after.

`POST` requires `approved:true`, the same Manifest, target type/slug, revision, Store/Campaign ID and digest, then independently rereads current tenant Plan/target. It either returns truthful no-change with zero writes or invokes canonical `setMerchantStoreFrames` / `setCampaignFrames`. The Factory-only Draft guard and revision precondition flow into the #410 canonical transaction; it locks Merchant → selected ACTIVE MerchantFrames → DRAFT Experience, then verifies revision **before** selection mutation. Version advances atomically; post-change stale approvals conflict.

This is one resource-scoped command, **not** a multi-resource apply, permanent operation receipt, generic rollback, unauthorized live Store/Campaign edit, or support claim. Brand/media and Catalog intake remain separate authenticated Human actions. Publication, payments, external providers and Production writes excluded; `releaseReady=false`. Final merge requires #410, reconciled #400/#395/#398, exact-head CI and real dual-Merchant Local PG16/Chromium including Archive races. Never overwrite #385 locks.
