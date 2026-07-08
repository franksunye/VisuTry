# VisuTry Product Plan

**Status:** Active source of truth for product execution  
**Created:** 2026-07-08  
**Last updated:** 2026-07-08  
**Owner:** Product  
**Review cadence:** Weekly  
**Scope:** Current product focus, Now / Next / Later priorities, current sprint, product initiatives, backlog, decisions needed, and execution board.

---

## 1. Purpose

This document defines what VisuTry should build, polish, measure, or validate next.

It translates the commercial strategy into product execution priorities. Strategy explains why VisuTry should move toward an eyewear decision platform. This product plan defines the current sequence of product work.

Working rule:

> If a feature is not in this plan or an approved product spec, it should not be treated as current product priority.

Related decision: `docs/decisions/ADR-003-product-plan-execution-source-of-truth.md`.

---

## 2. Source Documents

This plan is derived from:

| Document | How it informs this plan |
| --- | --- |
| `docs/strategy/commercial-strategy.md` | Defines the top-level commercial direction and product packaging. |
| `docs/strategy/commercial-benchmarks.md` | Provides external references such as Optify, OGI / The Optical Foundry, VTO infrastructure vendors, and DTC eyewear retailers. |
| `docs/strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md` | Defines the public consumer product path and SEO/GEO page architecture. |
| `docs/strategy/2026-05-25-b2b-commerce-commercialization-roadmap.md` | Defines B2B merchant/widget roadmap and pilot logic. |
| `docs/project/seo-backlog.md` | Tracks current SEO/Growth tasks and external acquisition sprint. |
| `docs/decisions/ADR-004-frame-compare-core-implemented.md` | Confirms Frame Compare core is implemented and next work is productization. |

---

## 3. Product North Star

VisuTry should become:

> A lightweight AI eyewear advisor and try-on workspace that helps consumers, stylists, and eyewear sellers choose frames with more confidence.

The current public consumer path is:

> Face Shape Detector → Glasses Advisor → Virtual Try-On → Frame Compare

The future professional / merchant path is:

> Client or shopper photo → face analysis → frame recommendation → try-on → comparison → saved favorites / report / lead capture → dashboard / follow-up.

---

## 4. Current Product Focus

The next product work should focus on turning VisuTry from a set of useful tools into a coherent eyewear decision workflow.

Current focus:

1. Strengthen the consumer decision path.
2. Make Credits Pack conversion clearer.
3. Polish and measure the implemented Frame Compare core experience.
4. Instrument the funnel so usage and paid intent are measurable.
5. Validate VisuTry Store before building full merchant infrastructure.

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
| P0 | Free Detector → Advisor → Try-On continuation | Main consumer acquisition and activation path. | In Progress |
| P0 | Credits Pack conversion loop | Clearest casual paid product; payment/quota foundation exists, conversion UX/events need completion. | Partially implemented |
| P0 | Frame Compare polish / analytics / homepage exposure | Core Compare is implemented at `/try-on/glasses/compare`; next work is product exposure, analytics, and conversion polish. | Implemented core |
| P0 | Core funnel events and baseline metrics | Product decisions require visibility into upload, completion, continuation, pricing, checkout, and paid usage. | Ready |
| P1 | Product documentation governance | Clear docs are required for ordered execution by humans and agents. | Shipped / Measuring |

### Next

| Priority | Workstream | Why it matters | Status |
| --- | --- | --- | --- |
| P1 | VisuTry Store validation | Tests recurring merchant workflow before Shopify, widget, API, or full dashboard work. | Ready for validation |
| P1 | Merchant / Store / Frame Catalog data model | Needed only after validation or if internal demo requires it. | Backlog |
| P1 | VisuTry Studio MVP definition | Validates repeated professional client workflow for stylists / advisors. | Backlog |
| P1 | First merchant / stylist discovery list | Needed to validate demand before overbuilding. | Ready |

### Later

| Workstream | Reason to defer |
| --- | --- |
| Shopify public app | Requires merchant workflow proof, onboarding, privacy, billing, and support readiness. |
| WooCommerce plugin | Support complexity is higher due to WordPress/theme variance. |
| Public API | Should follow repeated technical buyer demand, not lead the go-to-market. |
| EHR/PMS integration | Valuable long term but too heavy before merchant/practice validation. |
| Medical-grade PD claims | Requires validation, compliance boundaries, and disclaimers. |
| Large-scale programmatic SEO | Archived as first-priority strategy; future pages must be intent-specific and workflow-connected. |

---

