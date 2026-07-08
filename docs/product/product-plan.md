# VisuTry Product Plan

**Status:** Active source of truth for product execution  
**Created:** 2026-07-08  
**Owner:** Product  
**Review cadence:** Weekly  
**Scope:** Current product focus, Now / Next / Later priorities, current sprint, product initiatives, backlog, and decisions needed.

---

## 1. Purpose

This document defines what VisuTry should build next.

It translates the commercial strategy into product execution priorities. Strategy explains why VisuTry should move toward an eyewear decision platform. This product plan defines the current sequence of product work.

Working rule:

> If a feature is not in this plan or an approved product spec, it should not be treated as current product priority.

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
5. Prepare the minimum validation path for VisuTry Studio and VisuTry Store.

---

## 5. Now / Next / Later

### Now

These are current product priorities.

| Priority | Workstream | Why it matters | Status |
| --- | --- | --- | --- |
| P0 | Free Detector → Advisor → Try-On continuation | This is the main consumer acquisition and activation path. | Active |
| P0 | Credits Pack conversion loop | Credits Pack is the clearest casual paid product; payment/quota foundation exists, conversion UX/events need completion. | Partially implemented |
| P0 | Frame Compare polish / analytics / homepage exposure | Core Compare is implemented at `/try-on/glasses/compare`; next work is product exposure, analytics, and conversion polish. | Implemented core; enhancement active |
| P0 | Core funnel events and baseline metrics | Product decisions require visibility into upload, completion, continuation, pricing, checkout, and paid usage. | Active |
| P1 | Product documentation governance | Clear docs are required for ordered execution by humans and agents. | Active |

### Next

These should start after the Now items are stable enough to measure.

| Priority | Workstream | Why it matters | Status |
| --- | --- | --- | --- |
| P1 | VisuTry Studio MVP definition | Validates repeated professional client workflow. | Planned |
| P1 | VisuTry Store hosted advisor / try-on link concept | Validates merchant workflow before full widget/platform work. | Planned |
| P1 | Merchant / Store / Frame Catalog data model | Needed for Store, catalog-driven recommendations, and merchant analytics. | Planned |
| P1 | First merchant / stylist discovery list | Needed to validate demand before overbuilding. | Planned |

### Later

These should not drive current engineering unless a high-quality buyer pulls them forward.

| Workstream | Reason to defer |
| --- | --- |
| Shopify public app | Requires merchant workflow proof, onboarding, privacy, billing, and support readiness. |
| WooCommerce plugin | Support complexity is higher due to WordPress/theme variance. |
| Public API | Should follow repeated technical buyer demand, not lead the go-to-market. |
| EHR/PMS integration | Valuable long term but too heavy before merchant/practice validation. |
| Medical-grade PD claims | Requires validation, compliance boundaries, and disclaimers. |
| Large-scale programmatic SEO | Archived as first-priority strategy; future pages must be intent-specific and workflow-connected. |

---

## 6. Current Sprint

**Sprint name:** Consumer Decision Path and Documentation Governance  
**Target window:** 2026-07-08 to 2026-07-22  
**Goal:** Make the next product priorities explicit and strengthen the consumer decision path before deeper professional / merchant workflow development.

### Sprint outcomes

| Outcome | Acceptance criteria | Status |
| --- | --- | --- |
| Documentation entry points exist | `docs/README.md`, `docs/product/README.md`, and `docs/product/product-plan.md` exist and define document ownership. | Done |
| Product priority is explicit | Now / Next / Later is documented and can guide engineering or Codex work. | Done |
| Consumer path is measurable | Detector upload, completion, continuation, try-on start, compare start, pricing click, checkout start, payment completion, and paid usage are tracked or explicitly queued. | Planned |
| Credits Pack is visibly connected to high-intent moments | Post-result and compare flows clearly route users to Credits Pack when appropriate. | Partially implemented |
| Frame Compare is visible in product architecture | Compare is represented as an independent product route/page/flow rather than buried inside carousel or history. | Done; needs homepage/product exposure review |

---

## 7. Product Initiatives

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

**Why now:** Consumer subscription-first pricing is weak. Low-friction credits match episodic eyewear shopping better.

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

**Why now:** Comparing multiple frames is a validated high-intent behavior and strongly aligned with eyewear decision support.

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

### Initiative 4: VisuTry Studio MVP Definition

**Goal:** Define the smallest professional workflow for stylists, consultants, or eyewear advisors.

**Why next:** Prosumer usage can support repeat client-based revenue before full merchant integrations are ready.

**Candidate MVP:**

- client/session profile;
- face analysis and recommendation report;
- multi-frame comparison;
- advisor notes;
- shareable report link;
- lightweight branding.

