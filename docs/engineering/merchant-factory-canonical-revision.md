# Factory #406 — canonical revision-guarded Draft selection

This independent main-based change is a **prerequisite**, not a general Factory Apply API.

Optional `expectedUpdatedAt` requires `draftOnly:true`. Shared Store/Campaign commands forward the field to the canonical Prisma repository. The existing #385 **Merchant → MerchantFrame → Experience** lock order is preserved. Under this lock a Factory selection compares its approved exact DRAFT revision, then deletes/recreates selected frames and advances the Experience revision **in the same serializable transaction**. Old selections and stale/replayed approval return a conflict with no write. Existing regular selection callers remain unchanged. Store/Campaign copy/policy update also gains the same opt-in Draft revision precondition needed for #400 reconciliation.

Unit tests cover stale no-write, successful revision advancement, forbidden revision without Draft-only, plus retained #385 serialization/error mapping. No migration, billing, Agent grant, publication, Provider or production mutation.

Do not merge before exact-head CI and real Local PG16 Store/Campaign archive/selection concurrency proof. After acceptance, reconcile #400 stacked copy-patch transaction against this canonical code, never revert #385 locks. Overall Factory #406 and final #407 remain pending; `releaseReady=false`.
