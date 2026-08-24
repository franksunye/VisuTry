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
| `docs/product/plans/market-facing-productization-plan.md` | Records completed Discover/distribution and Business Website productization. |
| `docs/product/plans/product-advantage-gate.md` | Defines the active pre-outreach gate across Consumer distribution/proof, Merchant experience quality, and Agent-native merchant operations. |
| `docs/product/business-website-ia-and-copy.md` | Defines current Business Website product truth, claims, Pilot and CTA baseline. |
| `docs/product/plans/agent-native-merchant-self-service.md` | Defines implemented Merchant Workspace, MCP Store/Campaign and Commerce Intelligence capabilities. |
| `docs/product/plans/universal-agent-access.md` | Records production OAuth/MCP evidence and the remaining external-Pilot hardening boundary. |
| `docs/product/sales/visutry-sales-readiness-audit-2026-08-12.md` | Defines the controlled founder-led outreach and evidence loop that follows productization. |

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

VisuTry has completed the core 2B product architecture, Reference Factory, Business Website, Pilot intake, Store / Campaign runtime, Commerce Intelligence, Merchant Workspace, and the first production Agent-native access path.

The next phase is **not yet structured merchant outreach**.

Before outbound becomes the primary company motion, VisuTry must raise three strategic capabilities to a clearly defensible market bar:

1. **Consumer Distribution & Proof** — the 2C product must deliver a coherent, high-quality eyewear decision experience and prove SEO / AEO / GEO / AI-agent discovery as a measurable acquisition layer.
2. **Merchant Experience Excellence** — Business, Store, Campaign, shopper Experience, and Merchant/Admin surfaces must meet a brand- and agency-grade quality bar suitable for real paid traffic and brand reputation.
3. **Agent-Native Merchant Operations** — Codex and Cursor must be able to complete the defined merchant Golden Path from workspace/catalog inspection through preview, explicit approval, publish, and analytics without developer intervention.

These are not independent feature tracks. Together they determine VisuTry's sales difficulty, differentiation, conversion potential, onboarding effort, and ability to scale merchant operations.

Operating principle:

> **Do not use outbound sales to compensate for product, distribution, or onboarding weakness. Build Distribution × Experience × Automation to the required bar first, then begin structured outreach from a stronger position.**

The goal is not feature completeness. The goal is to establish three measurable advantages:

> **VisuTry can attract high-intent eyewear shoppers.**  
> **VisuTry can deliver a brand-grade commerce experience.**  
> **VisuTry can be operated by an AI agent with near-zero merchant onboarding effort.**

Controlled Founding Merchant Outreach remains gated until all three Product Advantage gates pass. The detailed acceptance contract is `docs/product/plans/product-advantage-gate.md`.

Work that does not map directly to one of these three gates or production stability is not current priority.

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
| Gated | Intentionally blocked until named acceptance criteria are satisfied. |
| Deferred | Intentionally not current priority. |

---

## 6. Now / Next / Later

### Now

| Priority | Workstream | Why it matters | Status |
| --- | --- | --- | --- |
| P0 | Consumer production stability | Product-advantage work must not regress Face Analysis, Credits, Try-On, Compare, payment, or protected-media behavior. | Shipped / guarded by CI |
| P0 | Consumer Distribution & Proof | 2C quality plus SEO/AEO/GEO and AI-agent discovery is both a consumer growth engine and future merchant distribution proof. | In Progress / gate evidence required |
| P0 | Merchant Experience Excellence | Brands and agencies already expect professional mini-sites and campaign destinations; VisuTry must meet or exceed that market bar. | In Progress / visual + workflow audit required |
| P0 | Agent-Native Merchant Golden Path | Near-zero onboarding effort is a core operating advantage; Codex and Cursor must independently operate the merchant workflow. | Implemented core / hardening + acceptance required |
| P0 | Product Advantage Gate reconciliation | Product Plan and active execution documents must describe the same pre-outreach gate and evidence requirements. | In Progress / this PR |
| P1 | Business Website v1.2 measurement | The acquisition surface is live and should continue collecting passive demand evidence while outreach is gated. | Shipped / Measuring |
| P1 | Pilot intake and outcome tracking | Durable Pilot intake remains available for inbound interest and later controlled outreach. | Production deployed / write verified |

### Next

