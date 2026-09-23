# VisuTry Product System

**Status:** Active source of truth for cross-repository product positioning
**Created:** 2026-07-08
**Last reviewed:** 2026-09-23
**Owner:** Product / Engineering
**Review cadence:** Monthly, or when Web, SDK, Mobile, or Merchant product ownership changes
**Scope:** Relationship between `VisuTry`, `visutry-tryon-sdk`, and `visutry-mobile`, including the current Consumer and Merchant product faces.

## 1. Positioning and North Star

Company-level positioning:

> **VisuTry is an AI eyewear decision and commerce platform for both consumers and merchants.**

North Star:

> **Help people make better eyewear decisions, and help merchants turn those decisions into measurable commerce outcomes.**

The two current product faces are:

- **Consumer: Discovery → Decision**
- **Merchant: Discovery → Decision → Intent**

Consumer is an independent product surface, not merely a lead-generation appendage for B2B. Merchant is a production product surface, not a future-only Store experiment.

Working model:

> One brand. One platform. One reusable capability layer. Multiple product surfaces.

## 2. Repository roles

| Repository | Role | Primary responsibility |
| --- | --- | --- |
| `franksunye/VisuTry` | Product platform and commercial system | Consumer Web product, Merchant Operating Experience, accounts, credits/payments, Store/Campaign runtime, analytics, Agent/MCP access, SEO/GEO, Admin, product/commercial authorities. |
| `franksunye/visutry-tryon-sdk` | Reusable capability layer | Face geometry, face-shape analysis, recommendation, AR try-on, Web/WeChat adapters, privacy-first on-device processing. |
| `franksunye/visutry-mobile` | Mobile experience surface | Camera-first PWA / future mini-program experience built on VisuTry platform APIs and SDK capabilities. |

Short version:

```text
VisuTry             = product platform + Consumer + Merchant commerce system
VisuTry Try-On SDK  = reusable eyewear intelligence and try-on engine
VisuTry Mobile      = camera-first mobile product surface
```

## 3. VisuTry main platform

`franksunye/VisuTry` is the product and commercial source of truth.

### Consumer product

The main platform owns the Consumer decision journey:

```text
Face Shape / Face Analysis
→ Recommendation / Glasses Advisor
→ Virtual Try-On
→ Compare
→ Save / Share / Paid continuation
```

It also owns Consumer traffic/SEO/AI discovery, authentication, payment/credits, history, and product validation.

### Merchant product

The main platform owns the production Merchant operating and shopper-commerce journey:

```text
Merchant acquisition / activation
→ Catalog
→ Store / Campaigns
→ shopper Recommendation / Try-On / Compare
→ measurable Intent
→ Analytics / operating decisions
```

The human Merchant Operating Experience currently provides Home, Catalog, Store, Campaigns, Analytics, Integrations, Plan & Usage, and Settings. First Value remains a private Store Preview. The durable behavior authority is `docs/product/specs/merchant-operating-experience.md`.

The platform also owns Remote MCP / Agent access. Human UI and Agent/MCP use shared canonical application/domain capabilities; Agent access is optional and is not implemented by automating the human UI.

## 4. VisuTry Try-On SDK

`franksunye/visutry-tryon-sdk` is the reusable capability layer behind the VisuTry product system.

It owns:
- face geometry primitives;
- MediaPipe / landmark integration;
- face-shape analysis algorithm;
- landmark overlays;
- pose solving;
- smoothing and quality gating;
- AR glasses try-on rendering;
- glasses recommendation logic;
- normalized glasses asset format;
- platform adapters for Web/H5 and WeChat Mini Program.

It does not own:
- Stripe payments;
- user credits/accounts;
- Merchant tenancy or commerce lifecycle;
- SEO/GEO;
- product roadmap or commercial pricing.

## 5. VisuTry Mobile

`franksunye/visutry-mobile` is the mobile Consumer experience surface.

It should provide a camera-first experience for face analysis, glasses advice, try-on, comparison, saved results, sharing, and supported conversion flows.

It calls:
- VisuTry platform APIs for account, credits, history, payments, and persisted generation tasks;
- VisuTry Try-On SDK for face analysis and local/on-device capabilities.

It must not become a separate backend, billing system, or independent commercial authority.

## 6. Shared capability and ownership boundaries

### Platform-owned

- Auth / account state
- credits, quota, Stripe and commercial state
- persisted generation/history
- Consumer Web product
- Merchant tenant and Operating Experience
- Store/Campaign commerce runtime
- Agent/MCP authorization and tools
- analytics/business truth boundaries
- SEO/GEO and business acquisition
- product/commercial documentation

### SDK-owned

- face geometry and landmarks
- face-shape algorithm
- recommendation engine
- AR renderer
- glasses asset standard
- supported platform adapters

### Mobile-owned

- mobile interaction design
- PWA shell and camera-first state
- mobile-specific offline/interaction behavior
- future mini-program presentation layer

Business/domain rules that are shared between Human UI and Agent/MCP belong in the main platform application/domain layer, not in DOM automation or duplicated client rules.

## 7. Current architecture rule

VisuTry remains a **modular monolith** for the main platform. Consumer, Merchant, Store/Campaign, Admin, and Agent surfaces share the same application core and persistence boundaries.

Do not create, without evidence:
- an independent Merchant backend;
- an independent Mobile backend/billing/account system;
- an SDK-owned commercial system;
- a second Agent-only business-rule stack;
- a separate Store/Campaign microservice merely for naming cleanliness.

Extract capabilities only when stable ownership, scale, or reuse justifies it.

## 8. Current product sequencing boundary

P1-M2 Merchant Operating Experience is Product / UX / Production accepted and closed at main SHA `3c29d56cce1c380bef42c3f9e99dd25f95ac8724`.

No new product phase is authorized by this document. Current priority/sequence belongs to `docs/product/product-plan.md`.

Standing boundaries:
- preserve Consumer stability while Merchant evolves;
- keep Consumer and Merchant as co-equal product faces;
- validate merchant demand before broad Shopify/CRM/revenue-attribution expansion;
- keep Agent optional and approval-bounded for consequential actions.

## 9. Related documents

- `docs/product/product-plan.md`
- `docs/product/specs/merchant-operating-experience.md`
- `docs/merchant-activation-v1.md`
- `docs/product/specs/merchant-experience-architecture.md`
- `docs/product/specs/visutry-commerce-architecture.md`
- `docs/product/plans/universal-agent-access.md`
- `docs/project/architecture.md`
- `docs/strategy/commercial-strategy.md`

## 10. Change log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created product system overview for Web, SDK, and Mobile repositories. |
| 2026-09-23 | Reconciled the product system after P1-M2: established current Consumer + Merchant product faces, production Merchant Operating ownership, shared Human/Agent application boundaries, and the modular-monolith rule. |
