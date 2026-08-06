# Merchant Pricing & Entitlement Implementation Plan

**Status:** Approved execution plan for Demo revision and Pilot readiness — Intent-First AI Commerce v5  
**Owner:** Product / Engineering / Sales  
**Created:** 2026-08-06  
**Last updated:** 2026-08-06  
**Related pricing:** `docs/strategy/merchant-pricing-packaging-unit-economics.md`  
**Related entitlement spec:** `docs/product/specs/merchant-commercial-entitlements.md`  
**Related provider risk:** `docs/strategy/merchant-provider-risk-and-fallback-economics.md`

---

## 1. Objective

Turn the merchant pricing model into an operational product contract before the first external paid pilots.

Operating rule:

> **What Sales quotes, what the merchant receives, what the UI shows, what the backend meters, and what Finance expects must describe the same product.**

Commercial rule:

> **Merchant Value First. Sustainable Economics Always. Margin Expansion Over Time.**

Early-stage value rule:

> **Pilot proves personalized shopping decisions and measurable purchase intent. It does not require revenue attribution or incrementality infrastructure.**

This prevents the first Merchant MVP from becoming unnecessarily integration-heavy.

---

## 2. Immediate Commercial Baseline

Current internal anchors:

- Founding Pilot: **$149 / 30 days / 500 AI Commerce Sessions / 1,000 Standard renders**;
- Launch: **$199/month / 750 sessions / 1,500 Standard renders**;
- Growth: **$499/month / 1,500 sessions / 3,000 Standard renders**;
- Scale: **$999/month / 4,000 sessions / 8,000 Standard renders**;
- Enterprise: **$2,500+/month / custom**;
- annual prepay: 10 months paid / 12 months service;
- referral partner: 20% of collected recurring revenue for first 12 months;
- agency / solution partner: up to 30% recurring margin;
- Standard/Premium render pools are cost meters;
- AI Commerce Session is the merchant-facing shopper-capacity unit.

Economics are reviewed under Best / Base / Stress provider cases.

---

## 3. Value-Maturity Boundary

Engineering and Sales must use three evidence levels.

### Level 1 — Current Pilot Scope: Observed Intent

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

Requires merchant commerce integration or order-data access:

- attributed orders;
- attributed revenue;
- checkout linkage;
- downstream conversion analysis.

This is not required for the first Pilot.

### Level 3 — Future: Incrementality

Requires credible experiment design:

- A/B or holdout;
- conversion uplift;
- incremental orders;
- incremental revenue / GMV;
- causal ROI.

This is explicitly outside first-Pilot scope.

---

## 4. Stage-Based GM Operating Rules

Engineering and Sales should not treat 75% as a hard Pilot acceptance criterion.

| Stage | GM guidance |
| --- | ---: |
| Pilot / Market Capture | **50–65% acceptable** |
| Early Scale | **60–70%+ target** |
| Mature Platform | **70–80% target** |
| Long-term preferred benchmark | **~75%+ blended** |

Sustained direct GM below ~50% requires explicit approval.

---

## 5. P0 — Sales Demo Must Prove Current Merchant Value

### Shopper Demo

The demo must prove:

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

- plan/Pilot status;
- Commerce Sessions used / allowance;
- Standard renders used / allowance;
- source/campaign traffic;
- recommendation funnel;
- Try-On / Compare funnel;
- Product Click / Favorite / Inquiry;
- top frames;
- high-intent shopper signals.

Do **not** make attributed revenue, ROI, conversion uplift or incremental GMV part of the standard Pilot demo.

Sales close:

> **Start a 30-day Founding Merchant Pilot with your own frames for $149, including up to 500 AI Commerce Sessions and 1,000 Standard Try-On renders.**

Primary sales promise:

> **Turn eyewear traffic into personalized shopping decisions and measurable purchase intent.**

---

## 6. P0 — Server-Side Pilot Entitlement

Required:

- `FOUNDING_PILOT` assignment;
- billing period;
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

## 7. P0 — Dual Usage Meter

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

## 8. P0 — Intent Event Instrumentation

The first Pilot must have durable, merchant-scoped events for:

```text
COMMERCE_SESSION_STARTED
RECOMMENDATION_COMPLETED
TRYON_COMPLETED
COMPARE_VIEWED
FAVORITE_ADDED
PRODUCT_CLICKED
INQUIRY_STARTED / INQUIRY_SUBMITTED
```

