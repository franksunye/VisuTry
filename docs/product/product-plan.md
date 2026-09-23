# VisuTry Product Plan

**Status:** Active source of truth for product execution
**Created:** 2026-07-08
**Last updated:** 2026-09-23
**Owner:** Product
**Review cadence:** Weekly
**Scope:** Current product focus, Now / Next / Later priorities, current sprint, product initiatives, backlog, decisions needed, and execution board.

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
| `docs/product/plans/market-facing-productization-plan.md` | Historical productization sequence; current pre-outreach execution is governed by `docs/product/plans/product-advantage-gate.md`. |
| `docs/product/business-website-ia-and-copy.md` | Defines current Business Website product truth, claims, Pilot and CTA baseline. |
| `docs/product/plans/agent-native-merchant-self-service.md` | Historical Agent-native implementation plan; retained for architecture/tooling history. |
| `docs/product/specs/merchant-operating-experience.md` | Defines the current human Merchant operating IA, lifecycle semantics, workspace-mode boundary, and Human/Agent responsibility model. |
| `docs/product/plans/universal-agent-access.md` | Records production OAuth/MCP evidence and the remaining external-Pilot hardening boundary. |
| `docs/product/sales/visutry-sales-readiness-audit-2026-08-12.md` | Defines the controlled founder-led outreach and evidence loop that may begin only after the Product Advantage Gate passes. |

---

## 3. Product North Star

VisuTry should become:

> **AI commerce infrastructure for eyewear: an intelligence and conversion layer that helps consumers choose frames and helps merchants turn both human and AI-agent traffic into measurable purchase intent and revenue.**

The standalone Consumer acquisition / decision path remains:

> Face Shape Detector → Glasses Advisor → Virtual Try-On → Frame Compare

The primary B2B shopper path for the active Product Advantage Gate is:

> Discovery / Agent Referral → Store or Campaign Landing → Product Exploration → Recommendation / Try-On / Compare → Product / Inquiry Intent

The future merchant path is:

> Traffic / campaign / agent referral → shopper intent → merchant catalog → AI recommendation → try-on → compare → product / inquiry intent → conversion analytics → merchant commerce system.

The hosted merchant Storefront is the first delivery surface. The larger product direction is the **AI Commerce / Campaign Engine**.

---

## 4. Current Product Focus

VisuTry now operates as two connected product faces:

- **Consumer — Discovery → Decision:** Face Analysis, recommendation, Virtual Try-On, Compare, Consumer traffic/SEO/AI discovery, and Consumer payment/product validation.
- **Merchant — Discovery → Decision → Intent:** Catalog, Store, Campaigns, Analytics, Integrations/Agent access, Plan & Usage, Settings, and measurable shopper decision/intent.

P1-M2 Merchant Operating Experience is **Product / UX / Production Accepted / Closed** at main SHA `3c29d56cce1c380bef42c3f9e99dd25f95ac8724`. The current durable Merchant UX contract is `docs/product/specs/merchant-operating-experience.md`.

Current execution posture:

1. Preserve Consumer production stability and paid/product flows as a standing P0 guardrail.
2. Treat the shipped Merchant Operating Experience as the B2B baseline; do not restart shell/Control-Center redesign work without new evidence.
3. Observe the Production baseline and close only real defects/regressions.
4. Keep existing evidence-gated commercial/distribution work as supporting validation; do not infer a new build phase from older dated gate documents.
5. Select the next product gate explicitly before starting new feature development.
6. Keep Shopify, CRM/marketing automation, generalized Campaign Builder, verified revenue attribution, and similar expansion evidence-gated.

**No new product phase has been authorized after P1-M2 closure.**

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
| P1 | Production observation and defect response | New work should be triggered by evidence, not by reopening completed M2 implementation. | Active operating posture |
| P1 | Product gate selection | Decide the next bounded product/business gate from current evidence before starting feature work. | Not yet authorized |

### Next — candidate gates, not yet authorized

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

## 9. Product Initiatives

> The initiatives below are retained as capability/product records. They do not override the current stabilization/observation posture or authorize a new phase. Current sequencing is governed by Sections 6–8 above.

### Initiative 1: Free Detector → Advisor → Try-On Conversion

