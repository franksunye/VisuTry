# VisuTry Product System

**Status:** Active source of truth for cross-product and cross-repository positioning  
**Created:** 2026-07-08  
**Last reviewed:** 2026-09-13  
**Owner:** Product / Engineering  
**Review cadence:** Monthly, or when product/repository ownership changes  
**Scope:** Consumer vs Merchant product boundaries, shared eyewear decision capabilities, Merchant Store/Product/Campaign object definitions, and repository ownership across `VisuTry`, `visutry-tryon-sdk`, and `visutry-mobile`.

---

## 1. Purpose

This document prevents two classes of drift:

1. **Product drift** — treating Consumer as a Merchant sub-funnel, or creating duplicate Merchant strategies/products for Store, Campaign, discovery, and agents.
2. **Repository drift** — duplicating business logic, account/payment systems, decision logic, or commercial ownership across Web, SDK, and Mobile.

Working model:

> **One brand. One platform. Shared Eyewear Decision Intelligence. Two first-class product faces. Multiple delivery surfaces.**

Canonical company positioning:

> **VisuTry is an AI eyewear decision and commerce platform for both consumers and merchants.**

Canonical North Star:

> **Help people make better eyewear decisions, and help merchants turn those decisions into measurable commerce outcomes.**

---

## 2. Two First-Class Product Faces

### 2.1 Consumer

> **Consumer = Discovery → Decision**

Consumer is an independent product surface, not a Merchant acquisition widget and not a subordinate funnel.

Consumer owns the individual shopper journey around:

- Face Analysis / Face Shape understanding;
- Recommendation / Glasses Advisor;
- Virtual Try-On;
- Compare;
- Consumer SEO / Search / AI discovery;
- consumer traffic and product validation;
- consumer account/history where required;
- consumer payment / credits conversion.

Canonical Consumer path:

```text
Discovery
→ Face Analysis
→ Recommendation
→ Virtual Try-On
→ Compare
→ Decision / Save / Share / Purchase continuation
```

Consumer can generate product learning and company-level demand signals, but Consumer sessions are not automatically Merchant traffic or Merchant proof.

### 2.2 Merchant

> **Merchant = Discovery → Decision → Intent**

Merchant serves eyewear merchants, brands, agencies, and the shoppers entering merchant-owned VisuTry experiences.

Canonical Merchant value statement:

> **VisuTry helps eyewear merchants become more discoverable across search and AI, and turns that discovery into measurable shopper intent.**

Canonical Merchant chain:

```text
Search / AI Discovery
→ MerchantSession
→ Product Decision
→ Recommendation / Try-On / Compare
→ Intent
```

Merchant is not a generic storefront, CMS, CRM, inventory ERP, or Shopify replacement. It is a discovery + decision + commerce-intent layer built around merchant catalog data and VisuTry decision intelligence.

---

## 3. Shared Eyewear Decision Intelligence

Consumer and Merchant share the same underlying decision capabilities:

> **Face Understanding + Frame/Product Understanding + Recommendation + Try-On + Compare**

The shared capability layer must not be interpreted as shared product ownership.

| Capability | Consumer role | Merchant role |
| --- | --- | --- |
| Face Analysis | Help an individual understand face characteristics relevant to eyewear | Add shopper context to merchant recommendation when used |
| Recommendation | Recommend useful frame directions | Recommend products from a merchant catalog / selected subset |
| Virtual Try-On | Validate a specific frame visually | Validate a merchant product visually |
| Compare | Support a personal shortlist decision | Support product-level decision within merchant experience |
| Analytics | Consumer acquisition, usage, payment | MerchantSession, MerchantEvent, MerchantIntent, source and commerce outcome |

Rules:

- Do not fork a separate Merchant recommendation/try-on/compare engine if shared application capabilities can serve both safely.
- Do not force Consumer account, credits, or payment semantics into Merchant shopper flows.
- Do not count Consumer discovery as Merchant discovery proof without a merchant-scoped session/outcome.

---

## 4. Merchant Discovery Engine

**Merchant Discovery Engine** is a capability grouping inside the existing Merchant / Store / Campaign / Agent-ready Commerce architecture.

It is not a new standalone product or repository.

Its modules are:

| Module | Product responsibility |
| --- | --- |
| **Merchant Discovery Surface** | Public Store, Product, and selected Campaign/intent surfaces that can be independently discovered when publication policy permits. |
| **Commerce Graph** | Stable merchant/product/offer/frame relationships and machine-understandable commerce facts. |
| **Discovery Distribution** | Supported sitemap, structured-data, feed/indexing/distribution mechanisms. |
| **Decision Engine** | Face Analysis, Recommendation, Try-On, Compare. |
| **Discovery Intelligence** | Attribute discovery/referral through MerchantSession and decision behavior. |
| **Intent Handoff** | Record and route measurable product click, inquiry, appointment, merchant-site/checkout destination, or another modeled commercial outcome. |

