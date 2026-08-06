# ADR-008: Commerce Is the Domain; Storefront Is a Delivery Surface

**Status:** Accepted  
**Date:** 2026-08-06  
**Owner:** Product / Engineering

## Context

VisuTry Store was originally built as the fastest merchant-facing SaaS surface for validating whether eyewear merchants would pay for AI recommendation, Try-On, Compare, and shopper-intent insight.

That foundation remains valid, but the commercial direction is now clearer:

> **Storefront is the delivery surface. AI Commerce / Campaign Engine is the business.**

The long-term product is not a merchant website builder and not a virtual try-on plugin. It is a vertical AI commerce / martech platform for eyewear that turns human and AI-agent traffic into measurable shopper intent, conversion, and merchant revenue.

The expected progression is:

```text
Storefront
  -> Campaign Engine
  -> Commerce Intelligence
  -> Commerce Infrastructure
```

The architecture therefore must not make the hosted Storefront the center of the domain model. Storefront is only the first delivery adapter.

ADR-006 remains valid for the current modular multi-tenant foundation. ADR-007 remains valid for Consumer stability and Store isolation. ADR-008 defines the longer-term commerce-domain direction that subsequent Store work must preserve.

## Decision

The project adopts the following architectural rule:

> **Commerce owns the business domain. Storefront is one delivery surface.**

The commerce domain is responsible over time for the durable business concepts that can be shared by hosted Storefronts, campaign landing experiences, embedded widgets, Shopify integrations, APIs, and future AI-agent interfaces.

### 1. Domain center

The long-term commerce domain centers on:

- `Merchant`;
- `Catalog / Product Identity`;
- `Campaign`;
- `Commerce Experience / Journey`;
- `Shopper Journey / Session`;
- `Intent`;
- `Conversion`;
- `Attribution / Measurement`;
- `Merchant Usage / Commercial Policy`.

Generation capabilities such as face understanding, recommendation, Try-On, and Compare are reusable commerce capabilities. They are not the top-level business domain.

### 2. Delivery surfaces

The following are delivery adapters / surfaces, not separate commerce domains:

- hosted Storefront;
- campaign landing page;
- embedded widget;
- Shopify / commerce-platform integration;
- merchant-site embedded experience;
- public API;
- future AI-agent interface.

No delivery surface may create its own duplicate catalog, shopper identity, recommendation, Try-On, intent, or attribution stack.

### 3. Current Store module

The current `src/modules/store/**` implementation remains the Phase-1 commerce foundation and MUST NOT be rewritten solely to satisfy this ADR.

However, new code must avoid deepening the assumption that Storefront is the business domain.

When shared commerce concepts become needed by more than one delivery surface, they SHOULD move toward a neutral commerce boundary such as:

```text
src/modules/commerce/
  merchant/
  catalog/
  campaign/
  journey/
  measurement/
  attribution/
  integrations/
```

The hosted Store may then remain as a delivery adapter / application surface.

Migration is incremental and demand-driven. Do not perform a large-bang rename or module rewrite before a real second surface requires it.

### 4. Campaign becomes a first-class future aggregate

M1 MAY continue with session-level campaign/source attribution without a dedicated `Campaign` table when one merchant-wide experience is sufficient.

A first-class `Campaign` aggregate becomes REQUIRED when any of the following appears in real pilot usage:

- one merchant runs multiple simultaneous traffic / audience experiences;
- different catalog subsets are used for different campaigns;
- campaign-specific offer, copy, objective, or landing experience must persist;
- merchants need campaign-level performance comparison;
- traffic source identifiers must map to a durable merchant campaign;
- pricing or billing depends on campaigns.

Expected future shape:

```text
Merchant
  -> Campaign
      -> Audience / acquisition context
      -> Catalog subset
      -> Experience definition
      -> Conversion goals
      -> Measurement
```

### 5. Commerce Experience / Journey

Recommendation → Try-On → Compare is currently the primary journey, but the architecture MUST NOT hard-code one Storefront page sequence as the only future commerce flow.

Future campaigns may use different combinations such as:

```text
Face Understanding -> Recommendation -> Compare -> Product Click
Style Quiz -> Recommendation -> Try-On -> Offer
Collection Entry -> Recommendation -> Try-On -> Inquiry
```

