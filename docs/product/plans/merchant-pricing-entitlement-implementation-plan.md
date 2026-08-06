# Merchant Pricing & Entitlement Implementation Plan

**Status:** Approved execution plan — Market-Capture Competitive Offer v8  
**Owner:** Product / Engineering / Sales  
**Created:** 2026-08-06  
**Last updated:** 2026-08-06  
**Related pricing:** `docs/strategy/merchant-pricing-packaging-unit-economics.md`  
**Related entitlement spec:** `docs/product/specs/merchant-commercial-entitlements.md`  
**Related provider risk:** `docs/strategy/merchant-provider-risk-and-fallback-economics.md`  
**Related sales demo:** `docs/product/specs/visutry-store-sales-demo.md`

---

## 1. Objective

Operationalize the current Market Capture conclusion:

> **Offer VTO capacity that is easy for merchants to compare and accept, then win on Recommendation + Compare + Intent Intelligence.**

The current Pilot should not create a visible disadvantage on raw VTO capacity.

---

## 2. Current External Commercial Baseline

The active standard external offer is:

> **Founding Merchant Pilot — $149 / 30 days**

Included:

- merchant's own frames;
- 8–50 reviewed catalog items;
- personalized AI recommendation;
- AI Try-On;
- multi-frame Compare;
- Product Click / Favorite / Inquiry tracking;
- merchant intent report;
- assisted setup;
- weekly review;
- **up to 1,500 AI-assisted shoppers / Commerce Sessions**;
- **up to 3,500 Standard Try-On generations**.

Optional approved launch bonus:

> **up to 5,000 Standard Try-On generations** for selected early merchants.

The bonus must be recorded as a commercial exception.

---

## 3. Sales Messaging Contract

### Primary pitch

> **You get a competitive virtual try-on package, but VisuTry also helps shoppers decide what to try. For $149, we run a 30-day Pilot with your real frames: personalized recommendations, Try-On, Compare, and measurable shopper-intent signals. We handle the initial setup.**

### Capacity wording

> **The Pilot includes up to 1,500 AI-assisted shoppers and 3,500 Standard Try-On generations.**

### Direct VTO comparison

> **We designed the Founding Pilot to be competitive on VTO capacity as well. You are not paying more just to get fewer try-ons. VisuTry adds recommendation, comparison and intent insight on top of the VTO experience.**

### ROI objection

> **We do not want to overclaim revenue uplift before deeper commerce integration exists. The first Pilot measures whether shoppers use recommendation, Try-On and Compare, and which products create stronger purchase intent.**

### Close

> **The simplest next step is a 30-day Pilot for $149. We set up 8–50 of your frames, include up to 1,500 AI-assisted shoppers and 3,500 Try-On generations, and review the results with you before you decide whether to continue.**

---

## 4. P0 — Server-Side Pilot Entitlement

Required:

- `planCode = FOUNDING_PILOT`;
- `commercialStage = MARKET_CAPTURE`;
- pricing version = v8 or equivalent durable identifier;
- entitlement version = v8 or equivalent;
- billing period = 30 days;
- contract price = $149 unless approved exception;
- Commerce Session allowance = **1,500**;
- Standard Render allowance = **3,500**;
- Premium allowance = 0 unless granted;
- campaign allowance = 1;
- catalog guideline = 8–50;
- server-side usage enforcement;
- audited manual extension/bonus support.

Founding Launch Bonus implementation:

```text
commercialExceptionCode = FOUNDING_LAUNCH_BONUS
standardRenderAllowance = up to 5000
```

---

## 5. P0 — Dual Usage Meter

Commerce Session:

- count once when shopper enters the AI recommendation/decision journey;
- idempotent across refresh/retry/polling/Compare reopen.

Render meter:

- count successful Standard/Premium Try-On renders separately;
- record provider/model/cost version/fallback reason;
- reconcile to merchant/session/campaign.

Do not impose a fixed two-render shopper UX.

---

## 6. P0 — Provider Routing and Cost Observability

Required architecture:

```text
Commercial Quality Policy
        ↓
Provider Router
        ↓
Approved Primary Provider
        ↓ failure / policy
Approved Fallback Provider
```

The application must support current low-cost procurement without exposing a provider dependency to merchants.

Required reporting:

- actual Standard render COGS;
- actual cost per Commerce Session;
- provider mix;
- fallback rate;
- renders/session distribution;
- merchant-level AI COGS.

---

## 7. P0 — Intent Event Instrumentation

Required events:

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

Do not delay Pilot for checkout/order events.