**Goal:** Turn the free detector into a useful first result that naturally continues into glasses advice, try-on, and comparison.

**Why now:** The public product path already depends on Detector → Advisor → Try-On → Compare. This must be clear before paid and merchant workflows can scale.

**Current tasks:**

- Confirm Detector result page has clear continuation CTAs.
- Route face-shape result into Glasses Advisor where appropriate.
- Make Try-On and Compare paths visible after the first useful result.
- Track continuation events.

**Success criteria:**

- A user can get a free result without unnecessary friction.
- At least one next-step CTA is visible and relevant.
- Continuation rate can be measured.

### Initiative 2: Credits Pack Conversion Loop

**Goal:** Make Credits Pack the clearest casual paid product for high-intent try-on and comparison users.

**Current implementation:**

- Credits Pack pricing and Stripe checkout exist.
- Webhook updates purchased credits.
- Quota deduction happens after successful generation.
- Try-On and Compare have basic insufficient-credit routing.

**Current tasks:**

- Do not modify Checkout during the baseline observation window without an incident signal.
- Accumulate at least 14 days and 30–50 unique Checkout Sessions.
- Compare terminal completion for `face_analysis_report` and `pricing` separately.
- Reconcile GA Purchase, Payment rows, and Stripe Session status.
- Reopen generic Try-On / Compare merchandising only if evidence identifies it as the dominant constraint.

**Success criteria:**

- Users understand what is free and what consumes credits.
- Credits Pack is visible at the right high-intent moments.
- Credits conversion and paid usage can be measured.

### Initiative 3: Frame Compare Polish / Analytics / Exposure

**Goal:** Make the implemented Frame Compare core experience visible, measurable, and conversion-ready.

**Current implementation:**

- Standalone route exists: `/try-on/glasses/compare`.
- Public landing exists for anonymous users.
- Authenticated users can upload one photo and compare up to 4 preset frames.
- Compare respects available credits.
- Generation runs per frame and displays queued / processing / completed / failed states.
- Failed frames can be retried.
- Completed outputs save to Dashboard History.

**Current tasks:**

- Ensure Frame Compare is exposed from homepage and relevant product CTAs.
- Add or map dedicated compare analytics events.
- Add stronger post-completion Credits Pack CTA.
- Decide whether comparison-board sharing is required now or later.
- Decide whether uploaded/custom frames belong in this flow before Studio / Store.

**Success criteria:**

- Users can understand Compare as a separate decision-support feature.
- Compare is not hidden inside a deep carousel or history flow.
- Compare actions are measurable.
- Compare contributes to Credits Pack conversion.

### Initiative 4: Store Landing Page Market Validation

**Goal:** Measure demand through the shipped multi-page Business Website and route qualified prospects into the Founding Merchant Pilot.

**Current status:** Business Website v1.2 shipped / Measuring. The previous `/store` landing page is no longer the complete B2B narrative.

**Validation asset:** `docs/product/specs/visutry-store-landing-page.md`

**Current tasks:**

- Measure `/en/business` and `/en/business/pilot` qualified CTA behavior.
- Keep the current $149 / 30-day assisted Pilot terms and claims boundary consistent across Business, Sales, and operating documents.
- Measure the production Pilot request form and lead/outcome tracker; keep email only as an error fallback.
- Pair the Business Website with controlled merchant / agency outreach and tagged Reference Experience links.
- Continue to distinguish Reference Pilot / Simulation proof from live customer evidence.

**Success criteria:**

- Store page can explain the hosted recommendation / try-on / compare workflow clearly.
- The merchant understands that Storefront is a deployment surface, not the entire product category.
- Qualified visitors can request a sample link, pilot, or demo.
- Form submissions identify business type, website, frame count, and intent.
- Store validation has measurable CTA and lead events.

### Initiative 5: VisuTry Store — AI Commerce / Campaign Validation

**Goal:** Prepare the shipped Store / Campaign product for pre-outreach gate proof, then validate it with a real merchant catalog and real traffic only in the first post-outreach Merchant Validation stage. Shopify app, generalized Campaign Builder, CRM, and revenue attribution remain deferred.

