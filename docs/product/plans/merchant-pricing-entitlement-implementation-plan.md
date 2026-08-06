# Merchant Pricing & Entitlement Implementation Plan

**Status:** Approved execution plan for Demo revision and Pilot readiness — v3  
**Owner:** Product / Engineering / Sales  
**Created:** 2026-08-06  
**Last updated:** 2026-08-06  
**Related pricing:** `docs/strategy/merchant-pricing-packaging-unit-economics.md`  
**Related entitlement spec:** `docs/product/specs/merchant-commercial-entitlements.md`  
**Related provider risk:** `docs/strategy/merchant-provider-risk-and-fallback-economics.md`  
**Related Store plan:** `docs/product/plans/visutry-store-demo-pilot-readiness-plan.md`  
**Related commerce architecture:** `docs/product/specs/visutry-commerce-architecture.md`

---

## 1. Objective

Turn the merchant pricing model into an operational product contract before the first non-team merchant pilots.

The implementation rule is:

> **What Sales quotes, what the merchant receives, what the UI shows, what the backend meters, and what Finance expects must describe the same product.**

The architecture rule remains:

> **Commerce is the domain; Storefront is one delivery surface.**

The v3 commercial correction is:

> **Do not use an unusually cheap provider to define customer capacity, but also do not use a four-render worst-case cost ceiling to make the merchant offer commercially unattractive.**

Merchant-facing Commerce Session capacity and render-cost control are therefore implemented as separate meters.

---

## 2. Immediate Commercial Baseline — v3

Current internal anchors:

- Founding Pilot: **$149 / 30 days / 500 AI Commerce Sessions / 1,000 Standard renders**;
- Launch: **$199/month / 750 sessions / 1,500 Standard renders**;
- Growth: **$499/month / 1,500 sessions / 3,000 Standard renders**;
- Scale: **$999/month / 4,000 sessions / 8,000 Standard renders**;
- Enterprise: **$2,500+/month / custom**;
- annual prepay baseline: 10 months paid / 12 months service;
- referral partner baseline: 20% of collected recurring revenue for first 12 months;
- agency / solution partner baseline: up to 30% recurring margin;
- direct/channel planning mix: approximately 50/50;
- Standard rendering is the default quality mode;
- Premium rendering is a separate entitlement/add-on;
- AI Commerce Session is the preferred merchant-facing shopper-capacity unit;
- Standard/Premium render pools are the primary AI-cost meters.

Commercial economics must continue to be reviewed under:

```text
BEST      = low-cost provider / procurement alpha
BASE      = sustainable long-term procurement assumption
STRESS    = official API / emergency fallback
```

The Base Case is the pricing baseline; the Stress Case is the continuity check.

---

## 3. P0 — Align Sales Demo With the Sellable Product

### Shopper Demo

Ensure the demo proves:

1. merchant-specific catalog;
2. campaign/source context;
3. AI recommendation;
4. Try-On;
5. Compare;
6. product destination;
7. Favorite / Product Click / Inquiry;
8. anonymous-first shopper journey.

Do not expose quotas or provider/model names in the shopper journey.

### Merchant/Admin Demo

Add or revise the admin story so Sales can explain:

- current plan / Pilot status;
- AI Commerce Sessions used / allowance;
- Standard renders used / allowance;
- source/campaign traffic;
- recommendation funnel;
- Try-On / Compare funnel;
- intent signals;
- top frames;
- Premium usage when enabled;
- high-intent / conversion signals where available.

Pilot admin does not need a full billing/settings product. Read-only internal/admin configuration is sufficient.

### Sales Demo Close

Use:

> **Start a 30-day Founding Merchant Pilot with your own frames for $149, including up to 500 AI Commerce Sessions and 1,000 Standard Try-On renders.**

Sales should explain that formal plans scale by:

- shopper capacity;
- campaign count;
- AI usage;
- intelligence depth;
- Premium rendering;
- integrations/support.

Do not position pricing as cost per generated image.

---

## 4. P0 — Server-Side Pilot Entitlement

Before the first independent pilot, implement the smallest durable commercial policy.

Required:

- assign merchant to `FOUNDING_PILOT`;
- billing period start/end;
- **Commerce Session allowance = 500**;
- **Standard Render allowance = 1,000**;
- Premium Render allowance = 0 unless manually granted;
- Standard quality policy;
- campaign allowance = 1;
- catalog guideline = 8–50 reviewed frames;
- usage counters queryable by merchant and billing period;
- server-side enforcement;
- internal override with audit trail.

