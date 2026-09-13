# VisuTry Commercial Strategy

**Status:** Active source of truth  
**Created:** 2026-07-08  
**Last updated:** 2026-09-13  
**Owner:** Product / Strategy  
**Scope:** Company positioning, Consumer and Merchant commercial roles, Merchant discovery/conversion thesis, packaging boundaries, and the relationship between current product surfaces.

---

## 1. Company Positioning

Canonical company-level positioning:

> **VisuTry is an AI eyewear decision and commerce platform for both consumers and merchants.**

Canonical North Star:

> **Help people make better eyewear decisions, and help merchants turn those decisions into measurable commerce outcomes.**

VisuTry has two first-class product faces:

```text
Consumer                         Merchant
Discovery → Decision             Discovery → Decision → Intent
```

Neither product face is subordinate to the other. They share eyewear decision intelligence, but they have different users, acquisition surfaces, commercial models, and success metrics.

The company should not be described globally as only a consumer try-on tool, only a merchant conversion product, or only merchant commerce infrastructure.

---

## 2. Consumer — Discovery → Decision

Consumer remains an independent product surface.

Its job is to help a person discover what suits them and make a better eyewear decision through:

- Face Analysis / Face Shape understanding;
- Recommendation / Glasses Advisor;
- Virtual Try-On;
- Compare;
- Consumer Search / SEO / AI discovery;
- Consumer traffic acquisition and product validation;
- Consumer payment and credits conversion.

Canonical Consumer decision path:

> **Face Analysis → Recommendation → Virtual Try-On → Compare**

Consumer may also create acquisition, product-proof, and intent-learning benefits for VisuTry as a company, but it must not be defined merely as a feeder funnel for Merchant.

Consumer commercial logic remains episodic and decision-oriented:

- free / low-friction discovery where appropriate;
- one-time report or guidance value where appropriate;
- credits for generated try-on / comparison usage;
- subscriptions remain secondary unless repeated-use evidence supports them.

Consumer SEO and AI discovery are valid independent growth engines and are measured as Consumer performance.

---

## 3. Merchant — Discovery → Decision → Intent

Canonical Merchant value statement:

> **VisuTry helps eyewear merchants become more discoverable across search and AI, and turns that discovery into measurable shopper intent.**

The wording **more discoverable** is deliberate. VisuTry can improve machine-understandability, public discovery surfaces, distribution readiness, and measurement. It does not control third-party ranking or recommendation systems.

Merchant is not only about converting traffic a merchant already has. It should support two value creation paths:

1. **Discovery opportunity** — create machine-understandable merchant/product surfaces that can be found across Search and AI when public and relevant.
2. **Decision and conversion** — turn a discovered shopper into recommendation, try-on, compare, and measurable commercial intent.

Merchant measurement chain:

```text
Search / AI Discovery
→ MerchantSession
→ Product Decision
→ Recommendation / Try-On / Compare
→ Intent
```

The commercial object is not image generation by itself. It is a measurable decision journey tied to a merchant catalog and a merchant outcome.

---

## 4. Merchant Discovery Engine

**Merchant Discovery Engine** is the umbrella capability name for the discovery-to-intent layer inside the existing Merchant / Store / Campaign / Agent-ready Commerce architecture.

It is **not** a new standalone product line and must not create a second merchant strategy.

The capability set is:

| Capability | Role |
| --- | --- |
| **Merchant Discovery Surface** | Public merchant, product, and selected intent/campaign surfaces that Search and AI can discover when publication policy allows. |
| **Commerce Graph** | Machine-understandable merchant, brand, product, offer, frame, price, availability, attribute, and destination relationships. |
| **Discovery Distribution** | Sitemap, structured data, indexing/distribution integrations, feeds, and other supported mechanisms that expose current public commerce facts. |
| **Decision Engine** | Face Analysis, Recommendation, Virtual Try-On, and Compare. |
| **Discovery Intelligence** | Measure index/referral/source → MerchantSession → product decision → decision actions → intent. |
| **Intent Handoff** | Product click, merchant-site handoff, inquiry, appointment, checkout destination, or another measurable commercial outcome. |

This extends the existing AI Commerce / Campaign Engine thesis:

> **Merchant Discovery & Conversion / Commerce Engine**

The Store/Campaign system remains the merchant product architecture. Merchant Discovery Engine makes the discovery and machine-understanding part explicit.

---

## 5. Canonical Merchant Product Objects

### 5.1 Store

> **Store = canonical merchant discovery & decision surface.**

Store is the merchant's long-lived public authority surface when published. It should provide stable merchant identity, catalog access, decision entry points, and merchant-level discovery context.

Store is not a disposable campaign page and is not a generic website-builder product.

### 5.2 Product Page

> **Product Page = canonical commerce entity.**

A Product Page represents one stable, independently understandable product/frame entity with a durable URL and explicit commerce facts where available.

It exists so consumers, Search, and AI systems do not have to infer a product only from a complex Store grid or transient campaign experience.

### 5.3 Campaign

> **Campaign = audience / intent-specific experience.**

Campaign publication policy can be:

- `PUBLIC_INDEX` — intentionally public and indexable when content quality and intent justify it;
- `UNLISTED` — accessible by link but not intended for search indexing;
- `PRIVATE` — restricted / non-public.

Not every Campaign is an SEO page. Paid-media, QR, email, agency/client, temporary promotion, and private validation Campaigns may remain unlisted or private.

### 5.4 Decision Engine

> **Decision Engine = Face Analysis / Recommendation / Try-On / Compare.**

The same underlying eyewear decision intelligence serves both Consumer and Merchant surfaces, with product-specific context and commercial rules.

### 5.5 Intent

> **Intent = measurable commercial outcome.**

Examples include product click, favorite/save, inquiry, appointment request, merchant-site handoff, checkout destination, or another explicitly modeled commerce outcome.

Intent is not the same as a page view or raw engagement event.

---

## 6. Shared Intelligence, Separate Product Faces

Consumer and Merchant share a common **Eyewear Decision Intelligence** foundation:

```text
Face Understanding
+ Frame / Product Understanding
+ Recommendation
+ Try-On
+ Compare
```

But they remain separate product surfaces.

| Dimension | Consumer | Merchant |
| --- | --- | --- |
| Primary user | Individual shopper | Eyewear merchant / brand / agency and its shoppers |
| Core journey | Discovery → Decision | Discovery → Decision → Intent |
| Discovery goal | Help the individual find useful eyewear guidance | Help merchant commerce entities become more discoverable and convert discovered shoppers |
| Payment model | Credits / one-time / optional subscription | Merchant plan / usage / campaigns / future expansion |
| Measurement authority | Consumer acquisition + product + payment funnel | MerchantSession / MerchantEvent / MerchantIntent and merchant-scoped commerce analytics |
| Product status | First-class product face | First-class product face |

Consumer traffic can produce strategic learning, but Consumer traffic is not automatically Merchant traffic and cannot be counted as Merchant commercial proof.

---

## 7. Agent-Ready Commerce Alignment

Merchant Discovery Engine strengthens, rather than replaces, the existing Agent-ready Commerce direction.

The agent-ready model remains:

- **Discoverable** — public merchant/product surfaces can be found when intended to be public;
- **Understandable** — stable facts and relationships are machine-readable;
- **Actionable** — agents can route users into supported product/decision experiences and, where supported, use existing MCP/Skill capabilities;
- **Measurable** — agent-originated discovery can be attributed through MerchantSession, decision behavior, and Intent.

Existing Merchant Workspace, Agent Keys, MCP/OAuth, Store/Campaign operations, and Commerce Intelligence remain part of the same architecture. No second agent stack or duplicate commerce model should be created.

---

## 8. Commercial and Claim Boundaries

VisuTry can credibly promise that it will work to:

- make merchant and product information easier for Search and AI systems to understand;
- provide machine-understandable product structure and stable commerce entities;
- provide public discovery surfaces when the merchant chooses public publication;
- provide supported distribution capabilities;
- measure referral → MerchantSession → decision → Intent;
- connect discovery to the existing eyewear Decision Engine.

VisuTry must **not** promise or imply guaranteed third-party outcomes such as:

- Google ranking position;
- guaranteed ChatGPT citation;
- guaranteed Gemini or Perplexity recommendation;
- guaranteed inclusion by any search/AI platform;
- fixed traffic volume;
- fixed conversion uplift or revenue unless independently proven for a specific merchant and period.

