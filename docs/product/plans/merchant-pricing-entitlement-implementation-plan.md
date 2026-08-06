# Merchant Pricing & Entitlement Implementation Plan

**Status:** Approved execution plan for Demo revision and Pilot readiness — AI-Native Market Economics v4  
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

The implementation must not optimize only for a static 75% GM target. It must support market capture, real merchant usage, measurable value and improving economics over time.

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

## 3. Stage-Based GM Operating Rules

Engineering and Sales should not treat 75% as a hard Pilot acceptance criterion.

Use:

| Stage | GM guidance |
| --- | ---: |
| Pilot / Market Capture | **50–65% acceptable** |
| Early Scale | **60–70%+ target** |
| Mature Platform | **70–80% target** |
| Long-term preferred benchmark | **~75%+ blended** |

A lower-GM Pilot is acceptable if it creates valuable merchant evidence and remains within approved economics.

Sustained direct GM below ~50% requires explicit approval.

---

## 4. P0 — Sales Demo Must Prove Merchant Value

### Shopper Demo

The demo must prove:

1. merchant-specific catalog;
2. campaign/source context;
3. recommendation;
4. Try-On;
5. Compare;
6. product destination;
7. Favorite / Product Click / Inquiry;
8. anonymous-first flow.

### Merchant/Admin Demo

Show:

- plan/Pilot status;
- Commerce Sessions used / allowance;
- Standard renders used / allowance;
- source/campaign traffic;
- recommendation funnel;
- Try-On / Compare funnel;
- intent signals;
- top frames;
- high-intent / conversion signals where available.

The demo story must explain why VisuTry is more than VTO volume.

Sales close:

> **Start a 30-day Founding Merchant Pilot with your own frames for $149, including up to 500 AI Commerce Sessions and 1,000 Standard Try-On renders.**

---

## 5. P0 — Server-Side Pilot Entitlement

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

## 6. P0 — Dual Usage Meter

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

## 7. P0 — Provider Routing and Cost Observability

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

## 8. P0 — Partner Attribution

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

## 9. P1 — Pilot Operations Package

Prepare:

### Sales

- Founding Pilot one-page offer;
- $149 / 30 days;
- 500 sessions;
- 1,000 Standard renders;
- included/excluded scope;
- no guaranteed uplift language;
- continuation path to Launch/Growth/Scale.

### Product / Operations

- onboarding checklist;
- CSV template;
- catalog review workflow;
- campaign/source worksheet;
- merchant KPI selection;
- weekly report;
- end-of-Pilot ROI / continuation review.

### Engineering

- entitlement assignment;
- dual meters;
- source continuity;
- provider/cost observability;
- privacy/retention;
- monitoring;
- Consumer regression checks.

---

## 10. P1 — Pricing-Aware Admin Surface

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

## 11. P1 — Limit, Extension and Market-Capture Policy

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

Working post-pilot anchors:

- +500 Standard renders = $49;
- +1,000 Standard renders = $99.

---

## 12. P1 — Premium Quality Switch

Implement:

- `STANDARD | PREMIUM` policy;
- server-side provider/model resolution;
- entitlement check;
- independent Premium meter;
- temporary Premium evaluation allowance.

+$99 Premium remains provisional until quality and sustainable cost are validated.

---

## 13. P2 — Formal Plan Productization

Do not fully productize Launch/Growth/Scale before pilot evidence.

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

Formal productization requires evidence that merchants understand and value the package, not only that Finance can model acceptable GM.

---

## 14. P2 — Campaign as Expansion Object

Promote Campaign to a first-class Commerce entity when merchants need persistent multi-campaign workflow.

Campaign, analytics and Commerce Intelligence are strategically important because they should increase merchant value and revenue faster than AI COGS.

Do not build a generalized marketing automation suite prematurely.

---

## 15. Required Instrumentation — Economics + Value

Every Pilot must make these recoverable.

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

### Commerce value

- recommendation completion;
- Try-On;
- Compare;
- product clicks;
- favorites;
- inquiries;
- verified orders/revenue where available;
- merchant-reported conversion impact;
- merchant-perceived ROI.

### Human delivery

- onboarding/catalog/campaign/QA/support time.

---

## 16. Pilot Review Gates v4

### After first merchant

Review:

- meter correctness;
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
- merchant ROI narrative;
- actual gross profit / GM;
- whether a deliberate lower-GM extension would increase learning or market capture.

### After 5 merchants

Decide whether Launch/Growth are market-ready.

Decision priority:

1. merchant value / perceived differentiation;
2. retention / continuation intent;
3. willingness to pay;
4. sustainable positive unit economics;
5. current-period GM percentage.

### After 10 paying merchants

Recalculate:

- sustainable provider cost;
- actual GM and gross profit by plan;
- merchant ROI evidence;
- retention/expansion;
- support cost;
- partner contribution;
- overage design;
- annual economics.

### Quarterly after early scale

Review whether cohorts are moving toward **60–70%+ GM**, with a mature target of **70–80% / ~75% preferred blended benchmark**.

---

## 17. Margin-Trajectory Planning

Do not assume current AI cost remains constant for 3–5 years.

Track:

- equivalent-quality model cost over time;
- provider procurement improvements;
- average renders/session;
- Campaign/Intelligence revenue share;
- gross margin by cohort vintage.

The expected direction is margin expansion, but this is a planning thesis rather than a guaranteed forecast.

---

## 18. Acceptance Criteria Before First External Paid Pilot

1. `FOUNDING_PILOT` scope approved.
2. 500 Commerce Sessions server-metered.
3. 1,000 Standard renders server-metered.
4. meters idempotent.
5. usage reconciles to merchant/session/provider.
6. provider routing is abstracted.
7. partner/direct source can be recorded.
8. source/campaign context persists to intent.
9. merchant/admin shows meaningful funnel and usage data.
10. Sales promises only implemented/assisted capabilities.
11. no guaranteed conversion/revenue claim.
12. Consumer isolation/privacy remains intact.

A 75% projected GM is **not** an acceptance criterion for the first Pilot.

---

## 19. Non-Goals Before Pilot Evidence

Do not delay Pilot for:

- full self-checkout;
- partner portal/automated payouts;
- generalized coupon system;
- advanced multi-touch attribution;
- performance-fee settlement;
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
| 2026-08-06 | **v4: replaced 75%-GM-first execution criteria with Merchant Value First economics; added market-capture extensions, stage-based GM targets, perceived-value/ROI/retention review priority, and 3–5 year margin-trajectory instrumentation.** |
