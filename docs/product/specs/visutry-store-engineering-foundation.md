# VisuTry Store Engineering Foundation Spec

**Status:** Approved for engineering
**Owner:** Engineering / Product
**Created:** 2026-08-05
**Last updated:** 2026-08-05
**Applies to:** D0 Sales Demo and all later Store work
**Related ADR:** `docs/decisions/ADR-006-store-modular-multitenant-foundation.md`
**Related execution plan:** `docs/product/plans/visutry-store-implementation-plan.md`

---

## 1. Purpose and Authority

This specification defines the mandatory engineering foundation for VisuTry Store.

It exists to ensure that D0 validates the merchant workflow without creating a second generation stack, weakening privacy boundaries, or coupling Store to consumer credits in a way that must be undone before platform integrations.

Normative language:

- **MUST / MUST NOT** — required for merge and D0 acceptance;
- **SHOULD / SHOULD NOT** — expected unless an implementation PR records a concrete reason;
- **MAY** — optional and must not delay D0.

If this document conflicts with older Store architecture wording, this document controls engineering structure. Product behavior remains controlled by the Sales Demo and MVP specs.

---

## 2. Engineering Objective

Store must begin as a modular domain inside the existing Next.js application.

The foundation must support this progression without a rewrite:

```text
D0 seeded merchant demo
  -> merchant-specific sample Store
  -> M1 hosted pilot for 3-5 merchants
  -> assisted catalog operations
  -> self-service commerce adapters when Gate C is met
```

The engineering goal is not maximum abstraction. The goal is stable boundaries around:

1. tenant ownership;
2. shopper identity and session capability;
3. generation execution;
4. usage / billing policy;
5. catalog ownership;
6. operational events and merchant insights;
7. image assets and retention.

---

## 3. Explicit Non-Goals

D0 MUST NOT introduce:

- a Store microservice;
- a second Try-On or Compare task system;
- a generic commerce platform or public plugin framework;
- Shopify or WooCommerce abstractions before Gate C;
- a general-purpose event bus;
- complex RBAC, teams, or enterprise SSO;
- a canonical global product-information system;
- merchant self-service billing;
- a new AI model or Store-specific model fork;
- a repository abstraction around every existing Prisma model.

Only Store-owned boundaries and the existing generation seam should be modularized during D0.

---

## 4. Required Architecture: Modular Monolith

Store MUST be implemented inside the current application as a modular monolith.

Required directory boundary:

```text
src/modules/store/
  domain/          # entities, enums, invariants, pure policies
  application/     # use cases and orchestration
  infrastructure/  # Prisma repositories and external adapters
  contracts/       # validated API inputs/outputs and shared DTOs
```

Existing route and UI locations remain valid:

```text
src/app/[locale]/(main)/store/...
src/app/api/store/...
src/components/store/...
```

Dependency rules:

1. `domain/` MUST NOT import Next.js, React, Prisma, Vercel Blob, GA, or provider SDKs.
2. `application/` MAY depend on Store domain types and declared ports, but MUST NOT depend on route handlers or React components.
3. `infrastructure/` implements database, storage, analytics, and generation adapters.
4. API routes MUST validate input, resolve authorization/context, call one application use case, and map the result to HTTP.
5. UI components MUST NOT call Prisma or decide billing / usage policy.
6. Store code MAY call existing consumer capabilities only through a narrow adapter or service contract.
7. Existing non-Store code MUST NOT import Store infrastructure.

Direct Prisma access from a Store route is prohibited except for a temporary migration or internal diagnostic explicitly marked in the PR.

---

## 5. Tenant Model and Isolation

`Merchant` is the Store tenant boundary.

Every Store-owned record MUST either contain `merchantId` directly or have an enforced relation to a record that contains it. This includes:

- frames;
- shopper sessions;
- intents;
- Store events;
- usage records or derived usage queries;
- merchant-attributed generation tasks;
- Store-owned assets.

Tenant access rules:

1. A public merchant slug MUST be resolved server-side to a merchant ID.
2. Client-provided `merchantId` MUST NOT be treated as authorization.
3. Repository methods that read tenant-owned records MUST require `merchantId` in their input unless they are explicitly internal-admin methods.
4. Reads and writes MUST scope by both tenant and record identity where practical, for example `{ merchantId, id }`.
5. Cross-merchant relations MUST be rejected before write and protected by database foreign keys / constraints where possible.
6. Merchants MUST be suspended or deactivated rather than hard-deleted during D0/M1.
7. Merchant frames MUST be deactivated rather than deleted once they have session, intent, event, or generation history.

D0 merchant insights MAY remain internal-admin-only. M1 merchant access MUST use a membership model such as `MerchantMembership(userId, merchantId, role)`; it MUST NOT be represented only by adding `MERCHANT` to the global `UserRole` enum.

---

## 6. Identity and Shopper Session

Store shopper sessions are distinct from NextAuth consumer sessions.

The D0 shopper flow MUST support an anonymous visitor without creating a fake consumer user or requiring consumer login.

`MerchantSession` minimum contract:

```text
id
merchantId
anonymousVisitorId?
photoAssetId?
locale?
status: ACTIVE | COMPLETED | EXPIRED
createdAt
lastActiveAt
expiresAt
```

Session rules:

1. The server MUST create the session.
2. The server MUST issue an opaque, unguessable session capability or equivalent protected cookie.
3. Subsequent session operations MUST prove possession of that capability.
4. A raw `merchantSessionId` from the client MUST NOT be sufficient to access session data.
5. Session capability values MUST NOT be stored in plaintext; store a hash if persistence is required.
6. Session responses MUST expose only the minimum shopper-facing state.
7. A Store session MUST be bound to one merchant and MUST NOT be reassigned.
8. Expired or suspended sessions MUST not start new generation work.

---

## 7. Generation Context and Usage Policy

Generation execution and usage charging MUST be separate concerns.

The shared Try-On seam MUST accept an explicit actor/context equivalent to:

```ts
type TryOnActor =
  | { kind: 'consumer'; userId: string }
  | {
      kind: 'store'
      merchantId: string
      merchantSessionId: string
      merchantFrameId: string
    }

type UsagePolicy =
  | { kind: 'consumer_quota' }
  | { kind: 'store_demo_allowance'; merchantId: string }
  | { kind: 'merchant_allowance'; merchantId: string }
```

Rules:

1. The server MUST select `UsagePolicy`; it MUST NOT accept a client-controlled `bypassQuota` flag.
2. Store generation MUST NOT increment consumer free-trial, subscription, or credits counters.
3. Consumer generation behavior MUST remain unchanged.
4. Every Store generation attempt MUST be attributable to merchant, session, and frame.
5. Every Store generation attempt MUST count toward a server-enforced demo or merchant allowance, including a documented rule for failed attempts.
6. Store demo limits MUST be configurable without changing shopper UI code.
7. The generation adapter MUST preserve provider selection, prompt versioning, retry, polling, storage, and failure behavior from the existing Try-On service where compatible.
8. Provider-specific fields MUST remain outside Store domain types.

No code path may obtain free generation solely because a request contains Store-shaped metadata.

---

## 8. Existing TryOnTask Extension

Store MUST reuse `TryOnTask`; a separate `StoreTryOnTask` is prohibited unless an ADR supersedes this decision.

Required first-class attribution fields:

```text
origin: CONSUMER | STORE_DEMO | STORE_PILOT
merchantId?
merchantSessionId?
merchantFrameId?
idempotencyKey?
```

`userId` must become optional if anonymous Store sessions are executed through the shared task table.

Database invariants MUST enforce the equivalent of:

- consumer task: `userId` present and Store attribution absent;
- Store task: merchant, merchant session, and merchant frame present;
- Store task merchant IDs agree across related records;
- `idempotencyKey`, when present, is unique;
- a Store task cannot be created for an inactive frame, expired session, or suspended merchant.

Prisma does not express every check constraint. The migration MAY add explicit PostgreSQL `CHECK` constraints after Prisma-generated SQL.