**Current status:** Product foundation, Reference Factory, market-facing surfaces, assisted operations, and agent-native core are implemented. Gate B now passes its pre-outreach evidence rule; Gate C Agent-Native Core and standards-based MCP/OAuth pass with Cursor client interoperability tracked separately. Gate A has a durable Store/Campaign source-to-action report, but the core Consumer GA4 join and genuine production Agent referral evidence remain incomplete. Real merchant validation is intentionally post-outreach and has not started.

**Current product model:**

```text
Traffic / Audience
→ Merchant Catalog
→ AI Recommendation
→ Try-On
→ Compare
→ Product / Inquiry Intent
→ Merchant Conversion Insight
```

**Strategic product model:**

```text
Merchant
→ Campaign / Audience / Intent
→ Catalog subset
→ AI decision experience
→ Conversion metrics
```

Store and Campaign are now first-class sibling `Experience` types. The bounded Campaign application service and MCP tools are implemented; a generalized visual Campaign Builder remains deferred until merchant evidence justifies it.

**Post-Outreach Merchant Validation gate:**

```text
First Real Merchant → own catalog → declared traffic source
→ live shopper activity → intent review → continuation / pricing evidence
```

This sequence starts only after Outreach Ready. It is not a pre-outreach Gate B
acceptance criterion and is not run in the current gate-readiness pass.

**Validation package:**

- merchant name / logo;
- 8-20 frame catalog;
- hosted advisor / compare link;
- anonymous shopper upload and try-on;
- frame comparison;
- favorites / product click / inquiry;
- source and campaign/referral context where available;
- simple conversion-oriented usage report;
- 30-day pilot offer.

**Current tasks:**

- Use the five-brand Reference portfolio and current Business Website in controlled merchant conversations.
- Record structured demo feedback and objections.
- Ask where merchant traffic comes from today: Search, Meta, TikTok, email, social, QR, direct, referral, AI assistants, or other channels.
- Ask which business metric would justify payment: product click, inquiry, add-to-cart, conversion, appointment, or attributed revenue.
- Offer the paid/deposit-backed Founding Merchant Pilot, not an unbounded free custom build.
- After Outreach Ready, onboard one real 8–50-frame catalog through the existing assisted/agent capability boundary.
- After Outreach Ready, route one declared traffic source and review Experience-level shopper intent with the merchant.
- Treat lead persistence, authorization lifecycle UI, and OAuth cleanup as bounded Pilot hardening rather than a new platform phase.

**Success criteria:**

- 3 merchants agree to evaluate the hosted workflow; or
- 1 agency agrees to test with 2-3 relevant merchant clients; or
- 1 merchant agrees to a paid or deposit-backed pilot; or
- Product explicitly authorizes a live-data pilot to validate conversion behavior.

The strongest evidence is not that merchants like VTO. It is that they want to route real traffic through VisuTry and measure downstream purchase intent.

### Initiative 6: Agent-Ready Commerce Baseline

**Goal:** Operate and validate the implemented agent-ready merchant capabilities while keeping interoperability work proportional to current Pilot demand.

**Implemented baseline:**

- stable public merchant/store URLs where appropriate;
- canonical product destination URLs;
- explicit frame names, SKU, price/currency and descriptive attributes where available;
- machine-readable structured metadata where appropriate and privacy-safe;
- source/referrer/UTM persistence into merchant sessions and intents;
- classify known AI-assistant / agent referrals separately from generic referral traffic;
- merchant Membership and Workspace boundaries;
- Agent Keys plus standards-based Remote MCP OAuth;
- Store/Campaign create, configure, preview, explicit-approval publish, and aggregate Commerce Intelligence tools;
- current-SHA Codex OAuth/MCP Golden Path proof; Cursor repository readiness and standards compatibility are proven, while real-client callback execution remains external P1 validation.

**Remaining Pilot hardening:**

- Merchant Workspace connected OAuth authorization list/revoke UI;
- cleanup of expired OAuth authorization requests, codes, and tokens;
- real database-backed protocol regression coverage;
- Current-SHA Codex is the Agent-Native Core acceptance path. Cursor remains a bounded second-client interoperability validation; Claude Code remains conditional.

**Deferred until demand:**

- autonomous checkout;
- broad public agent API;
- MCP/tool integration solely for novelty;
- agent-specific duplicate recommendation stack.

**Principle:**

> Agent traffic must use the same Store intelligence and conversion core as human traffic.

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
