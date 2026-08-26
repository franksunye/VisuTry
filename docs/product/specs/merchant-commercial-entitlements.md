# VisuTry Merchant Commercial Entitlements Spec

**Status:** Approved Demo/Pilot baseline — Market-Capture Competitive Offer v8  
**Owner:** Product / Engineering / Sales  
**Created:** 2026-08-06  
**Last updated:** 2026-08-06  
**Related pricing:** `docs/strategy/merchant-pricing-packaging-unit-economics.md`  
**Related provider risk:** `docs/strategy/merchant-provider-risk-and-fallback-economics.md`  
**Related sales demo:** `docs/product/specs/visutry-store-sales-demo.md`  
**Related implementation plan:** `docs/product/plans/merchant-pricing-entitlement-implementation-plan.md`

---

## 1. Purpose

This spec translates the current Market Capture pricing conclusion into durable product entitlement and server-side metering requirements.

Operating rule:

> **Sales promise = merchant value = product entitlement = server-side policy = measurable usage.**

Current commercial rule:

> **Competitive VTO first; differentiated AI commerce value on top.**

Current-stage value remains:

> **AI-powered shopping decision experience + measurable purchase-intent intelligence.**

---

## 2. Current External Entitlement — Founding Merchant Pilot v8

Commercial anchor:

> **$149 / 30 days**

Merchant-facing package:

- one hosted merchant-specific AI shopping experience;
- 8–50 reviewed merchant frames;
- personalized frame recommendation;
- Standard Try-On;
- Frame Compare;
- Product Click / Favorite / Inquiry intent signals;
- source/campaign continuity;
- merchant intent-performance view;
- assisted setup;
- weekly Pilot review.

Market-capture capacity:

- **1,500 AI Commerce Sessions / AI-assisted shoppers**;
- **3,500 Standard Try-On renders**;
- one active hosted Store / campaign experience;
- Premium allowance = 0 unless explicitly granted.

Optional commercial exception:

> **FOUNDING_LAUNCH_BONUS: Standard Render allowance may be increased up to 5,000 for selected early merchants.**

The bonus must be explicitly recorded and time-boxed. It is not the default permanent entitlement.

---

## 3. Why Capacity Is Higher in v8

The first Pilot must not be materially weaker than familiar VTO alternatives on the buyer's easiest comparison dimension.

The entitlement therefore implements a **competitive floor**:

> enough VTO capacity that Sales does not need to defend a visibly inferior usage allowance.

VisuTry's differentiated upside remains:

- recommendation;
- shortlist/decision support;
- Compare;
- merchant-specific catalog intelligence;
- Product Click / Favorite / Inquiry measurement;
- source/campaign context;
- assisted onboarding and review.

The commercial intent is not to become a commodity VTO vendor. It is to remove the commodity objection before introducing the broader value.

---

## 4. Commercial Stage and Versioning

Canonical commercial stages:

```text
MARKET_CAPTURE
EARLY_SCALE
MATURE_PLATFORM
```

Canonical plan codes:

```text
FOUNDING_PILOT
LAUNCH
GROWTH
SCALE
ENTERPRISE
```

Minimum durable fields should eventually include:

```text
commercialStage
pricingVersion
entitlementVersion
effectiveFrom
planCode
billingStatus
billingPeriodStart
billingPeriodEnd
commerceSessionAllowance
commerceSessionsUsed
standardRenderAllowance
standardRendersUsed
premiumRenderAllowance?
premiumRendersUsed?
campaignAllowance
contractPrice
listPrice
approvedDiscount?
commercialExceptionCode?
partnerId?
```

Price and entitlement version must be independently changeable.

---

## 5. Evidence-Level Rule

### Level 1 — Current / Observed Intent

Primary Pilot analytics:

- Commerce Sessions;
- recommendation completion;
- Try-On;
- Compare;
- Product Click;
- Favorite;
- Inquiry;
- source/campaign context;
- top frames;
- high-intent behavior.

### Level 2 — Attributed Conversion

Requires commerce integration or order-data access.

### Level 3 — Incremental Outcome

Requires credible experiment design.

Revenue attribution and incrementality remain outside first-Pilot acceptance criteria.

---

## 6. AI Commerce Session Meter

An AI Commerce Session is one merchant-scoped shopper session that first reaches the AI recommendation / decision boundary.

Do not count ordinary page views.

The meter must be idempotent across refresh, retry, polling, Compare reopen and duplicated events.

Merchant-facing wording may use:

> **AI-assisted shopper**

while backend/accounting uses `AI Commerce Session`.

---

## 7. Standard Render Meter

Count each successful Standard Try-On render against the Standard Render Pool.

Record:

- attempt/success/failure;
- Standard/Premium;
- provider/model;
- merchant/session/campaign;
- unit-cost version;
- fallback reason;
- commercial exception where applicable.

The shopper experience must not enforce a fixed per-session render count merely because packaging uses an average for planning.

---

## 8. Limit / Extension Behavior

Supported states:

