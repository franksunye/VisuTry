# VisuTry Product Plan

**Status:** Active source of truth for product execution
**Created:** 2026-07-08
**Last updated:** 2026-09-23
**Owner:** Product
**Review cadence:** Weekly
**Scope:** Current product focus, Now / Next / Later priorities, execution posture, standing initiatives, decisions needed, and execution board.

---

## 1. Purpose

This document defines what VisuTry should build, polish, measure, or validate next.

It translates the commercial strategy into product execution priorities. Strategy explains why VisuTry should move toward an eyewear decision and commerce platform. This product plan defines the current sequence of product work.

Working rule:

> If a feature is not in this plan or an approved product spec, it should not be treated as current product priority.

Related decision: `docs/decisions/ADR-003-product-plan-execution-source-of-truth.md`.

---

## 2. Source Documents

This plan is derived from:

| Document | How it informs this plan |
| --- | --- |
| `docs/strategy/commercial-strategy.md` | Defines the top-level commercial direction, including Store as an AI Commerce / Campaign Engine. |
| `docs/strategy/commercial-benchmarks.md` | Provides external references such as Optify, OGI / The Optical Foundry, VTO infrastructure vendors, and DTC eyewear retailers. |
| `docs/strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md` | Defines the public consumer product path and SEO/GEO page architecture. |
| `docs/strategy/2026-05-25-b2b-commerce-commercialization-roadmap.md` | Defines B2B merchant/widget roadmap and pilot logic. |
| `docs/project/seo-backlog.md` | Tracks current SEO/Growth tasks and external acquisition sprint. |
| `docs/decisions/ADR-004-frame-compare-core-implemented.md` | Confirms Frame Compare core is implemented and next work is productization. |
| `docs/decisions/ADR-007-store-consumer-stability-boundary.md` | Protects stable Consumer behavior while Store evolves. |
| `docs/product/specs/visutry-store-landing-page.md` | Defines the first Store market validation asset before full Store engineering. |
| `docs/product/specs/visutry-store-engineering-foundation.md` | Defines the mandatory Store architecture, tenancy, usage, privacy, idempotency, and test constraints. |
| `docs/product/specs/visutry-store-sales-demo.md` | Defines the implemented D0 merchant demo workflow and acceptance criteria. |
| `docs/product/plans/visutry-store-implementation-plan.md` | Defines current Store gates, completed D0 slices, merchant validation, and M1 sequencing. |
| `docs/ops/store-d0-production-verification-2026-08-05.md` | Records the production D0 evidence baseline and remaining Gate A1 work. |
| `docs/product/plans/pilot-delivery-factory-plan.md` | Defines the completed five-brand Reference delivery contract and repeatability targets. |
| `docs/product/plans/market-facing-productization-plan.md` | Historical productization sequence; retained as supporting evidence and does not define the current execution phase. |
| `docs/product/business-website-ia-and-copy.md` | Defines current Business Website product truth, claims, Pilot and CTA baseline. |
| `docs/product/plans/agent-native-merchant-self-service.md` | Historical Agent-native implementation plan; retained for architecture/tooling history. |
| `docs/product/specs/merchant-operating-experience.md` | Defines the current human Merchant operating IA, lifecycle semantics, workspace-mode boundary, and Human/Agent responsibility model. |
| `docs/product/plans/universal-agent-access.md` | Records production OAuth/MCP evidence and the remaining external-Pilot hardening boundary. |
| `docs/product/sales/visutry-sales-readiness-audit-2026-08-12.md` | Defines the controlled founder-led outreach and evidence loop that may begin only after the Product Advantage Gate passes. |

---

## 3. Product North Star

Company-level positioning:

> **VisuTry is an AI eyewear decision and commerce platform for both consumers and merchants.**

North Star:

> **Help people make better eyewear decisions, and help merchants turn those decisions into measurable commerce outcomes.**

Current product faces:

```text
Consumer: Discovery → Decision
Merchant: Discovery → Decision → Intent
```

The Consumer decision path remains independently valuable:

> Face Shape / Face Analysis → Recommendation / Glasses Advisor → Virtual Try-On → Compare

The Merchant commerce path builds on the same decision capabilities:

> Merchant Catalog → Store / Campaign → shopper Recommendation / Try-On / Compare → measurable Intent → Merchant Analytics

The hosted Storefront is one delivery surface of the Merchant product. Campaigns, Commerce Intelligence, and Agent-operable capabilities extend the same commerce system without reducing VisuTry to a generic storefront or weakening the standalone Consumer product.

---

## 4. Current Product Focus

VisuTry now operates as two connected product faces:

- **Consumer — Discovery → Decision:** Face Analysis, recommendation, Virtual Try-On, Compare, Consumer traffic/SEO/AI discovery, and Consumer payment/product validation.
- **Merchant — Discovery → Decision → Intent:** Catalog, Store, Campaigns, Analytics, Integrations/Agent access, Plan & Usage, Settings, and measurable shopper decision/intent.

