# VisuTry Product Plan

**Status:** Active source of truth for product execution  
**Created:** 2026-07-08  
**Last updated:** 2026-08-06
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

1. Strengthen the consumer decision path while preserving its stability.
2. Make Credits Pack conversion clearer.
3. Polish and measure the implemented Frame Compare core experience.
4. Instrument the funnel so usage and paid intent are measurable.
5. Use the production-verified Store D0 demo to validate merchant demand before M1 hardening or platform integrations.
6. Reframe Store validation around conversion value: source → recommendation → try-on → compare → purchase intent, not VTO usage alone.
7. Build Store data and attribution in a way that is campaign-ready and agent-ready without prematurely building a generalized campaign builder or public agent API.

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
| P1 | Store D0 merchant validation | Uses the working Luna Optical Store to test merchant comprehension, own-frame sample demand, conversion KPI preference, and willingness to pilot. | Ready for controlled validation |
| P1 | Store positioning and sales narrative | Storefront is the delivery surface; merchant value is AI Commerce / Campaign conversion, not generic VTO. | In Progress |
| P1 | Store landing page market validation | Tests inbound merchant interest and pilot demand. | Shipped / Measuring |
| P1 | Product documentation governance | Clear docs are required for ordered execution by humans and agents. | Shipped / Measuring |

### Next

| Priority | Workstream | Why it matters | Status |
| --- | --- | --- | --- |
| P1 | Store merchant validation sprint | Run demos, capture structured evidence, and seek own-frame sample or paid-pilot commitments. | Ready |
| P1 | Store M1 pilot hardening | CSV onboarding, merchant access, pilot operations, monitoring, source attribution, and conversion metrics after Gate B. | Gated / Not started |
| P1 | Store campaign-ready attribution baseline | Persist traffic source / campaign context through Store session, recommendation, try-on, compare, and intent so future campaign value is measurable. | Ready for spec / gated implementation |
| P1 | Store agent-ready commerce baseline | Ensure public merchant/product/frame surfaces are machine-understandable and AI-referral traffic is attributable, without requiring a public agent API. | Ready for spec / gated implementation |
| P1 | Merchant / Store / Frame Catalog data model | D0 tenant, catalog, session, intent, event, asset, and attribution models are implemented. | Shipped |
| P1 | First merchant / stylist discovery list | Needed to validate demand before overbuilding. | Ready |
| P2 | VisuTry Studio MVP definition | Validates repeated professional client workflow for stylists / advisors. | Backlog |

### Later

| Workstream | Reason to defer |
| --- | --- |
| Generalized Campaign Builder | First prove that merchants need multiple campaign variants; do not build a marketing automation suite prematurely. |
| Public agent actions / commerce API | Agent-readiness starts with discoverability, metadata, stable URLs, and attribution; transactional/action interfaces should follow real pull. |
| Shopify public app | Requires merchant workflow proof, onboarding, privacy, billing, and support readiness. |
| WooCommerce plugin | Support complexity is higher due to WordPress/theme variance. |
| Public API | Should follow repeated technical buyer demand, not lead the go-to-market. |
| EHR/PMS integration | Valuable long term but too heavy before merchant/practice validation. |
| Medical-grade PD claims | Requires validation, compliance boundaries, and disclaimers. |
| Large-scale programmatic SEO | Archived as first-priority strategy; future pages must be intent-specific and workflow-connected. |

---

## 7. Current Sprint

**Sprint name:** Store D0 Merchant Validation and Core Funnel Continuity  
**Target window:** 2026-08-05 to 2026-08-19  
**Goal:** Use the production-verified Store D0 demo in controlled merchant conversations, capture pilot evidence, refine the Store narrative around measurable conversion, and preserve the existing consumer conversion work without starting M1 or platform integrations early.

### Sprint outcomes

| Outcome | Acceptance criteria | Status |
| --- | --- | --- |
| Documentation entry points exist | `docs/README.md`, `docs/product/README.md`, and `docs/product/product-plan.md` exist and define document ownership. | Shipped |
| Product priority is explicit | Now / Next / Later and execution board are documented and can guide engineering or Codex work. | Shipped |
| Consumer path is measurable | Detector upload, completion, continuation, try-on start, compare start, pricing click, checkout start, payment completion, and paid usage are tracked or explicitly queued. | Ready |
| Credits Pack is visibly connected to high-intent moments | Post-result and compare flows clearly route users to Credits Pack when appropriate. | Partially implemented |
| Frame Compare is visible in product architecture | Compare is represented as an independent product route/page/flow rather than buried inside carousel or history. | Shipped; exposure review needed |
| Store landing page validation is specified | Landing page positioning, CTA, lead form, validation metrics, and non-goals are defined. | Shipped |
| VisuTry Store is validation-ready | Store MVP spec defines target users, hosted workflow, validation package, data/events, privacy, campaign/agent-ready direction, and gates to engineering. | Shipped |
| Store D0 engineering is production-verified | Luna Optical seed, capability session, Public POC upload, recommendation, Store Try-On, result delivery, usage, and retention evidence are recorded. | Shipped; Gate A1 closed |
| Store value narrative is updated | Merchant validation asks whether the workflow improves measurable shopper intent/conversion, not whether VTO is merely interesting. | Ready |

---

## 8. Execution Board