A generic billing engine is not required.

---

## 5. P0 — Commerce Session Meter

Count one Commerce Session when a valid merchant session first executes recommendation / enters the AI decision journey.

Required behavior:

- refresh does not increment;
- retry does not increment;
- polling does not increment;
- Compare does not create a new Commerce Session;
- repeated renders remain individually measurable but stay within the same Commerce Session;
- usage is merchant- and billing-period-scoped;
- Store usage never touches Consumer Credits/subscription counters.

---

## 6. P0 — Standard / Premium Render Meter

Implement a second independent meter.

Record separately:

- Standard render attempts;
- Standard successful renders;
- Premium render attempts;
- Premium successful renders;
- failed/retried renders;
- provider;
- model;
- merchant/session/campaign context;
- recoverable unit-cost version;
- fallback reason where applicable.

A shopper may render multiple frames in one Commerce Session.

The UI should not enforce a fixed two-frame limit merely because the packaging model assumes an average of two renders/session.

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

Minimum requirements:

1. Provider/model selection is server-owned.
2. `STANDARD` / `PREMIUM` remain merchant-facing abstractions.
3. Provider switch does not change merchant entitlement.
4. AI tasks can be reconciled to provider/model.
5. Fallback reason is recoverable where practical.
6. Finance/Product can calculate Best/Base/Stress economics by merchant.

Do not expose provider names as a contractual feature.

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

Payout may remain spreadsheet-operated initially, but merchant-partner attribution should be durable.

---

## 9. P1 — Pilot Operations Package

### Sales / Commercial

Prepare:

- Founding Pilot one-page offer;
- $149 / 30-day term;
- **500-session allowance**;
- **1,000 Standard render pool**;
- included scope;
- explicit exclusions;
- privacy/data-processing summary;
- no guaranteed conversion-uplift language;
- Launch/Growth/Scale continuation discussion.

### Product / Operations

Prepare:

- merchant onboarding checklist;
- catalog CSV template;
- frame enrichment/review workflow;
- source/campaign setup worksheet;
- merchant KPI selection;
- pilot launch checklist;
- weekly performance report;
- end-of-pilot ROI/continuation review.

### Engineering

Prepare:

- entitlement assignment;
- dual usage meters;
- usage dashboard/query;
- source attribution continuity;
- provider/cost observability;
- privacy/retention readiness;
- operational monitoring;
- Consumer regression suite.

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

Internal admin may additionally expose:

- recommendation count;
- average renders/session;
- provider/model;
- actual estimated AI COGS;
- Base Case modeled COGS;
- fallback usage;
- support notes;
- partner source;
- commercial exception.

Do not expose model cost, provider name, partner payout or GM to the merchant.

---

## 11. P1 — Limit and Overage Readiness

Support:

```text
NORMAL
APPROACHING_LIMIT
LIMIT_REACHED
MANUAL_EXTENSION
OVERAGE_ENABLED
```

Pilot behavior:

- alert internally before 80% of either session or render allowance;
- notify Sales/Product before exhaustion;
- do not surprise-charge Pilot merchants;
- allow audited temporary extension when commercially approved.

Working post-pilot render anchors:

- +500 Standard renders = $49;
- +1,000 Standard renders = $99.

Do not hard-code public overage pricing until pilot review approves it.

---

## 12. P1 — Premium Quality Switch

Requirements:

- canonical policy: `STANDARD | PREMIUM`;
- server-side model/provider resolution;
- campaign/merchant entitlement check;
- independent Premium render meter;
- merchant-facing quality naming without provider model name;
- ability to grant temporary Premium evaluation allowance.

The +$99 Premium commercial anchor remains provisional; included Premium volume must wait for sustainable procurement and pilot evidence.

---

## 13. P2 — Formal Plan Productization

Do not fully productize Launch/Growth/Scale billing before pilot evidence.

When approved, use versioned entitlements:

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

Required dimensions:

- Commerce Session allowance;
- Standard render pool;
- Premium render pool;
- campaign allowance;
- catalog guideline;
- analytics level;
- integration level;
- support level.

Billing requirements:

- Stripe recurring price mapping;
- monthly/annual contracts;
- billing status sync;
- grace/suspension policy;
- manual enterprise contract support;
- credits/discount support where needed.

Do not derive entitlement only from Stripe price amount.

---

## 14. P2 — Campaign as Commercial Expansion Object

Promote Campaign into a first-class Commerce entity when real merchants require persistent multi-campaign workflow.

Triggers include:

- multiple simultaneous acquisition campaigns;
- different catalog subsets;
- different landing/offer configuration;
- campaign-by-campaign performance;
- additional-campaign pricing.

Then implement:

- lifecycle/status;
- merchant ownership;
- attribution identity;
- catalog subset;
- experience config;
- campaign usage/reporting;
- campaign entitlement checks.

Do not build a generalized marketing automation builder at this stage.

---

## 15. Unit Economics and Merchant Value Instrumentation

Every pilot must make the following recoverable.

### Revenue

- contracted price;
- amount collected;
- discount/credit;
- partner relationship.

### AI cost

- recommendation count;
- Standard/Premium render count;
- provider/model;
- provider unit-cost mapping;
- fallback events;
- average renders/session;
- actual AI COGS/merchant;
- Base Case modeled COGS/merchant.

### Merchant demand

- merchant monthly traffic;
- campaign traffic routed to VisuTry;
- AI experience entry rate.

### Commerce value

- recommendation completion;
- Try-On;
- Compare;
- product clicks;
- favorites;
- inquiries;
- verified orders/revenue where supplied;
- merchant-reported conversion impact.

### Human delivery

- onboarding time;
- catalog review time;
- campaign setup time;
- QA time;
- support time.

---

## 16. Pilot Review Gates

### After first merchant

Review:

- 500-session meter correctness;
- 1,000-render meter correctness;
- actual renders/session;
- provider/cost attribution;
- no Consumer contamination;
- merchant understanding of the offer;
- onboarding/support hours.

### After 3 merchants

Review:

- whether 500 Pilot sessions are sufficient for meaningful traffic;
- render-pool utilization;
- $149 willingness to pay;
- traffic-to-AI entry rate;
- merchant ROI narrative;
- campaign value;
- Premium demand.

### After 5 merchants

Decide whether Launch/Growth can be publicly productized at 750 / 1,500 sessions.

### After 10 paying merchants

Recalculate:

- effective Stripe cost;
- actual blended provider cost;
- sustainable procurement benchmark;
- official fallback delta;
- average renders/session;
- render-pool utilization;
- support cost;
- GM by plan;
- partner economics;
- overage design;
- annual-plan economics;
- merchant ROI evidence.

---

## 17. Acceptance Criteria Before First External Paid Pilot

All must be true:

1. `FOUNDING_PILOT` scope is approved.
2. Merchant has durable Pilot entitlement.
3. **500 Commerce Session allowance is server-enforced.**
4. **1,000 Standard render pool is server-enforced.**
5. Both meters are idempotent.
6. AI usage can be reconciled to merchant/session/provider.
7. Standard quality policy is server-owned.
8. Provider routing/fallback does not alter merchant entitlement.
9. Partner/direct acquisition source can be recorded.
10. Shopper source/campaign context persists to intent.
11. Merchant/admin can see meaningful usage/funnel data.
12. Sales collateral only describes implemented or explicitly assisted capabilities.
13. Pilot agreement does not promise guaranteed conversion/revenue uplift.
14. Consumer stability/privacy gates remain satisfied.

---

## 18. Non-Goals Before Pilot Evidence

Do not delay first merchants to build:

- full pricing-page self-checkout;
- public partner portal;
- automated commission payout;
- generalized coupon engine;
- advanced multi-touch attribution;
- automatic performance-fee settlement;
- enterprise CPQ;
- generalized campaign builder;
- public Shopify marketplace listing.

---

## 19. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created implementation plan linking pricing, entitlement, metering, partner attribution and Pilot readiness. |
| 2026-08-06 | v2: introduced sustainable procurement economics, Provider Router and conservative session allowances. |
| 2026-08-06 | **v3: replaced finance-floor-only packaging with dual-meter merchant-capacity model; Pilot/Launch/Growth/Scale session entitlements revised to 500 / 750 / 1,500 / 4,000 and Standard render pools to 1,000 / 1,500 / 3,000 / 8,000; added merchant-value instrumentation and render-based overage readiness.** |