**Success criteria:**

- 5-10 professional users can be interviewed or shown a clickable concept.
- At least 2-3 real client workflows can be tested.
- Willingness to pay for recurring use or report bundles is assessed.

### Initiative 5: VisuTry Store / Merchant Pilot Definition

**Goal:** Define the smallest merchant workflow before building a full widget or platform app.

**Why next:** B2B is the stronger recurring revenue layer, but merchant workflow should be validated before platform complexity.

**Candidate MVP:**

- merchant profile;
- small top-SKU frame catalog;
- hosted advisor / try-on link;
- shopper upload flow;
- lead capture or saved favorites;
- basic merchant dashboard;
- frame-interest analytics.

**Success criteria:**

- 3 merchants or 1 agency-backed merchant group can evaluate the workflow.
- Product-page try-on opens and completions can be measured.
- At least one merchant can name a concrete business use case.

---

## 8. Product Backlog

| Priority | Item | Type | Status | Source | Acceptance criteria |
| --- | --- | --- | --- | --- | --- |
| P0 | Create documentation entry points | Docs | Done | Current governance need | `docs/README.md`, `docs/product/README.md`, and this file exist. |
| P0 | Establish current product plan | Docs / Product | Done | Current governance need | Now / Next / Later and sprint outcomes are documented. |
| P0 | Validate Detector continuation CTAs | Product / Growth | Planned | SEO/GEO sync, SEO backlog | Detector result routes clearly to Advisor, Try-On, and/or Compare. |
| P0 | Track consumer funnel events | Analytics | Planned | B2B roadmap Phase 0, SEO backlog | Upload → completion → continuation → pricing → checkout → paid usage can be measured. |
| P0 | Clarify Credits Pack conversion moments | Product / Monetization | Partially implemented | Commercial strategy, Credits Pack spec | Credits Pack appears after high-intent result/compare moments. |
| P0 | Polish Frame Compare entry and tracking | Product / UX / Analytics | Implemented core; needs polish | Commercial strategy, homepage discussion, Frame Compare spec | Compare remains explicit and measurable; homepage/product exposure is reviewed. |
| P1 | Maintain Frame Compare spec | Spec | Implemented core; enhancement tracking | Product plan | Spec reflects current implementation and remaining enhancements. |
| P1 | Maintain Credits Pack conversion spec | Spec | Partially implemented | Product plan | Spec separates implemented payment/quota foundation from conversion UX/events. |
| P1 | Draft VisuTry Studio MVP spec | Spec | Planned | Commercial strategy | Spec defines client/session workflow and report link. |
| P1 | Draft VisuTry Store MVP spec | Spec | Draft | B2B roadmap | Spec defines merchant profile, catalog, hosted link, lead capture, analytics. |
| P1 | Define merchant frame catalog schema | Data / Product | Planned | B2B roadmap, benchmarks | Minimal schema supports recommendation, display, tracking, and merchant analytics. |
| P2 | Shopify beta wrapper | Platform | Later | B2B roadmap | Only after generic hosted/widget flow is validated. |
| P2 | WooCommerce beta wrapper | Platform | Later | B2B roadmap | Only after Shopify/generic widget proof and support model are understood. |
| P2 | Public merchant API | API | Later | B2B roadmap | Only after repeated technical buyer demand. |

---

## 9. Decisions Needed

| Decision | Why it matters | Target timing |
| --- | --- | --- |
| Should uploaded/custom frames be added to Frame Compare before Studio / Store? | Determines whether Compare becomes more flexible for consumers before professional workflows. | Now |
| Should comparison boards have public share URLs? | Determines data model and sharing surface. | Next |
| Should the first professional workflow be Studio or Store? | Determines whether first validation targets stylists/consultants or merchants. | Next |
| Should VisuTry Store start with hosted links only? | Avoids widget/platform complexity too early. | Next |
| What is the minimum frame catalog schema? | Needed for Store, recommendations, analytics, and future widget. | Next |
| Which event set is mandatory before B2B pilots? | Prevents selling without measurable proof. | Now |

---

## 10. Deferred / Not Now

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

## 11. Review Process

Review this document weekly.

Each review should answer:

1. Did any Now item ship or become measurable?
2. Should any Next item move into Now?
3. Did any Later item get pulled forward by real demand?
4. Are there new decisions that need to be added?
5. Did any spec become necessary for engineering execution?

When a product item becomes ready for engineering, create or update a spec under `docs/product/specs/`.

---

## 12. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created v0.1 active product plan with Now / Next / Later, current sprint, initiatives, backlog, and decision log. |
| 2026-07-08 | Updated plan after code review: Frame Compare core is implemented; Credits Pack conversion is partially implemented. |