This capability grouping extends the existing **AI Commerce / Campaign Engine**; it does not replace it.

---

## 5. Canonical Merchant Objects

### 5.1 Store

> **Store = canonical merchant discovery & decision surface.**

Store is the merchant's long-lived public authority surface when published.

Responsibilities:

- identify the merchant/brand;
- expose stable merchant commerce context;
- provide catalog/product exploration;
- provide entry to the Decision Engine;
- provide a durable discovery target for humans, Search, and AI;
- preserve merchant/session attribution into downstream decision and Intent events.

Store is not the unit for every audience or promotion. A merchant normally has one canonical Store per brand/workspace context; campaign variation belongs in Campaign.

### 5.2 Product Page

> **Product Page = canonical commerce entity.**

A Product Page represents one stable product/frame entity with a durable URL and explicit facts where available.

Minimum conceptual responsibilities:

- stable product identity;
- merchant/brand relationship;
- canonical product destination;
- frame attributes used by recommendation where available;
- price/currency/availability only when merchant-provided or otherwise trustworthy;
- Decision Engine entry points;
- machine-understandable structured context.

Product Page is not a claim that VisuTry itself is the seller of record.

### 5.3 Campaign

> **Campaign = audience / intent-specific experience.**

Campaign can be specialized by audience, catalog subset, source, creative, promotion, or shopper intent.

Publication policy is explicit:

- `PUBLIC_INDEX` — intentionally public/indexable and suitable for discovery;
- `UNLISTED` — accessible by link but not intended for search indexing;
- `PRIVATE` — restricted/non-public.

Not all Campaigns are SEO pages. Paid media, QR, email, agency/client, temporary promotion, and controlled validation Campaigns may be unlisted/private.

### 5.4 Decision Engine

> **Decision Engine = Face Analysis / Recommendation / Try-On / Compare.**

It is the shared intelligence layer that turns a discovery visit into a better product decision.

### 5.5 Intent

> **Intent = measurable commercial outcome.**

Intent must be a modeled business signal, not generic engagement.

Examples:

- product click / merchant handoff;
- favorite/save if modeled as merchant value;
- inquiry;
- appointment request;
- checkout/product destination;
- later attributed transaction where reliable data exists.

---

## 6. Product-Surface Isolation Rules

### Consumer must remain independent

Consumer continues to own:

- its own Search/SEO/AI discovery;
- its own product navigation and decision journey;
- its own account/history/payment model;
- its own conversion and revenue reporting;
- its own growth experiments and validation.

Do not rewrite Consumer as a Merchant lead-generation funnel.

### Merchant must prove its own value

Merchant commercial proof must be merchant-scoped.

A valid merchant path requires merchant context such as:

```text
Merchant Store / Product / Campaign
→ MerchantSession
→ merchant-scoped decision behavior
→ MerchantIntent
```

Consumer pageviews, Consumer AI referrals, and Consumer purchases may be useful company evidence but cannot substitute for MerchantSession / MerchantEvent / MerchantIntent proof.

### Shared capabilities, separate commercial semantics

The same underlying recommendation or generation capability may serve both surfaces, but:

- entitlement can differ;
- UI can differ;
- identity/login requirements can differ;
- source attribution can differ;
- payment/usage accounting can differ;
- analytics must preserve the product-surface boundary.

Observability and analytics ownership remains governed by `docs/project/observability-and-analytics-contract.md`.

---

## 7. Repository Roles

| Repository | Role | Primary responsibility |
| --- | --- | --- |
| `franksunye/VisuTry` | Product platform and commercial system | Consumer Web, Merchant Store/Campaign, public discovery surfaces, accounts, payments, merchant tenancy, analytics, product/commercial docs, agent-ready commerce runtime. |
| `franksunye/visutry-tryon-sdk` | Reusable capability layer | Face geometry, face-shape analysis, recommendation primitives, AR/try-on rendering, normalized assets, platform adapters, privacy-first on-device capability. |
| `franksunye/visutry-mobile` | Mobile experience surface | Camera-first mobile/mini-program experience that consumes platform APIs and reusable SDK capabilities. |

Short version:

```text
VisuTry             = product platform + business/commercial system
VisuTry Try-On SDK  = reusable eyewear decision / rendering capability layer
VisuTry Mobile      = camera-first Consumer delivery surface
```

---

## 8. Main Platform Ownership

`franksunye/VisuTry` owns the product/commercial source of truth for both first-class product faces.

### Consumer-owned platform concerns

- public Consumer web product;
- Face Analysis / Detector;
- Glasses Advisor / Recommendation;
- Virtual Try-On;
- Frame Compare;
- Consumer SEO/GEO and discovery pages;
- Consumer account/history;
- credits / Stripe consumer payment;
- Consumer analytics and growth surfaces.

