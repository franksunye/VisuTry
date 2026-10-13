# Factory #406 — Owner-approved private Draft Campaign creation

**Status:** Independent source feature stacked on Draft #408/#400; not yet reviewed or accepted.

Read-only `PUT /api/merchant/:merchantId/delivery-factory/create-campaign` accepts strict `{ slug, manifest }` and checks that exactly this Campaign has a `CREATE_DRAFT` Plan step; Brand/Store/other Campaign steps must be NO_CHANGE. Returns field Before/After, SHA-256 normalized Manifest hash and an exact-target absence condition.

A separate `POST` accepts the same input plus `approved:true`, `expectedCampaignAbsent:true`, and digest. Fresh Owner-only tenant Plan/readback and canonical `createCampaignDraft` are required; the canonical creator has a narrowly scoped `factoryExpectAbsent` guard so concurrent create/replays cannot be returned as newly created. Unique-slug/concurrent PG errors map to 409. Only an unlisted/private DRAFT Campaign shell is created and audited. Selected Catalog frames, Journey, Delivery, publishing and external services are NOT executed.

Full #406 still needs safe resource-scoped configure/select, durable operation identity/idempotency and bounded restore. No multi-resource atomicity or G4 certification is claimed. Exact-head CI and isolated local PostgreSQL/Chromium negative and repeatability tests required before merge. No Production writes. `releaseReady=false`.

CI for this Draft is temporarily evaluated against main to exercise the combined stack. Restore its dependency base after exact-head Quality/Foundation results; CI alone is not the real Local QA gate.

A distinct pending DRAFT Store/Campaign configuration step does not by itself block this single approved Campaign creation. Existing/ACTIVE tenant conflicts, unsafe Catalog blockers and human-only review steps still reject.