P1-M2 Merchant Operating Experience is **Product / UX / Production Accepted / Closed** at main SHA `3c29d56cce1c380bef42c3f9e99dd25f95ac8724`. The current durable Merchant UX contract is `docs/product/specs/merchant-operating-experience.md`.

**Current authorized phase:** P1-M3 Merchant Live Experience, GitHub Issue #235 — “business is happening.” Scope is a compact, truthful Live Commerce Pulse on Operating Home using existing session/event/intent records. This is an 80/20 read/presentation upgrade, not a realtime-platform expansion; no new activity instrumentation, schema, polling of period Analytics, or Production mutation is in scope.

Current execution posture:

1. Preserve Consumer production stability and paid/product flows as a standing P0 guardrail.
2. Treat the shipped Merchant Operating Experience as the B2B baseline; do not restart shell/Control-Center redesign work without new evidence.
3. Observe the Production baseline and close only real defects/regressions.
4. Keep existing evidence-gated commercial/distribution work as supporting validation; do not infer a new build phase from older dated gate documents.
5. Keep P1-M3 bounded to the explicitly approved Live Commerce Pulse; select any later gate explicitly before further feature development.
6. Keep Shopify, CRM/marketing automation, generalized Campaign Builder, verified revenue attribution, and similar expansion evidence-gated.

P1-M2 remains the closed historical/product baseline; P1-M3 is the only currently authorized implementation gate.

## 5. Execution Status Definitions

| Status | Meaning |
| --- | --- |
| Backlog | Useful idea, not ready for execution. |
| Ready | Ready to start product or engineering work. |
| In Progress | Currently being worked on. |
| Review | Built or drafted; needs review before close. |
| Shipped | Released or completed. |
| Measuring | Released; needs data review. |
| Partially implemented | Important foundation exists, but conversion UX, analytics, or acceptance criteria remain incomplete. |
| Implemented core | Core feature exists; remaining work is polish, exposure, measurement, or enhancement. |
| Ready for validation | Clear enough to pitch, demo, or test with target users, but not yet ready for full engineering build. |
| Deferred | Intentionally not current priority. |

---

## 6. Now / Next / Later

### Now