```text
NORMAL
APPROACHING_LIMIT
LIMIT_REACHED
MANUAL_EXTENSION
OVERAGE_ENABLED
```

Rules:

- server owns enforcement;
- warn internally before ~80% exhaustion;
- Pilot merchants receive no surprise overage charge;
- manual extension may be granted with audit trail;
- selected early merchants may receive the Founding Launch Bonus up to 5,000 Standard renders;
- limit handling never touches Consumer credits/subscriptions.

---

## 9. Procurement-Alpha-Aware Entitlement Rule

During `MARKET_CAPTURE`, entitlement may deliberately use current low-cost provider economics to increase competitive capacity.

This is allowed because the current objective is merchant acquisition and learning.

However:

- the pricing/entitlement version must identify the offer as Market Capture;
- the contract must not imply lifetime capacity;
- a later pricing version may change price and/or allowance;
- entitlement must remain provider-neutral at the product-contract level;
- sustained provider-cost deterioration triggers commercial review.

## 9.1 Merchant billing boundary

The current `FOUNDING_PILOT` commercial flow is assisted and manually
provisioned. Consumer Credits Pack / subscription checkout remains a separate
Consumer product and must not be presented as merchant billing.

Merchant self-service subscription checkout, invoices, billing-portal and
payment-method management, automatic renewal provisioning, and a merchant
self-service sponsored-quota editor are deferred until paid-merchant demand
and operating evidence justify a distinct merchant billing system. Admin may
show merchant plan, capacity, and usage visibility where those surfaces are
implemented; visibility alone does not imply self-service billing.

---

## 10. Sales Presentation Rule

Sales should normally present:

> **$149 / 30-day Founding Merchant Pilot**

then the value package, then the capacity:

> **up to 1,500 AI-assisted shoppers and 3,500 Standard Try-On generations.**

Unlike v7, the capacity is now deliberately competitive enough that it can be stated confidently when the merchant asks for a direct VTO comparison.

Do not describe the product primarily as a price-per-render package.

---

## 11. Future Entitlements — Not Locked

The previous Launch / Growth / Scale entitlement matrix is no longer an approved external baseline.

Future recurring entitlements must be created as a new pricing/entitlement version after evidence from the first merchant cohort.

They may use different:

- price;
- session allowance;
- render allowance;
- campaign allowance;
- catalog allowance;
- support model;
- integration level;
- overage model.

Do not hard-code historical $199 / $499 / $999 hypotheses as permanent product contracts.

---

## 12. Analytics Entitlement — Current Pilot

Merchant-facing analytics should prioritize:

1. shopping/decision funnel;
2. top frames and high-intent journeys;
3. source/campaign context;
4. usage/fair-use status.

Current metrics:

- AI-assisted shoppers / Commerce Sessions;
- recommendation completion;
- Try-On completion;
- Compare use;
- Product Click;
- Favorite;
- Inquiry;
- top frames;
- usage of Standard Render Pool.

---

## 13. Pilot Data Required

### Sales / competitive evidence

- competitor named by merchant;
- whether merchant compared raw VTO capacity;
- whether 3,500 generations removed price/volume objection;
- $149 willingness to pay;
- decision time;
- continuation intent;
- willingness to route more traffic.

### Usage / AI economics

- Commerce Sessions;
- renders/session;
- Standard Render Pool utilization;
- actual provider mix;
- actual AI COGS;
- fallback usage;
- bonus usage where granted.

### Delivery economics

- onboarding time;
- catalog-preparation time;
- support time;
- gross profit dollars;
- actual GM.

---

## 14. Acceptance Criteria Before External Paid Pilot

1. Merchant has `FOUNDING_PILOT` and `MARKET_CAPTURE` assigned.
2. Pricing and entitlement versions are durable.
3. Commerce Session allowance = **1,500**.
4. Standard Render allowance = **3,500** by default.
5. Optional Founding Launch Bonus can raise Standard Render allowance to **5,000** with audit trail.
6. Both meters are durable and idempotent.
7. Provider identity does not change merchant-facing entitlement semantics.
8. Intent events persist with merchant/session context.
9. Merchant/Admin shows decision/intent data before quota data.
10. Sales can state a competitive VTO capacity without making revenue-ROI claims.
11. No lifetime price/capacity promise is implied.
12. Consumer usage counters remain isolated.

---

## 15. Review Window

The v8 entitlement is deliberately provisional for the initial **3–6 month Market Capture period**.

Review earlier after:

- 3 paid merchants;
- material competitor price change;
- material provider-cost change;
- repeated exhaustion of included capacity;
- strong evidence that merchant WTP is higher/lower than assumed.

---

## 16. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | v1–v7 | Built sustainable, dual-meter, Intent-First, stage-based and sales-first entitlement architecture. |
| 2026-08-06 | **v8: finalized Market Capture entitlement at $149 / 30 days with 1,500 AI Commerce Sessions and 3,500 Standard Try-On renders; added optional 5,000-render Founding Launch Bonus and formalized temporary use of procurement alpha to maintain competitive VTO capacity during the first 3–6 months.** |
