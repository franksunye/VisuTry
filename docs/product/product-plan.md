# VisuTry Product Plan

**Status:** Active source of truth for product execution  
**Created:** 2026-07-08  
**Last updated:** 2026-09-13  
**Owner:** Product  
**Review cadence:** Weekly  
**Scope:** Current product focus, Consumer continuity, Merchant proof priorities, Now / Next / Later sequencing, and explicit non-priorities.

---

## 1. Purpose

This document defines what VisuTry should build, polish, measure, or validate next.

It translates the commercial strategy into execution priority. If a feature is not in this plan or an approved bounded product spec, it should not be treated as current product priority.

This update does **not** create a new Merchant product line. It narrows current Merchant work around discovery proof using the Store / Campaign / Agent-ready Commerce capabilities that already exist.

Related decision: `docs/decisions/ADR-003-product-plan-execution-source-of-truth.md`.

---

## 2. Product North Star

Canonical company positioning:

> **VisuTry is an AI eyewear decision and commerce platform for both consumers and merchants.**

Canonical North Star:

> **Help people make better eyewear decisions, and help merchants turn those decisions into measurable commerce outcomes.**

Two first-class product faces:

```text
Consumer: Discovery → Decision
Merchant: Discovery → Decision → Intent
```

Consumer remains an independent product surface. Merchant strategy must not weaken Consumer traffic, decision quality, payment, or product-validation work.

---

## 3. Current Product Model

### Consumer

Consumer path:

> **Face Analysis → Recommendation → Virtual Try-On → Compare**

Consumer responsibilities remain:

- SEO / Search / AI discovery;
- Face Analysis and recommendation;
- Try-On / Compare;
- Consumer product validation;
- Consumer payment / credits;
- Consumer analytics and traffic growth.

### Merchant

Merchant value statement:

> **VisuTry helps eyewear merchants become more discoverable across search and AI, and turns that discovery into measurable shopper intent.**

Merchant path:

> **Search / AI Discovery → MerchantSession → Product Decision → Recommendation / Try-On / Compare → Intent**

Merchant Discovery Engine is an internal capability grouping inside the existing Merchant / Store / Campaign / Agent-ready Commerce architecture. It is not a separate product family.

---

## 4. Current Product Focus

The immediate execution posture is intentionally narrow:

1. **Keep Consumer stable and first-class.** Consumer reliability, SEO/AI discovery, product funnel, payments, and current growth work continue independently.
2. **Run one Merchant Discovery Proof Sprint.** Use the existing `visutry-demo` Reference Implementation to prove that a merchant commerce surface can be independently discovered by Search / AI and produce merchant-scoped downstream evidence.
3. **Do not expand Merchant surface area yet.** No generalized Campaign Builder, CRM, Shopify public app, broad merchant UI expansion, or new product line until the proof sequence produces evidence.
4. **Use existing architecture.** Store, Campaign, Product/catalog, MerchantSession/Event/Intent, Commerce Intelligence, Merchant Workspace, MCP/OAuth, and Agent-ready Commerce remain the foundation.
5. **Preserve current architecture/observability authorities.** This sprint does not change DB/schema, observability contracts, data-plane ownership, or held migration/event-plane work.

---

## 5. Current Merchant Bottleneck

The Merchant question has changed.

The earlier question was:

> Do we have AI traffic at all?

The current evidence says yes at the company/Consumer level.

Current 14-day AI Agent Consumer traffic checkpoint:

| Source | Sessions |
| --- | ---: |
| ChatGPT | 53 |
| Gemini | 3 |
| Perplexity | 1 |
| **Total** | **57** |

At the same time:

> **Direct effective Store/Campaign sessions remain 0.**

This means the current bottleneck is no longer the existence of AI discovery demand. It is:

> **How do Merchant Store / Product / selected Campaign surfaces become genuine, independently discoverable public commerce entries that can turn Search / AI discovery into MerchantSession → Decision → Intent?**

Important boundary:

- the 57 AI Agent sessions are useful Consumer/company-level discovery evidence;
- they are **not** Merchant traffic proof;
- Merchant proof begins only when traffic lands in a merchant-scoped Store/Product/Campaign context and is observed through merchant-scoped measurement.

---

## 6. Now / Next / Later

### Now

| Priority | Workstream | Why it matters | Status |
| --- | --- | --- | --- |
| P0 | Consumer production stability | Merchant work must not regress Face Analysis, Credits, Try-On, Compare, payment, protected media, SEO/AI acquisition, or Consumer traffic growth. | Continuous |
| P0 | **Merchant Discovery Proof Sprint** | Prove a real Search/AI → merchant surface → MerchantSession → Decision → Intent chain using `visutry-demo`. | Current focus |
| P0 | Merchant positioning/docs alignment | Strategy, product boundaries, GTM boundaries, and Merchant object definitions must agree before implementation expansion. | This update |
| P1 | Existing Agent-ready Merchant operations | Maintain Merchant Workspace, Agent Keys, MCP/OAuth, Store/Campaign operations, and Commerce Intelligence as the operating layer. | Implemented / bounded hardening only |
| P1 | Existing Product Advantage evidence | Keep prior gate evidence as supporting constraints/evidence; do not treat it as a reason to create a parallel product strategy. | Supporting |