Each event should preserve where available:

```text
merchantId
merchantSessionId
campaignId?
source/referrer?
frame/productId?
timestamp
```

These events form the first sellable Commerce Intelligence layer.

Do not delay Pilot to implement order or checkout events.

---

## 9. P0 — Provider Routing and Cost Observability

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

## 10. P0 — Partner Attribution

Required concepts:

```text
merchantId
acquisitionType: DIRECT | REFERRAL_PARTNER | AGENCY_PARTNER | STRATEGIC_PARTNER
partnerId?
commercialNote?
commissionStartAt?
commissionEndAt?
```

Merchant-partner attribution should be durable even if payout calculation is manual initially.

---

## 11. P1 — Pilot Operations Package

### Sales

Prepare:

- Founding Pilot one-page offer;
- $149 / 30 days;
- 500 sessions;
- 1,000 Standard renders;
- included/excluded scope;
- explicit Intent-First value proposition;
- no revenue-attribution or guaranteed-uplift language;
- continuation path to Launch/Growth/Scale.

### Product / Operations

Prepare:

- onboarding checklist;
- CSV template;
- catalog review workflow;
- campaign/source worksheet;
- merchant KPI selection focused on intent;
- weekly report;
- end-of-Pilot continuation review.

Weekly report should prioritize:

- traffic routed into VisuTry;
- AI experience entry rate;
- recommendation/Try-On/Compare funnel;
- Product Click / Favorite / Inquiry;
- top frames;
- usage and qualitative merchant feedback.

### Engineering

Prepare:

- entitlement assignment;
- dual meters;
- intent event model;
- source continuity;
- provider/cost observability;
- privacy/retention;
- monitoring;
- Consumer regression checks.

---

## 12. P1 — Pricing-Aware Admin Surface

Pilot minimum:

```text
Plan: Founding Pilot
Billing period: <date> – <date>
AI Commerce Sessions: 236 / 500
Standard Renders: 418 / 1,000
Active Campaigns: 1 / 1
Standard Quality: Enabled
Premium Quality: Not enabled
```

Merchant-facing analytics should show:

- recommendation completion;
- Try-On / Compare;
- Product Clicks;
- Favorites;
- Inquiries;
- top frames;
- source/campaign mix;
- usage.

Internal admin should additionally show:

- average renders/session;
- provider/model;
- actual estimated AI COGS;
- Base Case modeled COGS;
- fallback usage;
- support notes;
- partner source;
- commercial exception.

Do not expose provider or margin internals to the merchant.

---

## 13. P1 — Limit, Extension and Market-Capture Policy

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
- Product/Sales may extend capacity when additional traffic creates high-value learning or case-study evidence;
- an extension should remain gross-profit positive where possible, or receive explicit strategic approval.

Working post-Pilot anchors:

- +500 Standard renders = $49;
- +1,000 Standard renders = $99.

---

## 14. P1 — Premium Quality Switch

Implement:

- `STANDARD | PREMIUM` policy;
- server-side provider/model resolution;
- entitlement check;
- independent Premium meter;
- temporary Premium evaluation allowance.

+$99 Premium remains provisional until quality and sustainable cost are validated.

---

## 15. P2 — Formal Plan Productization

Do not fully productize Launch/Growth/Scale before Pilot evidence.

Versioned entitlements:

```text
LAUNCH
  750 Commerce Sessions
  1,500 Standard Renders

GROWTH
  1,500 Commerce Sessions
  3,000 Standard Renders

SCALE
  4,000 Commerce Sessions
  8,000 Standard Renders

ENTERPRISE
  Custom
```

Formal productization requires evidence that merchants understand and value the package, not only acceptable modeled GM.

Revenue attribution is not required for Launch/Growth productization.

---

## 16. P2 — Campaign as Expansion Object

Promote Campaign to a first-class Commerce entity when merchants need persistent multi-campaign workflow.

Campaign and Intent Intelligence should increase merchant value faster than AI COGS.

Do not build a generalized marketing automation suite prematurely.

---

## 17. P3 — Commerce Integration, Only When Justified

Commerce integration becomes justified when repeated merchant demand requires downstream measurement.

Possible triggers:

- multiple paying merchants ask for order linkage;
- merchant renewal depends on attributed conversion evidence;
- Shopify/WooCommerce integration materially reduces sales friction;
- enough traffic exists to make downstream analysis meaningful.

Then consider:

