# VisuTry Product Plan

**Status:** Active source of truth for product execution  
**Created:** 2026-07-08  
**Last updated:** 2026-08-24
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
| `docs/product/plans/agent-native-merchant-self-service.md` | Defines implemented Merchant Workspace, MCP Store/Campaign and Commerce Intelligence capabilities. |
| `docs/product/plans/universal-agent-access.md` | Records production OAuth/MCP evidence and the remaining external-Pilot hardening boundary. |
| `docs/product/sales/visutry-sales-readiness-audit-2026-08-12.md` | Defines the controlled founder-led outreach and evidence loop that may begin only after the Product Advantage Gate passes. |

---

## 3. Product North Star

VisuTry should become:

> **AI commerce infrastructure for eyewear: an intelligence and conversion layer that helps consumers choose frames and helps merchants turn both human and AI-agent traffic into measurable purchase intent and revenue.**

The current public consumer path is:

> Face Shape Detector → Glasses Advisor → Virtual Try-On → Frame Compare

The future merchant path is:

> Traffic / campaign / agent referral → shopper intent → merchant catalog → AI recommendation → try-on → compare → product / inquiry intent → conversion analytics → merchant commerce system.

The hosted merchant Storefront is the first delivery surface. The larger product direction is the **AI Commerce / Campaign Engine**.

---

## 4. Current Product Focus

The next product work should focus on turning VisuTry from a set of useful tools into a coherent eyewear decision and conversion system.

Current focus:

1. Preserve the stable Consumer decision and Credits flows while 2B work resumes.
2. Pass the Product Advantage Gate: Consumer Distribution & Proof, Merchant Experience Excellence, and Agent-Native Merchant Operations.
3. Use the shipped Store, Campaign, Discover, Business Website, Merchant Workspace, Commerce Intelligence, Sponsored Usage, and MCP/OAuth capabilities as one product rather than starting another platform layer.
4. Close only the minimum operational gaps required by the three gates: Consumer continuation/proof, current Store/Campaign acceptance, authorization lifecycle visibility, expiry cleanup, and current-client Golden Path evidence.
5. Validate willingness to route a real merchant catalog and real traffic through VisuTry only after the three gates pass, before building Shopify, CRM, revenue attribution, a generalized Campaign Builder, or additional Reference Brands.

---

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
| P0 | Consumer production stability | 2B work must not regress Face Analysis, Credits, Try-On, Compare, payment, or protected-media behavior. | Shipped / guarded by CI |
| P0 | Product Advantage Gate A/B/C baseline and P0 closure | Structured outreach is gated until the Consumer, Merchant, and Agent gates pass with current evidence. | In progress — see dated baseline |
| P1 | Assisted Pilot operating loop | Intake, catalog review, one Store or Campaign, launch, weekly review, and continuation decision must work without normal shopper actions requiring developer intervention after the gate passes. | Blocked by gate |
| P1 | Business Website v1.2 | The multi-page `/business` narrative, examples, pricing, integrations, and Pilot offer are live. | Shipped / Measuring |
| P1 | Store / Campaign / Commerce Intelligence product | Shared Experience runtime, attribution, Sponsored Usage, Reference/Live provenance, Admin insights, and focused Campaign Try-On are live. | Shipped / Measuring |
| P1 | Agent-native merchant operations | Merchant Workspace, Agent Keys, Remote MCP, OAuth, Store/Campaign tools, and aggregate analytics are implemented; current Codex and Cursor proof remains required. | Implemented core / gate evidence incomplete |

### Next

