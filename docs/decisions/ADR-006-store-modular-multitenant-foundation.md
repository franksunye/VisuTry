# ADR-006: Store Uses a Modular, Multi-Tenant Foundation on the Existing Generation Core

**Status:** Accepted
**Date:** 2026-08-05
**Owner:** Product / Engineering

## Context

VisuTry Store is approved to begin D0 engineering. The existing application already provides Advisor concepts, Try-On generation, Frame Compare, authentication, storage, quota settlement, and analytics helpers.

However, the current Try-On path is consumer-oriented:

- generation is owned by a required `User`;
- API authorization requires a NextAuth consumer session;
- usage settlement is tied to consumer free trials, subscription usage, or credits;
- Try-On assets are stored through provider-specific infrastructure;
- client analytics is not a durable merchant-insight source.

The Store shopper flow introduces a different actor: an anonymous shopper in a merchant-scoped session. It also introduces tenant ownership, merchant usage, merchant catalog attribution, merchant insights, and stricter image-access requirements.

Building Store by adding route-level exceptions or a client-controlled quota bypass would create authorization and accounting risk. Building a separate Store generation stack would duplicate the most expensive and failure-prone infrastructure.

## Decision

1. Store will be implemented as a module inside the existing Next.js application, not as a new service.
2. `Merchant` is the tenant boundary; all Store records and operations are tenant-scoped.
3. Store uses its own anonymous `MerchantSession` capability and does not create fake consumer users.
4. Generation execution and usage policy are separate. The server selects consumer quota, Store Demo allowance, or merchant allowance from trusted context.
5. Store reuses the existing `TryOnTask` and generation pipeline with first-class merchant/session/frame attribution.
6. Store merchant frames remain separate from the historical global `GlassesFrame` catalog.
7. Merchant insights use durable database events and intent records; GA/GTM remains a best-effort analytics mirror.
8. Store image operations pass through an asset-access boundary, and merchant insights do not expose raw shopper images.
9. D0 begins with a mandatory D0-0 foundation gate defined in `docs/product/specs/visutry-store-engineering-foundation.md`.
10. Microservices, public integration SDKs, generic commerce abstractions, and complex merchant RBAC remain deferred.

## Implementation Status

The D0 implementation satisfies this decision's modular, tenant, capability, usage, event, idempotency, and shared-generation boundaries. Production verification was completed on 2026-08-05 for a controlled Luna Optical demonstration.

The deployment currently uses the documented `public-poc` Vercel Blob mode. This does not change the authorization model: protected Store APIs require the server-issued MerchantSession capability, and public Blob URLs are not treated as authorization. Because private or otherwise controlled asset delivery and remaining external-traffic evidence are not complete, Gate A1 remains closed and the URL is not approved for independent non-team shopper use.

## Consequences

### Easier

- Consumer and Store flows reuse one proven generation core.
- Tenant ownership and usage attribution are queryable and enforceable.
- Anonymous shopper flows do not contaminate consumer accounts or credits.
- Merchant insight data remains available independently of analytics delivery.
- Future Shopify or other adapters can enter through stable application contracts.
- Store can later be extracted from the monolith if scale or organizational boundaries require it.

### Harder

- `TryOnTask` and generation service boundaries must be refactored carefully to support a non-consumer actor.
- Database migrations require explicit tenant, attribution, and idempotency constraints.
- D0 needs durable event recording in addition to GA/GTM analytics.
- Asset access and retention must be handled explicitly before external traffic.

### Required

- Every Store PR follows the engineering foundation review checklist.
- Tenant isolation, quota isolation, idempotency, and image privacy receive automated tests.
- Client requests cannot select free generation policy or authorize access using `merchantId` alone.
- Existing consumer Try-On behavior remains covered and unchanged.

### Deferred

- Store microservices or separate worker architecture;
- Shopify/WooCommerce integration adapters;
- generic catalog/PIM architecture;
- merchant billing engine;
- team RBAC and public API/SDK.

## Related Documents

- `docs/product/specs/visutry-store-engineering-foundation.md`
- `docs/product/plans/visutry-store-implementation-plan.md`
- `docs/product/specs/visutry-store-sales-demo.md`
- `docs/product/specs/visutry-store-mvp.md`
- `docs/ops/store-d0-operator-note.md`
- `docs/ops/store-d0-production-verification-2026-08-05.md`
- `docs/project/architecture.md`

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-05 | Accepted the modular-monolith, multi-tenant Store foundation and mandatory D0-0 engineering gate. |
| 2026-08-05 | Recorded D0 implementation and controlled production verification, including the temporary Public Blob POC boundary and closed Gate A1. |