### Merchant-owned platform concerns

- Merchant tenant/workspace;
- Store;
- Product / catalog entities and public Product Pages;
- Campaign;
- MerchantSession / MerchantEvent / MerchantIntent;
- Merchant discovery/distribution surfaces;
- Merchant Commerce Intelligence;
- Merchant Workspace / Admin control surfaces;
- Agent Keys, MCP/OAuth and Agent-ready Commerce capabilities;
- Merchant entitlement and sponsored/merchant usage accounting where implemented.

The platform should reuse shared application/domain capabilities rather than duplicating Consumer and Merchant engines unnecessarily.

---

## 9. SDK Ownership

`franksunye/visutry-tryon-sdk` owns reusable low-level decision/rendering capability such as:

- face geometry primitives;
- MediaPipe / landmark integration;
- face-shape analysis algorithm;
- landmark overlays;
- pose solving and quality gating;
- AR / glasses rendering;
- recommendation primitives where reusable;
- normalized glasses asset format;
- Web / mobile / mini-program adapters.

It should not own:

- Stripe / commercial billing;
- Consumer credits;
- Merchant tenancy or entitlement;
- MerchantSession/Intent analytics;
- SEO/discovery strategy;
- Store/Campaign commercial semantics;
- product roadmap priority.

---

## 10. Mobile Ownership

`franksunye/visutry-mobile` is a Consumer-facing mobile delivery surface, not an independent commercial system.

It may provide:

- camera/upload-first Face Analysis;
- recommendation;
- try-on;
- compare;
- saved/shareable Consumer results;
- mobile account/credits flows through platform APIs where supported;
- future WeChat Mini Program delivery.

It should not create a separate backend, billing system, merchant system, or product strategy.

---

## 11. Agent-Ready Commerce Relationship

Existing Agent-ready Commerce is a Merchant operating/distribution interface, not a third product face.

The operating principle remains:

> **Agent-first, not Agent-only.**

Merchant Workspace/Admin and external agents must use the same merchant/domain capabilities for:

- catalog;
- Store;
- Campaign;
- publish/preview lifecycle;
- analytics / Commerce Intelligence;
- authorization and tenant boundaries.

Merchant Discovery Engine adds a clear discovery contract to this architecture:

```text
Search / AI finds public merchant commerce entity
→ shopper/agent arrives at Store/Product/Campaign
→ MerchantSession
→ shared Decision Engine
→ MerchantIntent
```

No duplicate agent commerce stack should be created.

---

## 12. What Not to Split or Build Yet

Do not create independent systems/products prematurely for:

- Consumer vs Merchant decision engines when shared capabilities suffice;
- a separate Merchant Discovery product line;
- a separate agent commerce backend;
- independent Mobile backend/billing;
- independent SDK commercial billing;
- generic CRM/marketing automation;
- generalized Campaign Builder without evidence;
- Shopify/WooCommerce public app before the Merchant proof sequence justifies it;
- EHR/PMS or inventory ERP replacement;
- public agent API solely for positioning.

The system should evolve by proving user/merchant value first and extracting stable capability second.

---

## 13. Roadmap Sequencing

### Near term

- Keep Consumer Discovery → Decision stable and growing.
- Run the Merchant Discovery Proof Sprint using the existing Store/Campaign/Agent-ready architecture.
- Establish canonical Store/Product/Campaign discovery semantics and Merchant measurement evidence before expanding Merchant product surface area.
- Keep SDK focused on stable/testable eyewear intelligence capability.

### After proof

- Use Merchant discovery evidence to decide which distribution integrations matter.
- Validate the first real merchant using a real catalog and declared traffic source.
- Expand only the Store/Campaign/agent capabilities required by repeated merchant demand.

### Later / evidence-gated

- Shopify/WooCommerce wrappers;
- broader API/agent action surfaces;
- richer commerce attribution/integration;
- professional Studio workflows;
- multi-brand/agency organization layers where needed.

---

## 14. Related Documents

- `docs/strategy/commercial-strategy.md`
- `docs/product/product-plan.md`
- `docs/strategy/analytics/gtm.md`
- `docs/product/specs/visutry-store-mvp.md`
- `docs/product/plans/agent-native-merchant-self-service.md`
- `docs/product/plans/product-advantage-gate.md`
- `docs/project/observability-and-analytics-contract.md`
- `docs/project/architecture.md`
- `docs/decisions/ADR-007-store-consumer-stability-boundary.md`

---

## 15. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created product system overview for Web, SDK, and Mobile repositories. |
| 2026-09-13 | Expanded the authority to explicit Consumer/Merchant product boundaries; made Consumer a first-class Discovery → Decision product; formalized Merchant Discovery Engine, Store/Product/Campaign/Decision/Intent definitions, and Merchant Discovery → Decision → Intent measurement while retaining the existing Agent-ready Commerce architecture. |