| Priority | Initiative | Owner | Status | Next action | Evidence / Source | Target |
| --- | --- | --- | --- | --- | --- | --- |
| P0 | Credits Pack conversion UX | Product / Growth | Partially implemented | Define exact post-result and post-compare CTA placements and event mapping. | `docs/product/specs/credits-pack-conversion.md` | Current sprint |
| P0 | Frame Compare exposure and analytics | Product / Growth | Implemented core | Review homepage/product path exposure and add or map `frame_compare_*` events. | `docs/product/specs/frame-compare.md`, ADR-004 | Current sprint |
| P0 | Consumer funnel baseline | Product / Analytics | Ready | Define minimum event checklist across Detector → Advisor → Try-On → Compare → Pricing → Checkout → Paid usage. | `docs/project/seo-backlog.md`, `docs/strategy/seo/2026-06-30-product-architecture-seo-geo-sync.md` | Current sprint |
| P1 | Store landing page validation | Product / Growth | Shipped / Measuring | Review qualified CTA and lead evidence while pairing the page with targeted outreach. | `docs/product/specs/visutry-store-landing-page.md` | Current sprint |
| P1 | Store D0 merchant validation | Product / Growth | Ready for controlled validation | Run the 10-minute Luna Optical demo; capture own-frame sample requests, objections, preferred acquisition sources, KPI preference, and pilot intent. | Store Sales Demo spec, production verification record | Current sprint |
| P1 | Store positioning: Campaign Engine | Product / Growth | In Progress | Update merchant pitch to “turn traffic into personalized recommendation, try-on and measurable purchase intent”; keep hosted Store as first delivery surface. | `docs/strategy/commercial-strategy.md`, Store MVP spec | Current sprint |
| P1 | Store M1 pilot hardening | Product / Engineering | Gated / Not started | Start only when Gate B is met or Product explicitly approves a real pilot. | Store implementation plan, Store MVP spec | Next after evidence |
| P1 | Campaign/source attribution baseline | Product / Engineering / Analytics | Ready for spec | Define fields/events for source, campaign, referrer and AI-assistant/agent classification before M1 external traffic. | Store MVP spec | Next after Gate B |
| P1 | Agent-ready merchant/product surfaces | Product / Engineering / Growth | Ready for spec | Define stable public metadata and machine-readable product/frame facts; avoid public agent API until demand. | Commercial strategy, Store MVP spec | Next after Gate B |
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

### Initiative 4: Store Landing Page Market Validation

**Goal:** Continue measuring Store demand through the shipped B2B landing page and route qualified prospects into the working D0 demo.

**Current status:** Shipped / Measuring.

**Validation asset:** `docs/product/specs/visutry-store-landing-page.md`

**Current tasks:**

- Measure `/en/store` qualified CTA and lead behavior.
- Use `Get a sample Store Link` as the primary CTA unless testing suggests otherwise.
- Evolve messaging from “AI try-on for your store” toward “personalized eyewear conversion experience for your traffic.”
- Explain that VisuTry works on the merchant's catalog and produces measurable recommendation / try-on / compare / intent signals.
- Introduce human + AI-agent traffic as a forward-looking capability without implying unsupported autonomous-agent integrations today.
- Capture or route leads to an operational destination.
- Pair the page with targeted merchant / agency outreach.

**Success criteria:**

- Store page can explain the hosted recommendation / try-on / compare workflow clearly.
- The merchant understands that Storefront is a deployment surface, not the entire product category.
- Qualified visitors can request a sample link, pilot, or demo.
- Form submissions identify business type, website, frame count, and intent.
- Store validation has measurable CTA and lead events.

### Initiative 5: VisuTry Store — AI Commerce / Campaign Validation

**Goal:** Validate the implemented D0 merchant workflow as a conversion engine before M1 hardening, a full widget, Shopify app, generalized campaign builder, or public API.

**Current status:** D0 implemented; ready for controlled merchant validation.

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

The first D0/M1 may represent this as one default Store-wide campaign. Do not require a new `Campaign` entity or campaign-builder UI until merchant evidence justifies it.

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

- Run the production Luna Optical demo in merchant conversations.
- Record structured demo feedback and objections.
- Ask where merchant traffic comes from today: Search, Meta, TikTok, email, social, QR, direct, referral, AI assistants, or other channels.
- Ask which business metric would justify payment: product click, inquiry, add-to-cart, conversion, appointment, or attributed revenue.
- Offer an own-frame sample Store as the next commitment step.
- Prepare pilot onboarding checklist.
- Prepare privacy and image-retention explanation.
- Define M1 source/campaign attribution before external pilot traffic.
- Define the minimum agent-ready public metadata contract without building a general public API.

**Success criteria:**

- 3 merchants agree to evaluate the hosted workflow; or
- 1 agency agrees to test with 2-3 relevant merchant clients; or
- 1 merchant agrees to a paid or deposit-backed pilot; or
- Product explicitly authorizes a live-data pilot to validate conversion behavior.

The strongest evidence is not that merchants like VTO. It is that they want to route real traffic through VisuTry and measure downstream purchase intent.

### Initiative 6: Agent-Ready Commerce Baseline

**Goal:** Make Store increasingly discoverable, understandable, and measurable for AI assistants and future shopping agents while keeping the implementation proportional to current demand.

**Near-term baseline:**

- stable public merchant/store URLs where appropriate;
- canonical product destination URLs;
- explicit frame names, SKU, price/currency and descriptive attributes where available;
- machine-readable structured metadata where appropriate and privacy-safe;
- source/referrer/UTM persistence into merchant sessions and intents;
- classify known AI-assistant / agent referrals separately from generic referral traffic;
- report agent-originated recommendation, try-on, compare and intent metrics when sample size supports it.

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