Core queryable attribution MUST NOT be stored only in `TryOnTask.metadata`. Metadata remains appropriate for:

- provider name and external task ID;
- prompt source and version;
- retry diagnostics;
- immutable input diagnostics;
- non-sensitive provider response details.

---

## 9. Idempotency and State Transitions

All Store generation submissions MUST be idempotent.

The server MUST derive an idempotency key from trusted context, for example:

```text
store:{merchantSessionId}:{merchantFrameId}:{clientSubmissionId}
```

Rules:

1. Repeating the same valid submission returns the existing task.
2. Concurrent duplicates create at most one task.
3. Completion and usage settlement are exactly-once or safely repeatable.
4. Event writes use a unique event ID or deterministic idempotency key.
5. Intent submission retries MUST not create duplicate favorites, clicks, or inquiries unless the user performed a new action.
6. Task status changes MUST pass through named service methods; UI code MUST NOT write statuses.

---

## 10. Catalog Boundary

`MerchantFrame` represents a merchant-owned listing. It MUST NOT be implemented by adding `merchantId` directly to the historical global `GlassesFrame` model.

Minimum D0 fields:

```text
id
merchantId
sku?
name
imageUrl or imageAssetId
productUrl?
price?                 # integer minor currency unit
currency?              # normalized ISO-style lowercase code
shape
material?
color?
widthClass?
styleTags[]
source: SEED | MANUAL | CSV | EXTERNAL
externalId?
enrichmentStatus: NOT_REQUIRED | PENDING | REVIEW_REQUIRED | APPROVED
status: DRAFT | ACTIVE | INACTIVE
createdAt
updatedAt
```

Required constraints and indexes:

- unique merchant slug;
- unique non-null `(merchantId, sku)`;
- optional unique `(merchantId, source, externalId)` when `externalId` is present;
- index `(merchantId, status)`;
- index `(merchantId, updatedAt)`;
- product price stored as integer minor units, never float.

Recommendation metadata MUST record whether it is imported, AI-enriched, or manually reviewed. AI-enriched data MUST NOT become active automatically in M1. D0 seeded data may be pre-approved.

A future optional canonical frame reference MAY be added, but D0 MUST NOT build a global PIM or deduplicate products across merchants.

---

## 11. Recommendation Adapter

Store recommendation MUST be a deterministic application/domain service over merchant-owned frames.

Required contract:

```text
Input:
  normalized shopper analysis signals
  active MerchantFrame candidates for one merchant
  ranking version

Output:
  4-8 ranked merchant frames
  stable score
  short shopper-safe reason
  ranking version
```

Rules:

1. Candidate retrieval MUST be tenant-scoped and active-only.
2. Ranking logic MUST be a pure function where practical and unit tested.
3. Ranking MUST tolerate sparse optional metadata.
4. Ranking version MUST be persisted with the recommendation/session event.
5. Reasons MUST not make medical, prescription, PD, or guaranteed-fit claims.
6. Provider/model calls MAY enrich inputs, but merchant ranking MUST remain testable without network access.

---

## 12. Operational Events and Merchant Insights

GA/GTM is not the source of truth for merchant insights.

D0 MUST persist a minimal append-only Store event record, named `MerchantEvent` or equivalent:

```text
id
eventId                 # unique idempotency key
type
merchantId
merchantSessionId?
merchantFrameId?
tryOnTaskId?
source: CLIENT | SERVER
locale?
deviceType?
metadata?               # sanitized and non-sensitive
createdAt
```

Canonical event names:

```text
merchant_page_viewed
merchant_photo_uploaded
merchant_recommendation_started
merchant_recommendation_completed
merchant_frame_selected
merchant_tryon_started
merchant_tryon_completed
merchant_tryon_failed
merchant_compare_started
merchant_favorite_saved
merchant_product_clicked
merchant_inquiry_submitted
merchant_insights_viewed
```

Event rules:

1. Try-On completion and failure MUST be written by the server.
2. Favorite, product click, and inquiry MUST pass through a server endpoint before being treated as merchant insight.
3. Client analytics MAY mirror persisted events to GA/GTM.
4. Raw image URLs, face landmarks, full face-analysis payloads, email addresses, names, and inquiry notes MUST NOT enter general event metadata.
5. Merchant insight aggregates MUST be derived from database records, not reconstructed from GA.
6. `MerchantIntent` remains the semantic record for `FAVORITE`, `PRODUCT_CLICK`, and `INQUIRY`; events are the funnel/activity record.

---

## 13. Asset and Privacy Boundary

Store MUST introduce an asset access seam before accepting real external shopper traffic.

Required interface responsibilities:

```text
AssetStore.put(...)
AssetStore.getProviderDeliveryUrl(...)
AssetStore.delete(...)
AssetStore.assertAccess(...)
```

The implementation MAY initially use Vercel Blob, but Store application/domain code MUST not depend directly on Vercel Blob APIs.

Store asset records or equivalent metadata MUST identify:

- owner type and owner ID;
- merchant and merchant session when applicable;
- purpose: shopper photo, frame input, or generated result;
- storage key;
- access mode;
- expiry time;
- deletion state.

Privacy rules:

1. Shopper privacy / retention notice appears before upload.
2. Raw shopper images MUST NOT appear in merchant insight API responses or UI.
3. Raw image URLs MUST NOT be written to GA/GTM or general Store events.
4. Store assets MUST have an explicit retention policy and `expiresAt`.
5. Deletion MUST be idempotent and observable.
6. If D0 temporarily uses publicly addressable Blob URLs, the limitation MUST be documented in the D0 operator note and Gate External Traffic remains closed until access is private or otherwise controlled.
7. Signed or temporary provider access SHOULD be used when supported; permanent public URLs MUST NOT be treated as an authorization mechanism.

---

## 14. Routes and API Contracts

Recommended route ownership:

```text
/{locale}/store                         # existing marketing page
/{locale}/store/{merchantSlug}          # merchant shopper shell
/admin/store/merchants/{merchantId}     # D0 internal insight / operations
/api/store/...                          # Store application APIs
```

Public shopper pages MUST follow the existing static-shell/client-fetch architecture. They MUST NOT call `getServerSession()` or Prisma during public page rendering.

API requirements:

1. Every mutation input MUST receive runtime validation.
2. Shared request/response contracts live under `src/modules/store/contracts`.
3. Error responses MUST use stable machine-readable codes plus shopper-safe messages.
4. APIs MUST distinguish not-found from inactive/suspended without leaking cross-tenant existence.
5. API responses MUST not return Prisma records directly.
6. Merchant product links MUST be validated as `http` or `https` before redirect/navigation.
7. Store session and generation APIs MUST enforce request-size, image-type, and image-size limits server-side.

---

## 15. Seed and Operator Safety

D0 seed tooling MUST be repeatable and non-destructive.

Rules:

1. Seed the sample merchant using stable slug and `upsert` semantics.
2. Seed frames using stable SKU or external IDs.
3. Store seed tooling MUST NOT call broad `deleteMany()` on shared or production tables.
4. Production execution MUST require an explicit environment guard or operator confirmation mechanism.
5. The operator note MUST document create/update/deactivate behavior and how to verify the merchant catalog.

---

## 16. Observability and Failure Handling

Every Store request and background operation SHOULD include these structured log fields when available:

```text
requestId
merchantId
merchantSessionId
merchantFrameId
tryOnTaskId
eventType
origin
```

Requirements:

1. Logs MUST NOT contain raw images, signed URLs, full face payloads, capability tokens, inquiry notes, or email addresses.
2. Generation failures MUST be queryable by merchant and task.
3. Partial failure in a 2-4 frame batch MUST preserve successful results.
4. Retry MUST reuse trusted attribution and usage policy from the original task.
5. Merchant-facing errors MUST not expose provider internals.

---

## 17. Required Tests

D0 cannot be accepted without automated coverage for:

### Tenant and authorization

- one merchant cannot read or mutate another merchant's frame, session, intent, event, or task;
- a client cannot change merchant attribution by changing request fields;
- inactive merchant/frame and expired session are rejected;
- a raw session ID without capability proof is rejected.