| Priority | Workstream | Why it matters | Status |
| --- | --- | --- | --- |
| P0 | Product Advantage Gate acceptance | Close dated baseline P0s and re-run the required Consumer, Merchant, Codex, and Cursor evidence. | In progress |
| P1 | OAuth authorization lifecycle UI and cleanup | External agent-native Pilots need connected-authorization visibility, revoke controls, and expired-artifact cleanup. | Backend partially shipped / UI + cleanup ready |
| P1 | Real Merchant acceptance | One merchant must complete catalog intake, Experience launch, real-source traffic, shopper journey, and intent review. | Not started / no evidence recorded |
| P1 | Second-client MCP compatibility | Cursor is part of the active gate; its Golden Path must be run and recorded before outreach. | Not run |
| P1 | Controlled Founding Merchant outreach | Durable Pilot intake is available; outreach may start only after Gate A/B/C are all PASS. | Gated |
| P2 | Merchant-safe Lead Capture / dedicated CTA event | Objective-aware Lead Campaign reporting remains unavailable until a legitimate opt-in runtime and CTA event exist. | Backlog pending merchant demand |

### Later

| Workstream | Reason to defer |
| --- | --- |
| Generalized Campaign Builder | First prove that merchants need multiple campaign variants; do not build a marketing automation suite prematurely. |
| Shopify public app | Requires merchant workflow proof, onboarding, privacy, billing, and support readiness. |
| WooCommerce plugin | Support complexity is higher due to WordPress/theme variance. |
| Public API | Should follow repeated technical buyer demand, not lead the go-to-market. |
| CRM / marketing automation | Use a minimal Pilot tracker until repeated volume justifies a system integration. |
| Order ingestion / revenue attribution | Current reporting is intentionally limited to observable shopper intent; do not imply ROAS or sales lift without reliable commerce data. |
| EHR/PMS integration | Valuable long term but too heavy before merchant/practice validation. |
| Medical-grade PD claims | Requires validation, compliance boundaries, and disclaimers. |
| Large-scale programmatic SEO | Archived as first-priority strategy; future pages must be intent-specific and workflow-connected. |

---

## 7. Current Sprint

**Sprint name:** 2B First Real Merchant Pilot Readiness
**Started:** 2026-08-24
**Exit condition:** Documentation is current, the Product Advantage Gate A/B/C evidence is green, and the assisted Pilot intake/operating path is measurable; no outreach begins while any gate is not PASS.
**Goal:** Convert the shipped 2B product into merchant evidence: qualified responses, a real catalog, an Experience launch, real-source shopper activity, and an observed-intent review.

### Sprint outcomes

| Outcome | Acceptance criteria | Status |
| --- | --- | --- |
| 2B execution documents agree | Product Plan, documentation index, Factory, Market-Facing, Agent-Native, Universal Agent Access, and Business Website status describe the same current phase. | Shipped |
| Production foundation remains green | TypeScript, unit/regression, sponsored PostgreSQL, and revenue-critical browser gates remain green while 2B resumes. | Shipped / continuous |
| Business acquisition surface is credible | `/business`, product pages, examples, pricing, integrations, and Pilot CTA render correctly and make only supported claims. | Shipped / Measuring |
| Pilot interest is durably recorded | A qualified prospect can submit interest and the team can track source, status, objection, demo, and Pilot outcome without relying only on an email client. | Production write verified / admin review pending |
| Assisted Pilot can be operated | A merchant can provide 8–50 reviewed frames, launch one hosted Experience, and receive an intent review under the published Pilot terms. | Ready with real-merchant acceptance pending |
| External agent access is bounded | Connected OAuth authorizations can be listed/revoked, expired artifacts are cleaned, and current Codex plus Cursor complete the Golden Path. | Partially implemented |
| Product Advantage Gate passes | Consumer, Merchant, and Agent gates each have current reproducible evidence; structured outreach is explicitly unlocked only then. | Not started / see `docs/product/audits/product-advantage-gate-baseline-2026-08-24.md` |
| First real merchant evidence exists | At least one merchant provides a real catalog and traffic source, or commits to the paid/deposit-backed Pilot after the gate passes. | Not started / no evidence recorded |

---

## 8. Execution Board

