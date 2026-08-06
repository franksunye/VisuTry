# Merchant Pricing & Entitlement Implementation Plan

**Status:** Approved execution plan for Demo revision and Pilot readiness — Sales-First Founding Pilot v7  
**Owner:** Product / Engineering / Sales  
**Created:** 2026-08-06  
**Last updated:** 2026-08-06  
**Related pricing:** `docs/strategy/merchant-pricing-packaging-unit-economics.md`  
**Related entitlement spec:** `docs/product/specs/merchant-commercial-entitlements.md`  
**Related provider risk:** `docs/strategy/merchant-provider-risk-and-fallback-economics.md`  
**Related sales demo:** `docs/product/specs/visutry-store-sales-demo.md`

---

## 1. Objective

Turn the current Merchant pricing model into an operational product contract for the first external paid Pilots, while preserving the ability to change pricing as product maturity and market evidence evolve.

Operating rule:

> **What Sales quotes, what the merchant receives, what the UI shows, what the backend meters, and what Finance expects must describe the same product.**

Commercial rule:

> **Merchant Value First. Sustainable Economics Always. Margin Expansion Over Time.**

Current-stage rule:

> **The Founding Pilot should be easy to understand and easy to try even before VisuTry can prove downstream revenue attribution.**

Sales-first rule:

> **The merchant should buy a 30-day assisted AI shopping experiment; session/render limits are fair-use boundaries, not the headline product.**

---

## 2. Pricing Is Stage-Based

| Stage | Main objective | GM guidance | Product / pricing implication |
| --- | --- | ---: | --- |
| Market Capture / Pilot | close first merchants and learn quickly | 50–65% acceptable | low-friction Pilot, assisted setup, bounded term |
| Early Scale | repeatable recurring revenue | 60–70%+ target | validated plan tiers, clearer allowances and upgrades |
| Mature Platform | monetize differentiated platform value | 70–80% target | higher ARPU, integrations, enterprise/API, advanced intelligence |
| Long-term | strong blended economics | ~75%+ blended | optimize plan mix and margin trajectory |

A Pilot price is not a commitment to preserve the same price indefinitely.

---

## 3. Current External Commercial Baseline

The **only current standard external sales anchor** is:

> **Founding Merchant Pilot — $149 / 30 days**

### Headline package

- merchant's own frames;
- personalized AI recommendation;
- AI Try-On;
- multi-frame Compare;
- Product Click / Favorite / Inquiry intent tracking;
- merchant intent report;
- assisted setup;
- weekly review.

### Fair-use scope

- up to **500 AI-assisted shoppers / AI Commerce Sessions**;
- up to **1,000 Standard Try-On generations**;
- one hosted Store / campaign experience;
- 8–50 reviewed merchant frames.

Primary sales promise:

> **Turn eyewear traffic into personalized shopping decisions and measurable purchase intent.**

Do not standardize Launch/Growth/Scale as public commitments before Pilot evidence approves them.

---

## 4. Sales Messaging Contract

### 4.1 Primary pitch

> **VisuTry helps eyewear shoppers decide what to try, not just visualize a frame. For $149, we can run a 30-day Pilot using your real frames: shoppers get personalized recommendations, Try-On and Compare, and you see which frames and journeys create stronger purchase intent. We handle the initial setup.**

### 4.2 Capacity wording

Preferred:

> **The Pilot includes up to 500 AI-assisted shoppers and up to 1,000 standard Try-On generations.**

Avoid leading with:

> `500 AI Commerce Sessions / 1,000 renders`

and avoid:

> `$149 for 1,000 generations`

The internal term `AI Commerce Session` can appear in contract/admin language after the merchant understands the value proposition.

### 4.3 VTO comparison objection

> **If you only need a high-volume VTO widget, there are lower-cost options. Our Pilot is for merchants who want to test a guided shopping experience: recommendation, Try-On, Compare and measurable intent, using their own catalog, with setup included.**

### 4.4 ROI objection

> **We do not want to overclaim revenue uplift before the commerce integration exists. The first Pilot measures the shopping journey and purchase-intent signals inside VisuTry. The goal is to see whether shoppers use the experience and whether the resulting intent data is useful enough for you to continue.**

### 4.5 Close

> **The simplest next step is to start with 8–50 representative frames for 30 days. It is $149, we help set it up, and then we review what your shoppers actually did before you decide whether to continue.**

---

## 5. Future Pricing Hypotheses