| Priority | Workstream | Why it matters | Status |
| --- | --- | --- | --- |
| P0 | Consumer production stability | Merchant work must not regress Face Analysis, Credits, Try-On, Compare, payment, or protected-media behavior. | Shipped / continuously guarded |
| P0 | Merchant Operating baseline | Keep the Production-accepted Home/Catalog/Store/Campaigns/Analytics/Integrations/Plan/Settings baseline stable and truthful. | Production Accepted / Closed |
| P1 | Merchant Live Experience (Issue #235) | Make real current commerce activity legible on Home without noisy or costly realtime infrastructure. | In Progress; Local only |
| P1 | Production observation and defect response | New work should be triggered by evidence, not by reopening completed M2 implementation. | Active operating posture |

### Next — candidate gates, not yet authorized after P1-M3

| Priority | Candidate | Entry condition |
| --- | --- | --- |
| P1 | First real merchant validation / controlled outreach | Only when the governing commercial/distribution evidence and operating readiness support it. |
| P1 | OAuth / external Agent hardening | When an external Agent-enabled pilot requires it; preserve shared canonical capabilities and approval boundaries. |
| P1 | Merchant conversion/lead capability | Only when a legitimate opt-in/merchant demand exists; do not invent revenue proof. |
| P2 | Additional Merchant UX polish | Only from observed usability evidence; do not reopen the resource IA by default. |

### Later / explicitly evidence-gated

- generalized Campaign Builder / marketing automation;
- Shopify public app and WooCommerce plugin;
- CRM/CDP replacement;
- order ingestion and verified revenue attribution;
- broad public API expansion;
- autonomous checkout;
- medical-grade measurement claims;
- large-scale programmatic SEO without distinct intent/value.

## 7. Current execution posture

**Previous sprint:** 2B Product Advantage Gate Readiness (historical August execution context).

**Current state:** stabilization / observation after P1-M2 Product + UX + Production acceptance.

**Exit condition for this posture:** Product/Lead explicitly opens the next bounded gate with a defined user/business objective, acceptance criteria, and evidence boundary.

The active Merchant baseline is:

```text
Activation:
first product → Catalog ready → Store draft → private Store Preview (First Value)

Operating:
Home | Catalog | Store | Campaigns | Analytics
More: Integrations | Plan & Usage | Settings
```

Workspace Operating eligibility is a runtime compatibility decision, not a rewritten activation milestone: Preview event OR Publish event OR actual ACTIVE Store enters Operating Mode; activation history is never synthesized for routing.

## 8. Execution Board

| Priority | Initiative | Owner | Status | Next action |
| --- | --- | --- | --- | --- |
| P0 | Consumer stability boundary | Engineering | Shipped / guarded | Keep Consumer critical and revenue gates green. |
| P0 | P1-M2 Merchant Operating Experience | Product / Engineering | **Production Accepted / Closed** | Observe; open a new narrow gate only for a real regression or new product phase. |
| P1 | Merchant Production observation | Product / Engineering | Active | Watch runtime/product evidence; do not mutate Production for QA without explicit bounded approval. |
| P1 | Next product gate | Product | Not authorized | Select explicitly from current evidence; do not inherit an August sprint by default. |
| P1 | Real merchant validation / outreach | Product / Growth | Evidence-gated | Follow its governing current commercial/gate documents when explicitly activated. |
| P1 | External Agent/OAuth hardening | Engineering | Conditional | Execute only if included in an approved pilot promise. |
| P2 | CRM / Shopify / revenue attribution / generalized martech | Product / Engineering | Deferred | Require repeated merchant demand and trustworthy commerce evidence. |

## 9. Standing product initiatives

These are durable capability areas, not authorization to start a new phase. Current sequencing is governed by Sections 6–8.

### Consumer decision experience

**Purpose:** Keep Face Analysis / recommendation / Virtual Try-On / Compare useful, understandable, measurable, and commercially viable for standalone Consumer users.

**Current posture:** Shipped product surface; preserve stability and improve only from observed funnel/product evidence.

### Consumer monetization

**Purpose:** Maintain clear one-time / credits-based paid continuation for high-intent decision users without forcing a subscription-first story.

**Current posture:** Production product; pricing/checkout changes remain evidence-driven and revenue-safety gated.

### Merchant acquisition and validation

**Purpose:** Explain the Merchant value proposition truthfully, capture qualified interest, and validate whether real merchants/brands/agencies will route catalog and traffic through VisuTry.

**Current posture:** Evidence-gated. Do not represent VisuTry-owned/reference evidence as external customer proof.

### Merchant Operating Experience

**Purpose:** Provide a compact self-service human operating surface for Catalog, Store, Campaigns, Analytics, Integrations, Plan & Usage, and Settings.

**Current posture:** **Product / UX / Production Accepted / Closed.** Use `docs/product/specs/merchant-operating-experience.md` for current behavior. Reopen only for observed defects or a separately authorized new gate.

### Agent-operable commerce

**Purpose:** Let authorized external agents use the same canonical Merchant/Commerce capabilities without DOM automation or duplicated business rules.

**Current posture:** Core MCP/OAuth capability exists; additional external-client/Pilot hardening is conditional on an approved use case. Consequential actions remain approval-bounded.

### Commerce expansion

**Purpose:** Extend from measurable shopper intent toward integrations, verified conversion, and broader distribution only when trustworthy demand/data exists.

**Current posture:** Deferred/evidence-gated for Shopify/WooCommerce, CRM/CDP, generalized martech, order ingestion, verified revenue attribution, autonomous checkout, and broad public API expansion.

---

## 10. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created product plan and execution board. |
| 2026-07-08 | Updated Frame Compare and Credits Pack status after implementation review. |
| 2026-07-08 | Added Store landing page as first Store market validation step before full MVP engineering. |
| 2026-08-05 | Promoted Store D0 to production-verified controlled validation; moved the next action to merchant demos and kept Gate A1 / M1 gated. |
| 2026-08-06 | Reframed Store execution around AI Commerce / Campaign Engine value, kept Storefront as the first delivery surface, added campaign/source attribution and Agent-Ready Commerce as future-facing product baselines without moving generalized campaign builder or public agent API into current scope. |
| 2026-08-24 | Reconciled the execution plan with the shipped Experience Factory, Discover, Business Website v1.2, Sponsored Usage, Merchant Workspace, MCP/OAuth, and Commerce Intelligence capabilities; moved the active gate to current Product Advantage Gate A/B/C evidence. |
| 2026-08-24 | Corrected the sequence: Reference / simulation / controlled-fixture proof can unlock Outreach Ready; First Real Merchant catalog, traffic, intent, and continuation/pricing evidence are the separate post-outreach Merchant Validation gate. |
| 2026-08-24 | Implemented durable, attributable Founding Merchant Pilot intake with privacy-preserving rate limits, idempotent submission, and an admin follow-up/outcome board; deployment and production verification remain. |
| 2026-08-24 | Activated the Product Advantage Gate A/B/C as the pre-outreach execution rule; structured merchant outreach is gated until current evidence passes all three gates. |
| 2026-08-24 | Deployed the Pilot intake migration and application through PR #128; production Business browser checks passed and request `625a1055-ffb0-4ed4-b14a-a7ca6e686c91` verified durable public submission and idempotent replay. |
| 2026-09-23 | Rebased active execution on the P1-M2 Production-accepted Merchant Operating baseline, restored the Consumer + Merchant company North Star, removed the August sprint as the current phase, and made next-phase selection explicit. |
| 2026-09-23 | Authorized P1-M3 Merchant Live Experience through Issue #235: a bounded real-activity Pulse on Operating Home, with no simulated events or realtime-platform expansion. |