| Priority | Workstream | Why it matters | Status |
| --- | --- | --- | --- |
| P1 | Product Advantage Gate review | A + B + C must each have evidence, not only implementation claims. | Next gate |
| P1 | Controlled Founding Merchant outreach | Structured outbound starts only after Consumer Distribution & Proof, Merchant Experience Excellence, and Agent-Native Operations pass the agreed bar. | Gated on A + B + C |
| P1 | First real Merchant acceptance | After outreach opens, one merchant must complete catalog intake, Experience launch, real-source traffic, shopper journey, and intent review. | Gated behind outreach readiness |
| P1 | OAuth authorization lifecycle UI and cleanup | Needed where it blocks the Agent-Native Golden Path or safe merchant self-service. | Active only as Gate C work |
| P1 | Cursor Golden Path | Codex is production-verified; Cursor must independently complete the defined commercial workflow before Gate C passes. | Required for Gate C |
| P2 | Merchant-safe Lead Capture / dedicated CTA event | Objective-aware Lead Campaign reporting remains unavailable until a legitimate opt-in runtime and CTA event exist. | Backlog pending evidence |

### Later

| Workstream | Reason to defer |
| --- | --- |
| Generalized Campaign Builder | The current priority is quality of the existing Campaign path, not breadth of marketing-automation features. |
| Shopify public app | Requires merchant workflow proof, onboarding, privacy, billing, and support readiness. |
| WooCommerce plugin | Support complexity is higher due to WordPress/theme variance. |
| Public API | Agent-native Merchant operations should prove the operating model before a broad public API. |
| CRM / marketing automation | Use the existing Pilot tracker until repeated merchant volume justifies integration. |
| Order ingestion / revenue attribution | Current reporting is intentionally limited to observable shopper intent; do not imply ROAS or sales lift without reliable commerce data. |
| EHR/PMS integration | Valuable long term but too heavy before merchant/practice validation. |
| Medical-grade PD claims | Requires validation, compliance boundaries, and disclaimers. |
| Additional Reference Brands | Existing Reference portfolio is sufficient for quality work; do not use new simulated brands to avoid real acceptance evidence. |
| Large-scale generic programmatic SEO | Consumer distribution work must be intent-specific, useful, product-connected, and measurable rather than page-count driven. |

---

## 7. Current Sprint

**Sprint name:** Product Advantage Gate — Distribution × Experience × Agent Native  
**Started:** 2026-08-24  
**Exit condition:** Gate A, Gate B, and Gate C each have objective acceptance evidence, and no unresolved P0/P1 defect makes the primary Consumer, Merchant, or Agent Golden Path materially below the defined bar.  
**Goal:** Raise VisuTry's Consumer distribution/proof layer, Merchant experience layer, and Agent-native operating layer to the agreed pre-outreach standard. Structured merchant outreach remains gated until all three capabilities pass.

### Sprint outcomes

| Outcome | Acceptance criteria | Status |
| --- | --- | --- |
| Production foundation remains green | Consumer revenue and 2B critical browser/regression gates remain green while Product Advantage work proceeds. | Shipped / continuous |
| Gate A — Consumer journey quality | Detector / Face Analysis → Advisor → Try-On → Compare behaves as a coherent, premium decision journey on desktop and mobile with no material P0/P1 UX break. | Audit / remediation required |
| Gate A — Distribution proof | Organic search and known AI-assistant/agent referrals can be separately observed and connected to meaningful product engagement; SEO/AEO/GEO surfaces are useful and product-connected. | Measurement + proof required |
| Gate B — Brand-grade shopper experience | Business → Example → Store/Campaign → recommendation → Try-On → Compare → CTA is professionally credible for a brand or agency sending real traffic. | Visual + workflow audit required |
| Gate B — Merchant/Admin quality | Catalog / Store / Campaign / Commerce Intelligence hierarchy and primary operational/reporting surfaces meet a commercial-product bar rather than an internal-tool bar. | Audit / remediation required |
| Gate C — Codex Golden Path | Codex can perform the defined merchant workflow within tenancy, approval, auditability, and idempotency boundaries. | Core passed / commercial-path revalidation required |
| Gate C — Cursor Golden Path | Cursor independently performs workspace/catalog inspection → Experience setup → preview → explicit approval → publish → analytics without developer or DB intervention. | Not yet evidenced |
| Outreach readiness decision | Product reviews A + B + C evidence and explicitly changes Controlled Founding Merchant Outreach from Gated to Ready. | Gated |

### Product Advantage guardrails