- product/cart/order event integration;
- `visutry_session_id` continuity;
- attributed order/revenue reporting;
- merchant order-data import.

Do not call attributed revenue incremental revenue.

---

## 18. P4 — Incrementality, Only After Scale

Incrementality requires credible experimentation.

Potential future methods:

- A/B traffic split;
- holdout cohort;
- campaign split;
- geo split;
- matched control where appropriate.

Only after such evidence may product/reporting use claims such as:

- conversion uplift;
- incremental orders;
- incremental GMV.

This is not an early engineering priority.

---

## 19. Required Instrumentation — Current Economics + Value

### Revenue / acquisition

- contracted price;
- collected amount;
- discounts/credits;
- partner relationship;
- CAC where measurable.

### AI cost

- recommendation count;
- Standard/Premium renders;
- provider/model;
- unit-cost mapping;
- fallback events;
- renders/session;
- actual AI COGS;
- Base Case COGS.

### Merchant demand

- monthly merchant traffic;
- traffic routed to VisuTry;
- AI experience entry rate.

### Current commerce-intent value

- recommendation completion;
- Try-On;
- Compare;
- Product Click;
- Favorite;
- Inquiry;
- top frames;
- source/campaign intent distribution;
- merchant-perceived value;
- continuation/expansion intent.

### Human delivery

- onboarding/catalog/campaign/QA/support time.

Orders/revenue are optional where already available; they are not required Pilot instrumentation.

---

## 20. Pilot Review Gates v5

### After first merchant

Review:

- meter correctness;
- intent event correctness;
- renders/session;
- provider/cost attribution;
- merchant understanding;
- onboarding/support effort;
- initial perceived value.

### After 3 merchants

Review:

- whether 500 Pilot sessions are enough for meaningful traffic;
- render utilization;
- $149 willingness to pay;
- traffic-to-AI entry rate;
- Product Click / Favorite / Inquiry behavior;
- merchant-perceived value;
- actual gross profit / GM;
- whether a lower-GM extension would increase learning or market capture.

### After 5 merchants

Decide whether Launch/Growth are market-ready.

Decision priority:

1. merchant understands differentiated value;
2. merchant wants to continue / expand traffic;
3. willingness to pay;
4. observed purchase-intent behavior;
5. sustainable positive unit economics;
6. current-period GM percentage.

Do not require attributed revenue.

### After 10 paying merchants

Recalculate:

- sustainable provider cost;
- actual GM and gross profit by plan;
- retention/expansion;
- support cost;
- partner contribution;
- overage design;
- annual economics;
- whether commerce integration has become commercially justified.

---

## 21. Acceptance Criteria Before First External Paid Pilot

1. `FOUNDING_PILOT` scope approved.
2. 500 Commerce Sessions server-metered.
3. 1,000 Standard renders server-metered.
4. meters idempotent.
5. usage reconciles to merchant/session/provider.
6. core intent events are durable and merchant-scoped.
7. provider routing is abstracted.
8. partner/direct source can be recorded.
9. source/campaign context persists to Product Click / Favorite / Inquiry.
10. merchant/admin shows meaningful funnel, intent and usage data.
11. Sales promises only implemented/assisted capabilities.
12. no attributed-revenue, conversion-uplift or incremental-GMV claim unless separately supported.
13. Consumer isolation/privacy remains intact.

A 75% projected GM is not an acceptance criterion. Revenue attribution is also not an acceptance criterion.

---

## 22. Non-Goals Before Pilot Evidence

Do not delay Pilot for:

- checkout/order integration;
- revenue attribution infrastructure;
- A/B incrementality framework;
- advanced multi-touch attribution;
- full self-checkout;
- partner portal/automated payouts;
- generalized coupon system;
- performance-fee settlement;
- enterprise CPQ;
- generalized campaign builder;
- public Shopify marketplace listing.

---

## 23. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created pricing/entitlement implementation plan. |
| 2026-08-06 | v2: sustainable procurement + Provider Router. |
| 2026-08-06 | v3: dual-meter market-aware packaging. |
| 2026-08-06 | v4: introduced AI-native stage-based GM and market-capture economics. |
| 2026-08-06 | **v5: refocused first Pilot on observable shopping intent rather than revenue attribution. Added durable intent events, separated current intent / later attribution / future incrementality, made commerce integration P3 and incrementality P4, and removed both from first-Pilot acceptance criteria.** |
