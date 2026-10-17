# VisuTry Product Plan

**Status:** Active source of truth for product execution
**Created:** 2026-07-08
**Last updated:** 2026-10-17
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
| `docs/product/specs/visutry-demo-capability.md` | Defines the canonical Demo as a productized capability, including Local/Production parity, product-upgrade obligations, and reusable sales/marketing operation. |
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

**Current phase (2026-10-17): Controlled Founder-led Merchant Pilot — product-ready, not GA.** Merchant G4 engineering and operational evidence is Lead-signed `PASS_SCOPED` ([#414](https://github.com/franksunye/VisuTry/issues/414#issuecomment-6235433534)); commercial product readiness gate [#356](https://github.com/franksunye/VisuTry/issues/356) is closed **for this limited scope**. P1-M3 and the Operating Home live pulse are shipped baseline, not the next development gate.

**Execution is now commercial validation, not another broad feature sprint.** The next operating issue is [#353](https://github.com/franksunye/VisuTry/issues/353): acquisition → activation → verified shopper value → paid Pilot. Preparing a target shortlist/scorecard does **not** authorize first prospect contact; Owner must separately approve each controlled outreach batch. No unqualified claim of public GA, revenue uplift, live Merchant Stripe transaction, or full third-party URL import.

Current operating posture:

1. Preserve Consumer standalone product quality, runtime performance and payments as a standing P0 guardrail.
2. Freeze the accepted core Merchant surface (Catalog/Store/Campaign, Journey/Result/Kiosk, operating UX, privacy and canonical Demo). Ship only observed P0/operational fixes during Pilot.
3. Keep `visutry-demo-optical` the official TEST Demo and the similarly named `visutry-demo` REAL Discovery Canary strictly separate. The Owner access recovery and bounded executed QA evidence are recorded in [#414](https://github.com/franksunye/VisuTry/issues/414).
4. Offer **Manual/CSV-first** Merchant First Value; arbitrary third-party URL import remains best-effort/Beta ([#359](https://github.com/franksunye/VisuTry/issues/359)).
5. For first-wave Pilot, Founder owns `support@visutry.com` and checks it at least once per Asia/Shanghai business day; the public promise is normally within two business days. No backup is staffed for the initial limited wave; see [support evidence](https://github.com/franksunye/VisuTry/issues/414#issuecomment-6235386820).
6. Accept explicit G4 evidence limits: no independently clean-anonymous non-null Hero screenshot; Campaign automatic cache purge confirmed within one PoP (not global); Stripe Test E2E and Live-config equivalence are accepted for prelaunch, **not an actual Merchant Live charge**. Monitor first legitimate external transactions and reopen on real failure.
7. Keep Enterprise Assisted Delivery Factory [#406](https://github.com/franksunye/VisuTry/issues/406)/[#407](https://github.com/franksunye/VisuTry/issues/407), Next 16 migration, and major Agent/marketing integrations in separately gated P1/Later scope; none silently block the signed SMB Pilot.



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

### Now — signed scope

| Priority | Workstream | Acceptance / next behavior |
| --- | --- | --- |
| P0 | Consumer stability | Keep independent Face Analysis, Try-On, Compare and revenue safety green. |
| P0 | Merchant G4 controlled Pilot | **PASS_SCOPED / closed** (#414/#356); protect accepted baseline, distinguish signed scope from GA. |
| P0 | Founder-led Pilot operations | Monitor support mailbox and first authentic checkout/webhook, Session/Intent and onboarding outcomes without inventing data. |
| P1 | Merchant GTM #353 | Prepare scorecard and narrow prospect batch for distinct Owner approval; **no outreach authorized by release signoff**. |
| P1 | Repository/docs housekeeping | Finalize merged Demo owner access record, update current sources of truth and audit branches/PRs without touching active Enterprise/Next work. |

### Next — evidence-triggered or separate authorization

| Priority | Candidate | Entry condition |
| --- | --- | --- |
| P1 | First controlled merchant cohort | Owner approves exact audience/contact count, channel, truthful messages and stop rules under #353. |
| P1 | Enterprise Assisted Factory #406/#407 | Dedicated P1 acceptance and two-merchant RC; not SMB G4 retroactive blocker. |
| P1 | External Agent/OAuth, Catalog URL import refinement | Actual Pilot need, security approval and bounded own QA gates. |
| P2 | Additional Merchant UX polish | Observed merchant friction; avoid ungrounded redesign. |

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

**Current state:** Merchant G4 controlled Founder-led Pilot is Lead-signed `PASS_SCOPED` (2026-10-17); prioritize stable commercial observation and authorized acquisition preparation, not another broad engineering release.

**Exit condition for this posture:** qualified real Merchant and Shopper/Pilot evidence justifies a scoped new implementation gate or a separately approved wider launch. Outreach remains Owner-gated by #353.

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
| P0 | Productized Demo capability | Product / Engineering / Growth / Sales | **Shipped / guarded** | For Demo-relevant product changes, classify impact, keep Local/Production parity current, and refresh reusable evidence/material only when behavior materially changes. |
| P1 | Merchant Production observation | Product / Engineering | Active / Pilot | Watch authentic runtime, shopper and payment outcomes; production QA writes require explicit bounded authority. |
| P1 | G4 signed commercial gate | Product / Engineering | **PASS_SCOPED / closed** | Preserve #414/#356 accepted limitations; not unrestricted GA. |
| P1 | Founder-led GTM #353 | Product / Growth | Planning authorized; outreach not yet authorized | Define qualified limited batch, scorecard and Owner sign-off before contact. |
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

### Productized Demo capability

**Purpose:** Maintain one reusable, truthful product demonstration surface that follows the product rather than becoming a one-off sales branch.

**Current posture:** Shipped and Production-validated. Local is the repeatable regression/rehearsal/content environment; Production is the canonical customer-facing walkthrough. `PREPARED_DEMO` is the default provider-free execution path. Relevant product upgrades must classify Demo impact and update fixture, E2E, assets, documentation, or customer-facing material where required. See `docs/product/specs/visutry-demo-capability.md`.

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