Internal working anchors remain:

```text
LAUNCH
  $199/month
  750 Commerce Sessions
  1,500 Standard Renders

GROWTH
  $499/month
  1,500 Commerce Sessions
  3,000 Standard Renders

SCALE
  $999/month
  4,000 Commerce Sessions
  8,000 Standard Renders

ENTERPRISE
  $2,500+/month / custom
```

These are planning hypotheses, not immutable public price cards.

---

## 6. Value-Maturity Boundary

### Level 1 — Current Pilot: Observed Intent

Required:

- source/campaign traffic;
- Commerce Sessions;
- recommendation completion;
- Try-On;
- Compare;
- Product Click;
- Favorite;
- Inquiry;
- top frames / high-intent behavior.

### Level 2 — Later: Attributed Conversion

Requires merchant commerce integration or order-data access. Not required for the first Pilot.

### Level 3 — Future: Incrementality

Requires credible experiment design. Explicitly outside first-Pilot scope.

---

## 7. P0 — Sales Demo Must Make the Pilot Easy to Buy

### Shopper Demo

Prove:

1. merchant-specific catalog;
2. source/campaign context;
3. recommendation;
4. Try-On;
5. Compare;
6. product destination;
7. Product Click / Favorite / Inquiry;
8. anonymous-first flow.

### Merchant/Admin Demo

Show:

- Pilot status;
- source/campaign traffic;
- recommendation funnel;
- Try-On / Compare funnel;
- Product Click / Favorite / Inquiry;
- top frames;
- high-intent shopper signals.

Usage can be visible in a secondary section:

- AI-assisted shoppers used / allowance;
- Standard Try-On generations used / allowance.

Do **not** make quota cards the first merchant dashboard story.

Do **not** make attributed revenue, ROI, conversion uplift or incremental GMV part of the standard Pilot demo.

---

## 8. P0 — Server-Side Pilot Entitlement

Required:

- `FOUNDING_PILOT` assignment;
- `commercialStage = MARKET_CAPTURE`;
- pricing version;
- entitlement version;
- billing period;
- contract price;
- Commerce Session allowance = 500;
- Standard Render allowance = 1,000;
- Premium = 0 unless granted;
- campaign allowance = 1;
- catalog guideline = 8–50;
- usage counters;
- server-side enforcement;
- audited override.

A generic billing engine is not required.

---

## 9. P0 — Pricing Versioning Support

Minimum durable concepts:

```text
commercialStage
planCode
pricingVersion
entitlementVersion
effectiveFrom
contractPrice
listPrice
approvedDiscount?
renewalPolicy?
```

Historical merchant terms remain auditable; new pricing can be activated for new merchants without mutating old contracts; renewals may move to a newer pricing version when policy permits.

---

## 10. P0 — Dual Usage Meter

### Commerce Session

Count once when the shopper first enters the AI decision journey. Must be idempotent across refresh, retry, polling, Compare reopen and duplicate events.

### Render Meter

Record separately Standard/Premium attempts and successes, failures/retries, provider/model, merchant/session/campaign, unit-cost version and fallback reason.

The UI must not enforce a fixed two-frame limit merely because packaging assumes ~2 renders/session.

---

## 11. P0 — Intent Event Instrumentation

Required merchant-scoped events:

```text
COMMERCE_SESSION_STARTED
RECOMMENDATION_COMPLETED
TRYON_COMPLETED
COMPARE_VIEWED
FAVORITE_ADDED
PRODUCT_CLICKED
INQUIRY_STARTED
INQUIRY_SUBMITTED
```

Do not delay Pilot to implement order or checkout events.

---

## 12. P0 — Provider Routing and Cost Observability

Required architecture:

```text
Commercial Quality Policy
        ↓
Provider Router
        ↓
Primary Provider
        ↓ failure / policy
Fallback Provider
```

Provider switch must not change merchant entitlement.

---

## 13. P1 — Pilot Operations Package

### Sales

Prepare:

- one-page Founding Pilot offer with **$149 / 30 days** as the main commercial anchor;
- value bullets before usage bullets;
- fair-use line: **up to 500 AI-assisted shoppers / 1,000 Standard Try-On generations**;
- included/excluded scope;
- VTO comparison talk track;
- ROI objection talk track;
- no guaranteed-uplift language;
- explicit statement that Pilot pricing is a founding-stage offer and post-Pilot plans may differ.

### Product / Operations