- Do not start structured outreach before the readiness decision.
- Passive inbound Pilot requests may continue to be accepted and measured.
- Do not create new Reference Brands to substitute for quality work on existing real surfaces.
- Do not build Shopify, CRM, generalized Campaign Builder, revenue attribution, or unrelated platform breadth during this sprint unless an active gate cannot pass without a bounded prerequisite.
- Fix real Consumer / Merchant / Agent Golden Path blockers before adding optional capability.
- Evidence must come from production or production-equivalent paths, not screenshots or implementation claims alone.

---

## 8. Execution Board

| Priority | Initiative | Owner | Status | Next action | Evidence / Source | Target |
| --- | --- | --- | --- | --- | --- | --- |
| P0 | Consumer stability boundary | Engineering | Shipped / guarded | Keep Consumer critical tests and revenue browser gates green during all Product Advantage work. | ADR-007, GitHub Quality Gate | Continuous |
| P0 | Gate A: Consumer Experience audit | Product / Design / Engineering | Ready | Review Face Analysis/Detector, Advisor, Try-On, Compare and connecting CTAs on mobile + desktop; classify P0/P1 gaps and remediate to the target bar. | Product Advantage Gate §A | Current |
| P0 | Gate A: SEO/AEO/GEO + Agent traffic proof | Product / Growth / Engineering | Ready | Audit high-intent eyewear decision surfaces, structured answerability, internal product continuation, AI referral classification, and measurable discovery→engagement paths. | Product Advantage Gate §A; SEO/GEO strategy | Current |
| P0 | Gate B: Store/Campaign shopper excellence | Product / Design / Engineering | Ready | Run a brand/agency-grade visual + workflow audit across Business, Store, Campaign, recommendation, Try-On, Compare, CTA, mobile and desktop; remediate P0/P1 issues. | Product Advantage Gate §B | Current |
| P0 | Gate B: Merchant/Admin excellence | Product / Design / Engineering | Ready | Audit Catalog, Store, Campaign, Commerce Intelligence and reporting hierarchy; remove internal-tool quality from primary merchant tasks. | Product Advantage Gate §B | Current |
| P0 | Gate C: Agent-native merchant Golden Path | Engineering / Product | Implemented core | Revalidate Codex against the commercial Golden Path; close auth lifecycle/cleanup blockers; verify Cursor independently without DB/developer shortcuts. | Product Advantage Gate §C; Universal Agent Access | Current |
| P0 | Product Advantage evidence review | Product | Gated | Review evidence for A + B + C; explicitly record pass/fail and remaining blockers. | `docs/product/plans/product-advantage-gate.md` | Sprint exit |
| P1 | Business Website measurement | Product / Growth | Shipped / Measuring | Continue passive measurement of source, qualified Pilot form starts, submissions, and example engagement while outbound is gated. | Business IA, Pilot Lead API | Current |
| P1 | Pilot lead and outcome tracker | Product / Growth / Engineering | Production deployed / write verified | Keep inbound Pilot intake operational; do not treat tracker availability as authorization to begin structured outreach. | Pilot Lead API, admin board | Continuous |
| P1 | Founding Merchant outreach | Product / Growth | Gated | Do not send the structured first batch until Product explicitly records A + B + C as passed. | Product Advantage Gate | After sprint exit |
| P1 | First real Merchant acceptance | Product / Engineering / Growth | Gated | After outreach opens, onboard one real 8–50-frame catalog, launch one Experience, route a declared real source, and review observed intent. | Store MVP acceptance criteria | Post-gate |
| P2 | Merchant-safe Lead Campaign runtime | Product / Engineering | Backlog | Define only after evidence requires opt-in conversion beyond current observable intent measurement. | Campaign Conversion Policy | Evidence-gated |

---

## 9. Product Initiatives

### Initiative 1: Consumer Decision Journey + Distribution Proof

**Goal:** Make the Consumer product a coherent, high-quality eyewear decision experience and a measurable acquisition/proof layer for the wider VisuTry commerce system.

**Product path:**

```text
Search / Content / Social / AI Assistants
→ Face Understanding
→ Glasses Advisor
→ Virtual Try-On
→ Frame Compare
→ Measurable Shopper Intent
→ Merchant Store / Campaign / Product
```

**Current tasks:**