Preferred language is **more discoverable**, **discovery opportunity**, **machine-understandable**, **distribution-ready**, and **measurable** — not guaranteed ranking or recommendation.

---

## 9. Commercial Model

### Consumer

Consumer remains a standalone growth and monetization surface:

- free discovery / activation;
- one-time report or advisor value;
- credits-based Try-On / Compare;
- optional heavy-user subscription;
- SEO, visual discovery, and AI discovery as independent acquisition channels.

### Merchant

Merchant is the primary recurring B2B revenue surface to validate:

- canonical Store;
- Product Pages / commerce entities;
- Campaign experiences;
- Decision Engine;
- discovery/source attribution;
- Merchant Discovery Engine capabilities;
- measurable Intent and merchant analytics;
- Agent-ready Commerce operations.

Current packaging and usage entitlements are governed by `docs/commercial-entitlements-v1.md`; this strategy document does not duplicate those detailed limits.

### Studio / professional workflow

Studio remains a possible adjacent professional workflow for stylists, consultants, and opticians. It is not a third company-level product face and should not displace the current Consumer + Merchant model without new evidence.

---

## 10. Strategic Priorities

1. **Keep Consumer first-class.** Continue Consumer Discovery → Decision growth, reliability, product validation, and payment learning.
2. **Prove Merchant discovery, not just Merchant conversion.** The immediate Merchant question is whether Store/Product/Campaign surfaces can become independently discoverable and then generate MerchantSession → Decision → Intent evidence.
3. **Use existing Store / Campaign / Agent-ready Commerce.** Do not create a new Merchant product line to implement Merchant Discovery Engine.
4. **Prefer canonical entities over page volume.** Stable Store and Product entities matter more than generating large quantities of thin Campaign pages.
5. **Measure outcomes by product face.** Consumer SEO/AI success and Merchant discovery proof use separate measurement authorities.
6. **Expand integration only after proof.** Shopify, CRM, generic Campaign Builder, broad public APIs, and heavier integrations remain evidence-gated.

---

## 11. Relationship to Current Authorities

| Scope | Authority |
| --- | --- |
| Commercial direction | `docs/strategy/commercial-strategy.md` |
| Cross-product boundaries | `docs/product/product-system.md` |
| Current execution priority | `docs/product/product-plan.md` |
| Consumer GTM execution | `docs/strategy/analytics/gtm.md` |
| Merchant / Store detailed behavior | current product specs and plans under `docs/product/` |
| Agent-native merchant operations | `docs/product/plans/agent-native-merchant-self-service.md` |
| Observability / analytics data-plane ownership | `docs/project/observability-and-analytics-contract.md` |
| Architecture reality | `docs/project/architecture.md` + accepted ADRs |

Foundation / sales material should follow these authorities and use the same Consumer + Merchant model. Merchant Discovery Engine is a capability grouping inside the existing Merchant architecture, not a parallel strategy document family.

---

## 12. Strategic Summary

Company:

> **VisuTry is an AI eyewear decision and commerce platform for both consumers and merchants.**

North Star:

> **Help people make better eyewear decisions, and help merchants turn those decisions into measurable commerce outcomes.**

Consumer:

> **Discovery → Decision**

Merchant:

> **Discovery → Decision → Intent**

Merchant value statement:

> **VisuTry helps eyewear merchants become more discoverable across search and AI, and turns that discovery into measurable shopper intent.**

The strategic shift is an extension of the existing Store / Campaign / Agent-ready Commerce strategy: VisuTry should not only improve conversion on traffic a merchant already owns; it should also create credible new Search / AI discovery opportunities and measure what those discovered shoppers do next.

---

## 13. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created unified commercial strategy and product-layer model. |
| 2026-08-06 | Reframed Store from merchant storefront/workspace to AI Commerce / Campaign Engine and added human + AI-agent traffic strategy. |
| 2026-09-13 | Upgraded company positioning to a first-class Consumer + Merchant model; defined Merchant Discovery Engine, canonical Store/Product/Campaign objects, Discovery → Decision → Intent measurement, and explicit third-party discovery claim boundaries. |