## 7. Current Sprint

**Sprint name:** Consumer Decision Path, Conversion, and Merchant Validation Prep  
**Target window:** 2026-07-08 to 2026-07-22  
**Goal:** Strengthen the existing consumer path, make implemented Compare measurable and visible, complete the Credits Pack conversion plan, and prepare VisuTry Store for external validation.

### Sprint outcomes

| Outcome | Acceptance criteria | Status |
| --- | --- | --- |
| Documentation entry points exist | `docs/README.md`, `docs/product/README.md`, and `docs/product/product-plan.md` exist and define document ownership. | Shipped |
| Product priority is explicit | Now / Next / Later and execution board are documented and can guide engineering or Codex work. | Shipped |
| Consumer path is measurable | Detector upload, completion, continuation, try-on start, compare start, pricing click, checkout start, payment completion, and paid usage are tracked or explicitly queued. | Ready |
| Credits Pack is visibly connected to high-intent moments | Post-result and compare flows clearly route users to Credits Pack when appropriate. | Partially implemented |
| Frame Compare is visible in product architecture | Compare is represented as an independent product route/page/flow rather than buried inside carousel or history. | Shipped; exposure review needed |
| VisuTry Store is validation-ready | Store MVP spec defines target users, hosted workflow, validation package, data/events, privacy, and gates to engineering. | Shipped |

---

## 8. Execution Board

| Priority | Initiative | Owner | Status | Next action | Evidence / Source | Target |
| --- | --- | --- | --- | --- | --- | --- |
| P0 | Credits Pack conversion UX | Product / Growth | Partially implemented | Define exact post-result and post-compare CTA placements and event mapping. | `docs/product/specs/credits-pack-conversion.md` | Current sprint |
| P0 | Frame Compare exposure and analytics | Product / Growth | Implemented core | Review homepage/product path exposure and add or map `frame_compare_*` events. | `docs/product/specs/frame-compare.md`, ADR-004 | Current sprint |
| P0 | Consumer funnel baseline | Product / Analytics | Ready | Define minimum event checklist across Detector → Advisor → Try-On → Compare → Pricing → Checkout → Paid usage. | `docs/project/seo-backlog.md`, `docs/strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md` | Current sprint |
| P1 | VisuTry Store validation | Product / Strategy | Ready for validation | Prepare merchant pitch, demo outline, pilot checklist, and target list. | `docs/product/specs/visutry-store-mvp.md` | Next sprint |
| P1 | Merchant / stylist discovery list | Product / Growth | Ready | Build a focused list of 20-50 relevant merchants, brands, agencies, or stylists. | Store MVP spec, B2B roadmap | Next sprint |
| P1 | Frame Compare enhancement decisions | Product | Ready | Decide whether custom uploaded frames and public board sharing are needed before Store / Studio. | Frame Compare spec | Next review |
| P2 | Historical document archive moves | Product / Engineering | Deferred | Only move files after status review confirms they are not active. | `docs/strategy/legacy-document-audit.md` | Later |

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

- Add or verify post-result Credits Pack CTA.
- Strengthen Compare completion CTA for continued comparison.
- Clarify that free Detector does not consume credits.
- Ensure failed generations do not create confusing credit behavior.
- Track pricing click, checkout start, payment completion, and paid usage with explicit or mapped events.

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

### Initiative 4: VisuTry Store Validation

**Goal:** Validate the smallest merchant workflow before building a full widget, Shopify app, public API, or merchant dashboard.

**Current status:** Ready for validation.

**Validation package:**

- merchant name / logo;
- 8-20 frame catalog;
- hosted advisor / compare link;
- shopper upload and try-on;
- frame comparison;
- favorites or lead capture concept;
- simple usage report;
- 30-day pilot offer.

**Current tasks:**

- Prepare one-page merchant pitch.
- Prepare demo outline or lightweight hosted demo concept.
- Prepare pilot onboarding checklist.
- Prepare privacy and image-retention explanation.
- Build target list of merchants / agencies / stylists.

**Success criteria:**

- 3 merchants agree to evaluate the hosted workflow; or
- 1 agency agrees to test with 2-3 relevant merchant clients; or
- 1 merchant agrees to a paid or deposit-backed pilot; or
- internal team decides a demo is required to unlock sales conversations.

### Initiative 5: VisuTry Studio MVP Definition

**Goal:** Define the smallest professional workflow for stylists, consultants, or eyewear advisors.

**Why later:** Studio may become valuable, but Store validation currently has stronger recurring revenue potential.

