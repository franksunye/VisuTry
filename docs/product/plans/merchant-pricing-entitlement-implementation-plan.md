# Merchant Pricing & Entitlement Implementation Plan

**Status:** Approved execution plan for Demo revision and Pilot readiness — Stage-Based Intent-First Pricing v6  
**Owner:** Product / Engineering / Sales  
**Created:** 2026-08-06  
**Last updated:** 2026-08-06  
**Related pricing:** `docs/strategy/merchant-pricing-packaging-unit-economics.md`  
**Related entitlement spec:** `docs/product/specs/merchant-commercial-entitlements.md`  
**Related provider risk:** `docs/strategy/merchant-provider-risk-and-fallback-economics.md`

---

## 1. Objective

Turn the current Merchant pricing model into an operational product contract for the first external paid Pilots, while preserving the ability to change pricing as product maturity and market evidence evolve.

Operating rule:

> **What Sales quotes, what the merchant receives, what the UI shows, what the backend meters, and what Finance expects must describe the same product.**

Commercial rule:

> **Merchant Value First. Sustainable Economics Always. Margin Expansion Over Time.**

Current-stage rule:

> **The Founding Pilot should be easy to understand and easy to try even before VisuTry can prove downstream revenue attribution.**

---

## 2. Pricing Is Stage-Based

Engineering and Sales must not treat Pilot, Early Scale and Mature Platform pricing as one permanent price card.

| Stage | Main objective | GM guidance | Product / pricing implication |
| --- | --- | ---: | --- |
| Market Capture / Pilot | close first merchants and learn quickly | 50–65% acceptable | low-friction Pilot, assisted setup, bounded term |
| Early Scale | repeatable recurring revenue | 60–70%+ target | validated plan tiers, clearer allowances and upgrades |
| Mature Platform | monetize differentiated platform value | 70–80% target | higher ARPU, integrations, enterprise/API, advanced intelligence |
| Long-term | strong blended economics | ~75%+ blended | optimize plan mix and margin trajectory |

A Pilot price is therefore not a commitment to preserve the same price indefinitely.

---

## 3. Current External Commercial Baseline

The **only current standard external sales anchor** is:

> **Founding Merchant Pilot — $149 / 30 days**

Included:

- 500 AI Commerce Sessions;
- 1,000 Standard renders;
- 1 hosted Store / campaign experience;
- 8–50 reviewed merchant frames;
- recommendation;
- Try-On;
- Compare;
- Product Click / Favorite / Inquiry tracking;
- source/campaign context;
- merchant intent report;
- assisted onboarding;
- weekly review.

Primary sales promise:

> **Turn eyewear traffic into personalized shopping decisions and measurable purchase intent.**

Do not standardize Launch/Growth/Scale as public commitments before Pilot evidence approves them.

---

## 4. Future Pricing Hypotheses

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

They may change with merchant evidence, market pricing, product maturity, provider economics and support burden.

---

## 5. Value-Maturity Boundary

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

Requires merchant commerce integration or order-data access.

Not required for the first Pilot.

### Level 3 — Future: Incrementality

Requires credible experiment design.

Explicitly outside first-Pilot scope.

---

## 6. P0 — Sales Demo Must Make the Pilot Easy to Buy

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
- Commerce Sessions used / allowance;
- Standard renders used / allowance;
- source/campaign traffic;
- recommendation funnel;
- Try-On / Compare funnel;
- Product Click / Favorite / Inquiry;
- top frames;
- high-intent shopper signals.

Do **not** make attributed revenue, ROI, conversion uplift or incremental GMV part of the standard Pilot demo.

### Sales close

Use:

> **Start a 30-day Founding Merchant Pilot with your own frames for $149. We provide the AI shopping experience, track recommendation / Try-On / Compare and show you measurable shopper intent.**

The merchant should be able to compare this with existing VTO / optical-commerce tools without needing a complex attribution explanation.

---

## 7. P0 — Server-Side Pilot Entitlement

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

## 8. P0 — Pricing Versioning Support

The system must not assume one price per plan forever.

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

Requirements:

1. Historical merchant contract terms remain auditable.
2. New pricing may be activated for new merchants without mutating old contracts.
3. Renewal may move a merchant to a newer pricing version when contract/Sales policy permits.
4. Pricing and entitlement can evolve independently.
5. Founding Pilot price is not represented as lifetime pricing.

A full CPQ system is not required.

---

## 9. P0 — Dual Usage Meter

### Commerce Session

Count once when the shopper first enters the AI decision journey.

Must be idempotent across refresh, retry, polling, Compare reopen and duplicate events.

### Render Meter

Record separately:

- Standard/Premium attempts and successes;
- failures/retries;
- provider/model;
- merchant/session/campaign;
- unit-cost version;
- fallback reason.

The UI must not enforce a fixed two-frame limit merely because packaging assumes ~2 renders/session.

---

## 10. P0 — Intent Event Instrumentation

The first Pilot must have durable merchant-scoped events for:

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

Preserve where available:

```text
merchantId
merchantSessionId
campaignId?
source/referrer?
frame/productId?
timestamp
```

Do not delay Pilot to implement order or checkout events.

---

## 11. P0 — Provider Routing and Cost Observability

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

Product/Finance must be able to calculate actual and Base/Stress economics by merchant/cohort.

---

## 12. P1 — Pilot Operations Package

### Sales

Prepare:

- Founding Pilot one-page offer;
- $149 / 30-day term;
- 500 sessions / 1,000 Standard renders;
- included/excluded scope;
- Intent-First value proposition;
- no revenue-attribution or guaranteed-uplift language;
- explicit statement that Pilot pricing is a founding-stage offer and post-Pilot plans may differ.

### Product / Operations

Prepare:

- onboarding checklist;
- CSV template;
- catalog review workflow;
- source/campaign worksheet;
- weekly intent report;
- end-of-Pilot continuation review.

### Engineering

Prepare:

- pricing/entitlement version assignment;
- dual meters;
- intent events;
- source continuity;
- provider/cost observability;
- privacy/retention;
- monitoring;
- Consumer regression checks.

---

## 13. P1 — Pilot Pricing-Aware Admin

Pilot minimum:

```text
Commercial Stage: Market Capture
Plan: Founding Pilot
Pricing Version: <version>
Billing period: <date> – <date>
AI Commerce Sessions: 236 / 500
Standard Renders: 418 / 1,000
Active Campaigns: 1 / 1
```

Internal admin may additionally show:

- contract price;
- approved discount;
- partner source;
- average renders/session;
- actual AI COGS;
- Base Case COGS;
- fallback usage;
- commercial exception.

Do not expose internal margin or provider details to the merchant.

---

## 14. P1 — Limit, Extension and Market-Capture Policy

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

Working future overage anchors remain provisional:

- +500 Standard renders = $49;
- +1,000 Standard renders = $99.

---

## 15. P2 — Pricing Review Before Formal Plan Productization

Do not productize Launch/Growth/Scale solely because the engineering entitlement exists.

Before formal public plans, review:

- Pilot close rate;
- sales objections;
- merchant comparison products;
- willingness to pay;
- continuation rate;
- willingness to route more traffic;
- actual session/render usage;
- merchant-perceived differentiation;
- support burden;
- actual GM / gross profit;
- partner economics.

Then create a **new pricing version** for Early Scale.

The new version may preserve, raise, lower or restructure the current $199 / $499 / $999 hypotheses.

---

## 16. Pricing Review Gates

### After first paid merchant

Review:

- was $149 easy to explain?
- was approval friction low enough?
- did the merchant understand value without ROI attribution?
- were 500 sessions / 1,000 renders enough?

### After 3 paid merchants

Review:

- objections and competitor comparisons;
- willingness to pay;
- continuation intent;
- usage and support;
- actual GM.

Pricing is explicitly allowed to change here.

### After 5 paid merchants

Decide:

- whether Pilot remains $149;
- whether capacity changes;
- whether assisted setup remains included;
- whether Launch should be productized;
- whether future recurring pricing should move up/down or change structure.

### After 10 paying merchants

Create the next formal pricing/entitlement version based on actual evidence.

### Later maturity gates

Review again when:

- Campaign becomes a paid first-class object;
- commerce integrations are standard;
- intent analytics materially differentiate VisuTry;
- Enterprise/API capabilities are sellable;
- AI procurement cost materially changes.

---

## 17. Stage-Based GM Operating Rules

| Stage | GM guidance |
| --- | ---: |
| Pilot / Market Capture | **50–65% acceptable** |
| Early Scale | **60–70%+ target** |
| Mature Platform | **70–80% target** |
| Long-term preferred benchmark | **~75%+ blended** |

A 75% projected GM is **not** an acceptance criterion for the first Pilot.

Sustained direct GM below ~50% requires explicit approval.

---

## 18. Acceptance Criteria Before First External Paid Pilot

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
12. Founding price is not presented as lifetime pricing.
13. Consumer isolation/privacy remains intact.

---

## 19. Non-Goals Before Pilot Evidence

Do not delay Pilot for:

- revenue attribution infrastructure;
- incrementality experiments;
- full self-checkout;
- public partner portal;
- automated partner payout;
- enterprise CPQ;
- generalized campaign builder;
- public Shopify marketplace listing.

---

## 20. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created pricing/entitlement implementation plan. |
| 2026-08-06 | v2: sustainable procurement + Provider Router. |
| 2026-08-06 | v3: dual-meter market-aware packaging. |
| 2026-08-06 | v4: Merchant Value First / stage-based GM. |
| 2026-08-06 | v5: Intent-First Pilot boundary; revenue attribution removed from Pilot scope. |
| 2026-08-06 | **v6: made pricing explicitly stage-based and versioned; designated $149 Founding Pilot as the current external standard offer while keeping Launch/Growth/Scale as internal hypotheses; added pricing-version data requirements, sales-friction review gates, customer-cohort protection and explicit post-Pilot repricing freedom.** |