### Usage and idempotency

- Store Demo usage does not change consumer credits or subscription counters;
- consumer Try-On behavior remains unchanged;
- repeated and concurrent submission returns one generation task;
- completion/event/intent retries do not double count.

### Privacy

- merchant insight responses never include raw shopper image URLs;
- Store analytics metadata rejects sensitive fields;
- expired Store assets are selected for deletion;
- logs and error responses do not expose session capability values.

### Catalog and recommendation

- frame lookup is merchant-scoped and active-only;
- sparse frame metadata produces a valid shortlist;
- deterministic inputs produce deterministic ranking output for one ranking version;
- price and currency normalization is correct;
- Store seed is repeatable and does not delete unrelated data.

### Workflow

- mobile and desktop happy path;
- 2, 3, and 4 frame compare;
- one-frame generation failure preserves the other results;
- favorite, product click, and inquiry appear in merchant insight totals;
- no consumer Credits Pack prompt appears in Store context.

---

## 18. D0-0 Foundation Gate

STORE-1 through STORE-5 feature work MUST NOT be considered merge-ready until the D0-0 foundation gate is satisfied.

D0-0 acceptance criteria:

1. This specification and ADR-006 are linked from the active Store execution plan.
2. `src/modules/store` boundary and dependency rules are present.
3. Prisma migration design covers merchant, frame, session, intent, event, and Try-On attribution.
4. Tenant-scoped repository contracts are defined.
5. Store actor and server-owned usage policy are defined.
6. Store idempotency strategy is defined and database-enforced where possible.
7. Asset access and external-traffic privacy gates are documented.
8. Runtime API validation approach is selected.
9. Required tenant, quota-isolation, idempotency, and privacy tests have executable test skeletons or first implementations.
10. Existing consumer Try-On contract tests remain green.

Implementation may combine D0-0 and STORE-1 in one PR, but the PR must demonstrate every D0-0 acceptance criterion before adding shopper UI behavior.

---

## 19. External Traffic Gate

A working D0 URL MUST NOT be shared for independent non-team shopper use until all are true:

1. server-issued MerchantSession capability is enforced;
2. Store Demo allowance and abuse limits are server-enforced;
3. shopper assets use controlled access rather than permanent public URLs as authorization;
4. privacy notice appears before upload;
5. retention and idempotent cleanup are active;
6. merchant insight, events, analytics, and logs exclude raw shopper images and sensitive face payloads;
7. external-traffic tenant, authorization, abuse, and privacy tests pass.

An internal team-operated screen-share demo MAY run before this gate if no external shopper receives independent access and the D0 operator note records the limitation.

---

## 20. Review Checklist for Every Store PR

Every Store PR description MUST answer:

1. What tenant owns each new record?
2. Where is tenant access enforced?
3. Who is the actor, and who pays for usage?
4. What makes the mutation idempotent?
5. Which fields are persisted as first-class columns versus metadata, and why?
6. Does the change expose or extend retention of a shopper image?
7. Which events are authoritative server records versus best-effort analytics?
8. How is existing consumer behavior protected?
9. Which automated tests prove isolation and failure behavior?
10. Is this abstraction required by D0/M1, or is it premature platform work?

---

## 21. Deferred Platform Work

The following remain intentionally deferred until the corresponding product gate:

- Shopify OAuth and product synchronization;
- integration adapter SDK;
- external webhook/event delivery;
- message queue or separate worker service;
- generalized catalog and inventory platform;
- merchant billing engine;
- team RBAC and enterprise identity;
- public Store API and embeddable widget SDK.

Adapters added later MUST enter through the Store application contracts defined here rather than bypassing tenant, usage, event, or asset boundaries.

---

## 22. Change Log

| Date | Change |
| --- | --- |
| 2026-08-05 | Created mandatory Store engineering foundation for D0, including modular-monolith boundaries, tenant isolation, Store actor/usage policy, shared Try-On attribution, durable events, asset privacy, idempotency, tests, and D0-0 gate. |