**Candidate MVP:**

- client/session profile;
- face analysis and recommendation report;
- multi-frame comparison;
- advisor notes;
- shareable report link;
- lightweight branding.

---

## 10. Product Backlog

| Priority | Item | Type | Status | Source | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| P0 | Create documentation entry points | Docs | Shipped | Current governance need | `docs/README.md`, `docs/product/README.md`, and this file exist. |
| P0 | Establish current product plan | Docs / Product | Shipped | ADR-003 | Now / Next / Later, execution board, and sprint outcomes are documented. |
| P0 | Clarify Credits Pack conversion moments | Product / Monetization | Partially implemented | Commercial strategy, Credits Pack spec | Credits Pack appears after high-intent result/compare moments. |
| P0 | Polish Frame Compare entry and tracking | Product / UX / Analytics | Implemented core | Commercial strategy, homepage discussion, Frame Compare spec, ADR-004 | Compare remains explicit and measurable; homepage/product exposure is reviewed. |
| P0 | Track consumer funnel events | Analytics | Ready | B2B roadmap Phase 0, SEO backlog | Upload → completion → continuation → pricing → checkout → paid usage can be measured. |
| P1 | Validate Detector continuation CTAs | Product / Growth | Ready | SEO/GEO sync, SEO backlog | Detector result routes clearly to Advisor, Try-On, and/or Compare. |
| P1 | Maintain Frame Compare spec | Spec | Implemented core; enhancement tracking | Product plan | Spec reflects current implementation and remaining enhancements. |
| P1 | Maintain Credits Pack conversion spec | Spec | Partially implemented | Product plan | Spec separates implemented payment/quota foundation from conversion UX/events. |
| P1 | Validate VisuTry Store MVP | Product / Strategy | Ready for validation | Store MVP spec, B2B roadmap | Merchant pitch, pilot checklist, and target list are ready. |
| P1 | Define merchant frame catalog schema | Data / Product | Backlog | B2B roadmap, benchmarks | Promote only after Store validation requires engineering. |
| P1 | Draft VisuTry Studio MVP spec | Spec | Backlog | Commercial strategy | Start only after Store validation or clear professional-user pull. |
| P2 | Shopify beta wrapper | Platform | Deferred | B2B roadmap | Only after generic hosted/widget flow is validated. |
| P2 | WooCommerce beta wrapper | Platform | Deferred | B2B roadmap | Only after Shopify/generic widget proof and support model are understood. |
| P2 | Public merchant API | API | Deferred | B2B roadmap | Only after repeated technical buyer demand. |

---

## 11. Decisions Needed

| Decision | Why it matters | Target timing |
| --- | --- | --- |
| Should uploaded/custom frames be added to Frame Compare before Studio / Store? | Determines whether Compare becomes more flexible for consumers before professional workflows. | Now |
| Should comparison boards have public share URLs? | Determines data model and sharing surface. | Next |
| What exact event set is mandatory for consumer funnel measurement? | Prevents blind iteration on conversion and acquisition. | Now |
| Which merchant segment should validate Store first: DTC eyewear, optical store, agency, or stylist? | Determines pitch, demo, and target list. | Next |
| Should VisuTry Store start with hosted links only? | Avoids widget/platform complexity too early. | Next |
| What is the minimum frame catalog schema? | Needed only if Store validation moves to engineering. | Next |

---

## 12. Deferred / Not Now

The following work is intentionally deferred:

- public Shopify app listing;
- WooCommerce plugin;
- public API sales;
- EHR/PMS integration;
- medical-grade PD measurement;
- full white-label deployments;
- large-scale thin programmatic SEO pages;
- broad non-eyewear try-on categories.

These can be revisited only if they are pulled forward by validated demand or required by a current strategic decision.

---

## 13. Review Process

Review this document weekly.

Each review should answer:

1. Did any Now item ship or become measurable?
2. Should any Next item move into Now?
3. Did any Later item get pulled forward by real demand?
4. Are there new decisions that need to be added?
5. Did any spec become necessary for engineering execution?
6. Did any implemented feature need its spec status corrected?

When a product item becomes ready for engineering, create or update a spec under `docs/product/specs/`.

---

## 14. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created v0.1 active product plan with Now / Next / Later, current sprint, initiatives, backlog, and decision log. |
| 2026-07-08 | Updated plan after code review: Frame Compare core is implemented; Credits Pack conversion is partially implemented. |
| 2026-07-08 | Strengthened product plan into an execution board and advanced VisuTry Store to ready for validation. |