- Audit the end-to-end Consumer journey rather than optimizing isolated tools.
- Ensure Face Analysis/Detector results have relevant continuation into Advisor, Try-On, and Compare.
- Audit desktop/mobile visual quality, latency states, error states, navigation continuity, and primary CTAs.
- Keep Credits and paid conversion behavior stable while improving decision flow.
- Audit high-intent eyewear SEO/AEO/GEO surfaces for usefulness, answerability, entity clarity, internal product continuation, and crawl/index health.
- Classify known AI-assistant / agent referrals separately from generic referral traffic where technically observable.
- Measure discovery → meaningful product interaction rather than pageviews alone.

**Success criteria:**

- The primary Consumer decision journey has no unresolved P0/P1 quality defect.
- A user can move naturally from useful answer to recommendation, Try-On, and Compare.
- Organic and known AI-assistant/agent traffic can be observed separately where referrer/source data permits.
- Discovery traffic can be connected to meaningful decision-product engagement.
- VisuTry can credibly demonstrate that it can acquire qualified eyewear intent without buying every visit.

### Initiative 2: Credits Pack Conversion Loop

**Goal:** Keep Credits Pack as the clearest casual paid product for high-intent try-on and comparison users while the Product Advantage Gate is executed.

**Current implementation:**

- Credits Pack pricing and Stripe checkout exist.
- Webhook updates purchased credits.
- Quota deduction happens after successful generation.
- Try-On and Compare have basic insufficient-credit routing.

**Current tasks:**

- Do not modify Checkout without an incident signal or evidence-backed conversion need.
- Continue terminal-completion observation for `face_analysis_report` and `pricing` separately.
- Reconcile GA Purchase, Payment rows, and Stripe Session status as needed.
- Treat revenue-flow stability as a guardrail for Gate A work.

**Success criteria:**

- Users understand what is free and what consumes credits.
- Credits Pack remains visible at appropriate high-intent moments.
- Credits conversion and paid usage remain measurable and regression-free.

### Initiative 3: Frame Compare Polish / Analytics / Exposure

**Goal:** Make the implemented Frame Compare core experience visible, measurable, conversion-ready, and integrated into the broader Consumer decision journey.

**Current implementation:**

- Standalone route exists: `/try-on/glasses/compare`.
- Public landing exists for anonymous users.
- Authenticated users can upload one photo and compare up to 4 preset frames.
- Compare respects available credits.
- Generation runs per frame and displays queued / processing / completed / failed states.
- Failed frames can be retried.
- Completed outputs save to Dashboard History.

**Current tasks:**

- Ensure Compare is exposed from relevant Consumer journeys and CTAs.
- Verify compare analytics events support Gate A journey measurement.
- Audit visual quality and all processing/error/completed states on mobile + desktop.
- Improve post-completion next action only where it strengthens the decision journey or paid conversion.

**Success criteria:**

- Users understand Compare as a decision-support feature.
- Compare is not hidden or visually below the target Consumer bar.
- Compare actions and continuation are measurable.
- Compare contributes to the coherent Consumer journey and Credits conversion.

### Initiative 4: Business Acquisition Surface — Passive Proof Until Outreach Gate

**Goal:** Keep the shipped Business Website credible, measurable, and aligned with the actual product while structured outreach remains gated.

**Current status:** Business Website v1.2 shipped / Measuring. The production Pilot request form and lead/outcome tracker are available.

**Current tasks:**

- Measure `/en/business`, examples, product pages, `/en/business/pilot`, and qualified CTA behavior by source.
- Keep $149 / 30-day Pilot terms and claims boundaries consistent across Business, Sales, and operating documents.
- Keep inbound Pilot intake operational.
- Replace obsolete or materially inaccurate marketing screenshots/assets with representations grounded in the current Store/Campaign/Admin product.
- Use the Business Website as part of Gate B review, not as evidence that Gate B is already complete.
- Do not begin structured founder-led outbound until the Product Advantage readiness decision passes.

**Success criteria:**

- Business pages accurately explain the current hosted recommendation / Try-On / Compare / Campaign / Commerce Intelligence proposition.
- The website visually matches the professional quality of the product it sells.
- Qualified inbound visitors can request a Pilot and are durably tracked.
- No public claim implies live-customer proof where only Reference/Simulation proof exists.

### Initiative 5: Merchant Experience Excellence — Store / Campaign / Commerce Intelligence

**Goal:** Raise the shipped 2B product from technically usable to brand- and agency-grade before asking merchants to route paid or reputation-sensitive traffic through it.

**Current product model:**