| Priority | Initiative | Owner | Status | Next action | Evidence / Source | Target |
| --- | --- | --- | --- | --- | --- | --- |
| P0 | Consumer stability boundary | Engineering | Shipped / guarded | Keep Consumer critical tests and revenue browser gate green during every 2B change. | ADR-007, GitHub Quality Gate | Continuous |
| P0 | Product Advantage Gate baseline | Product / Engineering | In progress | Close dated Gate A/B/C P0s and keep the active gate synchronized after material 2B changes. | `docs/product/plans/product-advantage-gate.md`, dated baseline | Current |
| P1 | Business Website v1.2 | Product / Growth | Shipped / Measuring | Measure qualified Pilot form starts and submissions by acquisition source. | Business IA, v1.2 brief, PR #121/#125 | Current |
| P1 | Founding Merchant outreach | Product / Growth | Gated | Prepare no outreach list or messages; begin only after all three gates pass and outreach is explicitly authorized. | Sales readiness audit, Product Advantage Gate | After gate |
| P1 | Pilot lead and outcome tracker | Product / Growth / Engineering | Production deployed / write verified | Review request `625a1055-ffb0-4ed4-b14a-a7ca6e686c91` through `/admin/business/leads`, close it as a test, then use the board for controlled outreach responses. | Pilot Lead API, admin board, Sales readiness audit §J/§M | Current |
| P0 | First real Merchant acceptance | Product / Engineering / Growth | Not started | After technical gate P0s close, onboard one real 8–50-frame catalog, launch one Experience, route a real source, and review observed intent. | Store MVP acceptance criteria, dated baseline | Gate evidence |
| P1 | OAuth Pilot hardening | Engineering | Partially implemented | Add authorization list/revoke UI, expired-artifact cleanup, and the selected second-client/DB Golden Path if required by the Pilot. | Universal Agent Access §§15–18 | Next / conditional |
| P2 | Merchant-safe Lead Campaign runtime | Product / Engineering | Backlog | Define only after a real merchant requires opt-in conversion rather than anonymous intent measurement. | Campaign Conversion Policy | Evidence-gated |

---

## 9. Product Initiatives

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

**Goal:** Validate the shipped Store / Campaign product with a real merchant catalog and real traffic before a Shopify app, generalized Campaign Builder, CRM, or revenue attribution.

**Current status:** Product foundation, Reference Factory, market-facing surfaces, assisted operations, and agent-native core implemented; real merchant validation and the three-gate pass are not yet evidenced.

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
- Onboard one real 8–50-frame catalog through the existing assisted/agent capability boundary.
- Route one declared traffic source and review Experience-level shopper intent with the merchant.
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
- historical production Codex OAuth/MCP Golden Path evidence; current-SHA Codex and Cursor Golden Paths remain to be proven.

**Remaining Pilot hardening:**

- Merchant Workspace connected OAuth authorization list/revoke UI;
- cleanup of expired OAuth authorization requests, codes, and tokens;
- real database-backed protocol regression coverage;
- Current-SHA Codex and Cursor Golden Paths are required by the active Product Advantage Gate; Claude Code remains conditional.

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
| 2026-08-24 | Reconciled the execution plan with the shipped Experience Factory, Discover, Business Website v1.2, Sponsored Usage, Merchant Workspace, MCP/OAuth, and Commerce Intelligence capabilities; moved the active gate to first real Merchant Pilot evidence. |
| 2026-08-24 | Implemented durable, attributable Founding Merchant Pilot intake with privacy-preserving rate limits, idempotent submission, and an admin follow-up/outcome board; deployment and production verification remain. |
| 2026-08-24 | Activated the Product Advantage Gate A/B/C as the pre-outreach execution rule; structured merchant outreach is gated until current evidence passes all three gates. |
| 2026-08-24 | Deployed the Pilot intake migration and application through PR #128; production Business browser checks passed and request `625a1055-ffb0-4ed4-b14a-a7ca6e686c91` verified durable public submission and idempotent replay. |