Prepare onboarding checklist, CSV template, catalog review workflow, source/campaign worksheet, weekly intent report and end-of-Pilot continuation review.

### Engineering

Prepare pricing/entitlement version assignment, dual meters, intent events, source continuity, provider/cost observability, privacy/retention, monitoring and Consumer regression checks.

---

## 14. P1 — Pilot Pricing-Aware Admin

Merchant-facing hierarchy:

```text
1. Shopping / intent performance
2. Top frames and high-intent journeys
3. Usage / fair-use status
```

Usage section may show:

```text
AI-assisted shoppers: 236 / 500
Standard Try-On generations: 418 / 1,000
```

Internal admin may also show pricing version, contract price, approved discount, partner source, average renders/session, actual AI COGS, Base Case COGS, fallback usage and commercial exception.

---

## 15. P1 — Limit, Extension and Market-Capture Policy

Support:

```text
NORMAL
APPROACHING_LIMIT
LIMIT_REACHED
MANUAL_EXTENSION
OVERAGE_ENABLED
```

Pilot behavior:

- alert before ~80% of either meter;
- no surprise charging;
- audited temporary extension allowed;
- Sales/Product may extend capacity when it improves evidence collection or merchant experience;
- a lower-GM extension may be accepted when explicitly approved for market capture.

---

## 16. P2 — Pricing Review Before Formal Plan Productization

Before formal public plans, review Pilot close rate, sales objections, merchant comparison products, willingness to pay, continuation rate, willingness to route more traffic, actual usage, perceived differentiation, support burden, actual GM/gross profit and partner economics.

Then create a **new pricing version** for Early Scale.

---

## 17. Pricing Review Gates

### After first paid merchant

Review whether $149 was easy to explain, whether approval friction was low enough, whether merchant understood value without ROI attribution, whether capacity was sufficient, and whether the merchant compared VisuTry primarily on raw VTO volume.

### After 3 paid merchants

Review objections, competitor comparisons, willingness to pay, continuation intent, usage/support and actual GM. Pricing is explicitly allowed to change here.

### After 5 paid merchants

Decide whether Pilot remains $149, whether capacity changes, whether assisted setup remains included, whether Launch should be productized and whether future recurring pricing should move up/down or change structure.

### After 10 paying merchants

Create the next formal pricing/entitlement version based on actual evidence.

---

## 18. Stage-Based GM Operating Rules

| Stage | GM guidance |
| --- | ---: |
| Pilot / Market Capture | **50–65% acceptable** |
| Early Scale | **60–70%+ target** |
| Mature Platform | **70–80% target** |
| Long-term preferred benchmark | **~75%+ blended** |

A 75% projected GM is **not** an acceptance criterion for the first Pilot. Sustained direct GM below ~50% requires explicit approval.

---

## 19. Acceptance Criteria Before First External Paid Pilot

1. `FOUNDING_PILOT` scope approved.
2. `MARKET_CAPTURE` stage recorded.
3. pricing and entitlement versions recorded.
4. 500 Commerce Sessions server-metered.
5. 1,000 Standard renders server-metered.
6. meters idempotent.
7. intent events implemented.
8. usage reconciles to merchant/session/provider.
9. source/campaign context persists to intent.
10. Merchant/Admin shows meaningful funnel and usage data.
11. Sales can explain value without ROI/revenue claims.
12. Sales can explain value without leading with price-per-render comparison.
13. Founding price is not presented as lifetime pricing.
14. Consumer isolation/privacy remains intact.

---

## 20. Non-Goals Before Pilot Evidence

Do not delay Pilot for revenue attribution infrastructure, incrementality experiments, full self-checkout, public partner portal, automated partner payout, enterprise CPQ, generalized campaign builder or public Shopify marketplace listing.

---

## 21. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created pricing/entitlement implementation plan. |
| 2026-08-06 | v2: sustainable procurement + Provider Router. |
| 2026-08-06 | v3: dual-meter market-aware packaging. |
| 2026-08-06 | v4: Merchant Value First / stage-based GM. |
| 2026-08-06 | v5: Intent-First Pilot boundary; revenue attribution removed from Pilot scope. |
| 2026-08-06 | v6: pricing stage/version support and external Pilot separation. |
| 2026-08-06 | **v7: added explicit sales messaging contract, VTO and ROI objection handling, moved capacity to fair-use presentation, and made the Merchant/Admin story value-first before usage.** |