### Next — only after discovery proof

| Priority | Workstream | Entry condition |
| --- | --- | --- |
| P1 | First real Merchant discovery validation | `visutry-demo` produces credible public discovery + merchant-scoped journey evidence |
| P1 | Merchant catalog + declared source pilot | A real merchant is ready to route a representative catalog and an explicit acquisition source |
| P1 | Distribution integration selection | Evidence identifies which search/AI distribution mechanism materially improves discoverability or freshness |
| P1 | Merchant product-page / intent-page refinement | Real discovery evidence shows which canonical entity or intent surface needs improvement |

### Later / evidence-gated

- generalized Campaign Builder;
- large Merchant Admin/UI expansion;
- CRM / marketing automation;
- Shopify public app;
- WooCommerce plugin;
- generic public API;
- broad autonomous agent actions / checkout;
- EHR/PMS integration;
- full inventory ERP behavior;
- multi-brand/agency organization expansion;
- advanced revenue attribution requiring unavailable commerce data;
- large-scale programmatic Merchant SEO.

---

## 7. Current Sprint — Merchant Discovery Proof Sprint

**Sprint name:** Merchant Discovery Proof Sprint  
**Started:** 2026-09-13  
**Reference implementation:** `visutry-demo`  
**Product scope:** Merchant / Store / Product / selected Campaign discovery and measurement only  
**Code scope for this documentation change:** none; this commit updates planning/positioning docs only.

### Objective

Prove the smallest complete Merchant chain:

```text
Search / AI
→ Merchant Store / Product / PUBLIC_INDEX Campaign
→ MerchantSession
→ Product Decision
→ Recommendation / Try-On / Compare
→ Intent
```

The sprint is about **proof**, not product breadth.

### What must be true

1. **Merchant Discovery Surface is real**  
   `visutry-demo` exposes a canonical public Store and stable merchant commerce entities suitable for discovery.

2. **Product entities are understandable**  
   Product/frame facts are stable and machine-understandable; product identity does not depend on an opaque SPA grid.

3. **Campaign publication is explicit**  
   Campaigns distinguish `PUBLIC_INDEX`, `UNLISTED`, and `PRIVATE`; only high-quality intent surfaces belong in public indexing.

4. **Distribution is intentional**  
   Public merchant entities are reachable through the supported discovery/distribution mechanisms appropriate to the implementation.

5. **Merchant measurement is separate**  
   A discovered visit can be traced through MerchantSession and merchant-scoped decision/Intent data without borrowing Consumer traffic as proof.

6. **Decision Engine remains the differentiation**  
   Discovery must lead into Recommendation / Try-On / Compare rather than ending as generic SEO traffic.

### Sprint evidence

The proof package should answer:

- Can Google/Search discover the intended merchant surface?
- Can AI assistants/agents discover or refer to the intended merchant surface?
- Which Store/Product/Campaign URL was the entry point?
- Was a `MerchantSession` created?
- Did the shopper view/select a product or start a decision flow?
- Did Recommendation / Try-On / Compare occur?
- Was an `Intent` recorded?
- Which source/referrer produced the journey?

The sprint does not require a traffic-volume target. A small number of genuine, attributable journeys is more valuable than a large amount of ambiguous Consumer/referral traffic.

---

## 8. Canonical Merchant Objects for Execution

### Store

> **Canonical merchant discovery & decision surface.**

Use Store as the merchant's long-lived authority/entry surface, not as a disposable campaign container.

### Product Page

> **Canonical commerce entity.**

Each product/frame should be independently stable and machine-understandable where the current product implementation supports that surface.

### Campaign

> **Audience / intent-specific experience.**

Publication modes:

- `PUBLIC_INDEX`;
- `UNLISTED`;
- `PRIVATE`.

Do not turn every Campaign into an SEO page.

### Decision Engine

> **Face Analysis / Recommendation / Try-On / Compare.**

Reuse the existing decision capabilities; do not create a second Merchant-specific decision stack.

### Intent

> **Measurable commercial outcome.**

Use the existing merchant intent model and only add/alter intent semantics through the proper product/analytics contract process.

---

## 9. Merchant Discovery Engine Scope

The sprint uses the following capability model:

| Capability | Sprint question |
| --- | --- |
| Merchant Discovery Surface | Is there a stable public merchant/product/intent entry that Search/AI can discover? |
| Commerce Graph | Can machines understand merchant, product, frame, offer/destination relationships? |
| Discovery Distribution | Are public entities exposed through the supported indexing/feed/distribution path? |
| Decision Engine | Does discovery continue into eyewear decision assistance? |
| Discovery Intelligence | Can source/referral be connected to MerchantSession and downstream behavior? |
| Intent Handoff | Does the journey end in a measurable merchant outcome? |

This is existing Merchant architecture made more explicit, not a new platform layer.

---

## 10. Consumer Work Continues Independently

The Merchant sprint does not replace the active Consumer growth strategy in `docs/strategy/analytics/gtm.md`.

Consumer continues to optimize:

- qualified Search traffic;
- AI discovery;
- visual discovery;
- Face Analysis activation;
- Advisor / Try-On / Compare continuation;
- Credits/payment conversion;
- Consumer reliability and capacity.

Consumer success metrics stay Consumer metrics. They can inform Merchant strategy but do not satisfy Merchant proof gates.

---

## 11. Commercial Claim Guardrails

Merchant product work may support claims that VisuTry:

- helps products become easier for Search/AI to understand;
- creates public discovery surfaces;
- provides machine-understandable commerce structure;
- provides supported distribution capability;
- measures referral → MerchantSession → decision → Intent.

Do not claim or design success criteria around guaranteed:

- Google rankings;
- ChatGPT citations;
- Gemini/Perplexity recommendations;
- fixed discovery traffic;
- fixed conversion/revenue uplift.

Use **more discoverable** and **discovery opportunity**, not guaranteed visibility.

---

## 12. Execution Board

| Priority | Initiative | Owner | Status | Next action |
| --- | --- | --- | --- | --- |
| P0 | Consumer stability boundary | Engineering / Product | Continuous | Keep Consumer critical paths and payments stable during Merchant work |
| P0 | Merchant Discovery Reference (`visutry-demo`) | Product / Engineering / Growth | Current | Establish/verify discovery → MerchantSession → decision → Intent evidence |
| P0 | Merchant measurement boundary | Product / Analytics | Current | Use MerchantSession / MerchantEvent / MerchantIntent as proof authority; do not count Consumer traffic |
| P1 | Discovery distribution evidence | Growth / Engineering | Evidence-gated | Verify supported search/AI discovery mechanisms and observed referrals |
| P1 | Agent-ready Merchant operations | Engineering | Implemented / bounded hardening | Keep existing MCP/OAuth/Workspace capabilities aligned; no new agent stack |
| P2 | Merchant expansion features | Product / Engineering | Deferred | Reopen only after discovery proof identifies a real bottleneck |

---

## 13. Relationship to Existing Gates and Plans

The following remain useful and are not deleted by this sprint:

- Product Advantage Gate evidence and audits;
- Store / Campaign product specs;
- Merchant activation and commercial entitlement docs;
- Agent-native Merchant Self-Service plan;
- Universal Agent Access evidence;
- Pilot/Reference delivery evidence;
- current architecture and observability authorities.

Precedence for current execution:

1. `docs/strategy/commercial-strategy.md` — company/commercial direction.
2. `docs/product/product-system.md` — Consumer/Merchant boundaries and canonical product objects.
3. `docs/product/product-plan.md` — current execution priority.
4. relevant bounded product specs / plans — implementation behavior.
5. dated audits / ops records — evidence only.

No new long-lived Merchant strategy document is required for this positioning upgrade.

---

## 14. Exit Condition

The Merchant Discovery Proof Sprint exits when we can make a defensible evidence-based statement that:

> At least one intended `visutry-demo` Merchant discovery surface is independently discoverable through Search and/or AI, and at least one genuine discovery/referral journey can be attributed through the Merchant data plane into a meaningful product decision or Intent.

If public discovery remains zero, the next decision should focus on why the merchant surface is not selected/discovered — not on adding unrelated Merchant features.

If discovery occurs but Decision/Intent remains zero, the next decision should focus on the merchant landing/decision experience — not on generating more discovery pages by default.

---

## 15. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created product plan and execution board. |
| 2026-08-06 | Reframed Store around AI Commerce / Campaign Engine value and Agent-ready Commerce. |
| 2026-08-24 | Reconciled Product Advantage Gate, Business Website, Merchant Workspace, MCP/OAuth, Commerce Intelligence, and post-outreach Merchant validation sequencing. |
| 2026-09-13 | Replaced broad Merchant expansion priority with the Merchant Discovery Proof Sprint; established `visutry-demo` as the reference implementation, formalized Search/AI → MerchantSession → Decision → Intent proof, preserved Consumer as a first-class product, and deferred Merchant UI/CRM/Shopify/generalized Campaign Builder expansion. |