The project MUST NOT build a generalized visual workflow builder now. The requirement is only to keep reusable commerce capabilities callable from application-level journey orchestration rather than tightly coupling them to a specific page.

### 6. Intent and Conversion are distinct

`MerchantIntent` remains valid for behavioral intent such as:

- favorite;
- product click;
- inquiry;
- shortlist / high-intent behavior.

The future commerce domain must distinguish these from verified conversion outcomes such as:

- lead created;
- appointment booked;
- add to cart;
- checkout started;
- purchase;
- attributed revenue.

A first-class conversion model becomes required before VisuTry claims merchant revenue attribution.

### 7. Attribution is a core commerce capability

M1 may use first-touch/session attribution.

The data model MUST preserve a path toward richer measurement. Durable first-party records should be able to associate relevant events with:

```text
merchantId
merchantSessionId
campaignId?        # future first-class relation
source?
medium?
referrer?
aiAgentSource?
frameId?
productId?
eventType
occurredAt
metadata
```

Campaign/source context MUST NOT exist only in GA4 or external analytics.

Multi-touch attribution is explicitly deferred until real merchant demand and sufficient volume exist.

### 8. Product identity is commerce infrastructure

Merchant frame/product identity must be treated as a commerce object, not merely a Try-On asset.

Stable identity should preserve, where available:

- merchant SKU;
- canonical product URL;
- price / currency;
- brand / variant / collection;
- availability;
- merchant source facts;
- AI-enriched eyewear attributes;
- status.

Merchant source facts and AI-derived enrichment MUST remain distinguishable.

This identity is the common reference point for recommendation, Campaign, agent discovery, product click, conversion, and later Shopify / API integration.

### 9. Human + AI-agent traffic share the same commerce core

Agent-ready commerce is a distribution requirement, not a second product stack.

Human and AI-agent traffic should converge into the same merchant, catalog, journey, intent, conversion, and measurement model.

The system should evolve around four principles:

- **Discoverable** — stable intended-public merchant / campaign / product surfaces;
- **Understandable** — verified structured commerce facts;
- **Actionable** — reusable application contracts for recommendation, Try-On, Compare, and product destination;
- **Measurable** — agent-originated sessions and commerce outcomes can be attributed.

A broad public agent API, autonomous purchase execution, or agent access to shopper photos is not required now.

### 10. Architecture dependency direction

The desired long-term direction is:

```text
                         Commerce Domain
                /             |              \
               /              |               \
       Hosted Storefront   Campaign Surface   Integrations / Agent
               \              |               /
                \             |              /
             Shared Commerce Capabilities
        Face / Recommendation / Try-On / Compare
                         |
                Shared Generation Core
```

Consumer remains protected by ADR-007.

The commerce domain may reuse Consumer-proven shared technical capabilities, but Consumer MUST NOT depend on merchant commerce orchestration.

## Consequences

### Easier

- Storefront can remain the fastest pilot surface without defining the long-term platform boundary.
- Campaign Engine can become first-class without rewriting Try-On, Compare, catalog, or merchant identity.
- Shopify, widget, APIs, and AI-agent interfaces can reuse one commerce model.
- Attribution and conversion can mature incrementally from pilot evidence.
- The project avoids becoming a generic website builder or duplicate ecommerce platform.

### Harder

- Engineers must distinguish Storefront UI concerns from durable commerce concepts.
- Some Store-owned code will later need incremental extraction into neutral commerce modules.
- Event, product identity, and session contracts require stronger discipline now because they become future measurement infrastructure.

### Explicit Non-Decision

This ADR does **not** authorize immediate implementation of:

- a generic campaign builder;
- multi-touch attribution;
- CDP / CRM functionality;
- marketing automation;
- public Shopify app;
- public agent API;
- autonomous checkout;
- large-scale module migration.

Those remain gated by merchant pilot evidence.

## Related Documents

- `docs/decisions/ADR-006-store-modular-multitenant-foundation.md`
- `docs/decisions/ADR-007-store-consumer-stability-boundary.md`
- `docs/product/specs/visutry-commerce-architecture.md`
- `docs/product/specs/visutry-store-mvp.md`
- `docs/product/plans/visutry-store-demo-pilot-readiness-plan.md`
- `docs/product/plans/visutry-store-implementation-plan.md`

## Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Accepted commerce-domain / Storefront-surface architecture direction. |