```text
Traffic / Audience
→ Store or Campaign Experience
→ Shopper Understanding
→ Personalized Recommendation
→ Try-On
→ Compare
→ Product / Inquiry Intent
→ Merchant Commerce Insight
```

**Required quality bar:**

- Store/Campaign shopper surfaces feel like commercial brand destinations rather than internal demos.
- Campaign context materially affects narrative, audience/product presentation, and measurement; it must not feel like a renamed Store.
- Recommendation → Try-On → Compare → CTA feels like one conversion experience.
- Mobile and desktop are both production-quality.
- Loading, empty, processing, error, and completed states are intentionally designed.
- Brand identity, typography, spacing, imagery, catalog presentation, and interaction quality are credible for premium eyewear.
- Merchant/Admin hierarchy across Catalog, Store, Campaign, and Commerce Intelligence is immediately understandable.
- Merchant reporting prioritizes useful business signals rather than only technical usage counters.

**Current tasks:**

- Run a structured visual + workflow audit using existing Reference Experiences and the actual current product.
- Review from the perspective of a premium eyewear brand, ecommerce director, performance marketing team, and agency account lead.
- Record P0/P1 issues separately from optional enhancements.
- Remediate P0/P1 visual, interaction, mobile, continuity, and reporting problems before Gate B passes.
- Ensure Business Website screenshots and examples reflect the real current interfaces.
- Preserve Reference vs Live provenance and supported-claims boundaries.

**Success criteria:**

- A brand/agency reviewer can confidently send meaningful paid traffic to the destination.
- No material P0/P1 visual or primary-workflow defect remains in the approved demo paths.
- Business → Example → Store/Campaign → shopper journey → Merchant Insight does not materially drop in perceived quality.
- Merchant/Admin primary tasks no longer feel like developer/internal tooling.

### Initiative 6: Agent-Native Merchant Operations

**Goal:** Prove that VisuTry can be operated by general-purpose capable agents with near-zero merchant onboarding effort while preserving merchant authorization and safety boundaries.

**Commercial Golden Path:**

```text
Merchant authorization
→ workspace inspection
→ catalog intake / validation
→ Store or Campaign setup
→ configuration
→ preview
→ explicit merchant approval
→ publish
→ Commerce Intelligence
→ explanation / supported next action
```

**Implemented baseline:**

- Merchant Membership and Workspace boundaries;
- Agent Keys plus standards-based Remote MCP OAuth;
- Store/Campaign create, configure, preview, explicit-approval publish, and aggregate Commerce Intelligence tools;
- stable public merchant/store URLs where appropriate;
- canonical product destination URLs and structured catalog attributes where available;
- source/referrer/UTM persistence into merchant sessions and intents;
- production Codex OAuth/MCP Golden Path.

**Current tasks:**

- Revalidate Codex against the full business-level Golden Path rather than isolated tool availability.
- Expose connected OAuth authorization visibility/revoke controls where required for safe self-service.
- Clean expired OAuth artifacts where they can affect reliable operation.
- Maintain DB-backed protocol regression coverage for the selected path.
- Verify Cursor independently completes the Golden Path using documented VisuTry capabilities.
- Do not allow direct database edits, hidden developer knowledge, or manual backend intervention to count as success.
- Preserve tenant isolation, explicit approval for consequential writes/publish, auditability, idempotency, and preview-before-publish behavior.

**Success criteria:**

- Codex and Cursor can each receive a business-level instruction and independently complete the agreed merchant workflow.
- No developer intervention or direct DB manipulation is required in the normal Golden Path.
- The agent can summarize what it will publish and wait for explicit approval before consequential publication.
- After traffic arrives, the agent can retrieve Commerce Intelligence and explain supported observations.
- Gate C evidence is repeatable and documented.

**Principle:**

> Agent Native is not complete because APIs or MCP tools exist. It is complete when an authorized agent can reliably operate the commercial workflow.

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
| 2026-08-24 | Implemented durable, attributable Founding Merchant Pilot intake with privacy-preserving rate limits, idempotent submission, and an admin follow-up/outcome board. |
| 2026-08-24 | Deployed the Pilot intake migration and application through PR #128; production Business browser checks passed and durable public submission/idempotent replay were verified. |
| 2026-08-24 | Superseded immediate structured outreach as the active next step. Added the Product Advantage Gate: Consumer Distribution & Proof + Merchant Experience Excellence + Agent-Native Merchant Operations. Structured outreach is gated until A + B + C pass with objective evidence. |