---

## 8. P1 — Merchant/Admin Presentation

Merchant-facing hierarchy:

```text
1. Shopping / decision funnel
2. Top frames and high-intent journeys
3. Source / campaign context
4. Usage / capacity status
```

Usage may show:

```text
AI-assisted shoppers: 420 / 1,500
Standard Try-On generations: 910 / 3,500
```

If a Founding Launch Bonus exists, display the merchant's actual contractual allowance without exposing internal exception terminology.

---

## 9. P1 — Pilot Operations Package

Sales package must contain:

- one-page $149 / 30-day offer;
- value proposition before usage details;
- competitive capacity line: 1,500 shoppers / 3,500 Try-On generations;
- assisted setup statement;
- no revenue-uplift guarantee;
- no lifetime-price statement;
- direct VTO comparison talk track;
- post-Pilot review statement.

Operations must capture:

- merchant's named competitors/alternatives;
- objection to VTO price/volume, if any;
- time to close;
- onboarding hours;
- render utilization;
- shopper entry rate;
- continuation intent.

---

## 10. P1 — Limit and Extension Behavior

States:

```text
NORMAL
APPROACHING_LIMIT
LIMIT_REACHED
MANUAL_EXTENSION
OVERAGE_ENABLED
```

Pilot behavior:

- internal alert at ~80%;
- no surprise overage charge;
- do not interrupt a strategically important Pilot without Sales/Product review;
- manual extension allowed;
- Founding Launch Bonus may raise Standard Render Pool up to 5,000;
- all exceptions auditable.

---

## 11. Market-Capture Procurement Policy

For the first 3–6 months, current low-cost procurement may be deliberately used to support aggressive merchant capacity.

Engineering must make this reversible:

- customer entitlement is versioned;
- provider routing is abstracted;
- cost telemetry is available;
- new pricing versions can change allowance for new cohorts;
- sustained provider-cost deterioration triggers review.

Do not encode the current provider's unit cost into merchant-facing semantics.

---

## 12. Future Pricing Productization

Do not automatically implement the previous $199 / $499 / $999 hypotheses as public plans.

After the first cohort, Product/Sales/Finance should create a new Early Scale pricing version from evidence.

Possible future structure may differ materially from v8.

Engineering should preserve flexibility for:

- plan price changes;
- different session/render ratios;
- usage add-ons;
- campaign pricing;
- Premium rendering;
- setup fee;
- enterprise/API packaging.

---

## 13. Review Gates

### After first paid merchant

Review whether the increased capacity removed the obvious VTO comparison objection.

### After 3 paid merchants

Review:

- close rate;
- competitor comparisons;
- actual Standard Render Pool utilization;
- actual AI COGS;
- onboarding/support burden;
- willingness to pay;
- continuation intent.

### After 5 paid merchants

Decide whether to change price/capacity or continue the Founding offer.

### 3–6 month gate

Create the next pricing/entitlement version. Do not preserve v8 by default.

---

## 14. Stage-Based GM Rules

| Stage | GM guidance |
| --- | ---: |
| Market Capture / Pilot | **50–65% acceptable** |
| Early Scale | **60–70%+ target** |
| Mature Platform | **70–80% target** |
| Long-term preferred benchmark | **~75%+ blended** |

A 75% projected GM is not a Pilot acceptance requirement.

The v8 Pilot is allowed to invest procurement alpha in competitive capacity during Market Capture.

---

## 15. Acceptance Criteria Before External Paid Pilot

1. `FOUNDING_PILOT` and `MARKET_CAPTURE` are durable.
2. Pricing/entitlement versioning works.
3. Commerce Session allowance = 1,500.
4. Standard Render allowance = 3,500.
5. Optional audited bonus can raise renders to 5,000.
6. Usage meters are idempotent.
7. provider/model/cost attribution is recoverable.
8. intent events work.
9. source/campaign context persists.
10. merchant dashboard prioritizes intent before quota.
11. Sales can state a competitive VTO capacity clearly.
12. Sales does not promise revenue uplift or lifetime pricing.
13. Consumer entitlements remain isolated.

---

## 16. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | v1–v7 | Built merchant pricing/entitlement execution framework. |
| 2026-08-06 | **v8: changed active Pilot entitlement from 500 sessions / 1,000 renders to 1,500 sessions / 3,500 renders; added optional 5,000-render Founding Launch Bonus; made procurement alpha an explicit temporary Market Capture lever and stopped treating previous Launch/Growth/Scale hypotheses as automatic public plans.** |
