# Merchant Pricing & Entitlement Implementation Plan

**Status:** Approved execution plan for Demo revision and Pilot readiness  
**Owner:** Product / Engineering / Sales  
**Created:** 2026-08-06  
**Related pricing:** `docs/strategy/merchant-pricing-packaging-unit-economics.md`  
**Related entitlement spec:** `docs/product/specs/merchant-commercial-entitlements.md`  
**Related Store plan:** `docs/product/plans/visutry-store-demo-pilot-readiness-plan.md`  
**Related commerce architecture:** `docs/product/specs/visutry-commerce-architecture.md`

---

## 1. Objective

Turn the newly defined merchant pricing model into an operational product contract before the first non-team merchant pilots.

The purpose is not to build a full billing platform. The purpose is to ensure that:

> what Sales quotes, what the merchant receives, what the UI shows, what the backend meters, and what Finance expects all describe the same product.

The implementation should remain compatible with the broader architecture rule:

> Commerce is the domain; Storefront is one delivery surface.

---

## 2. Immediate Commercial Baseline

Current approved internal anchors:

- Founding Pilot: **$149 / 30 days**;
- Launch: **$199/month**;
- Growth: **$499/month**;
- Scale: **$999/month**;
- Enterprise: **$2,500+/month / custom**;
- annual prepay baseline: 10 months paid / 12 months service;
- referral partner baseline: 20% of collected recurring revenue for first 12 months;
- agency / solution partner baseline: up to 30% recurring margin;
- direct/channel planning mix: approximately 50/50;
- standard rendering is the default quality mode;
- premium rendering is a separate entitlement/add-on;
- AI Commerce Session is the preferred merchant-facing usage unit.

These are internal baselines and remain subject to recalibration with pilot evidence.

---

## 3. P0 — Align Sales Demo With the Sellable Product

Before new feature expansion, the current Sales Demo should express the actual future commercial package.

### Shopper Demo

Ensure the demo visibly proves:

1. merchant-specific catalog;
2. campaign/source context;
3. AI recommendation;
4. Try-On;
5. Compare;
6. product destination;
7. Favorite / Product Click / Inquiry;
8. anonymous-first shopper journey.

Do not display pricing or quota concepts inside the shopper flow unless necessary.

### Merchant/Admin Demo

Add or revise the admin story so Sales can explain:

- current plan / pilot status;
- AI Commerce Sessions used / allowance;
- source/campaign traffic;
- recommendation funnel;
- Try-On / Compare funnel;
- intent signals;
- top frames;
- usage / successful renders;
- premium quality usage when enabled.

The dashboard does not need a full billing/settings product for the first pilot. Read-only internal/admin configuration is sufficient initially.

### Sales Demo Script

The commercial close should become:

> Start a 30-day Founding Merchant Pilot with your own frames for $149.

Sales should explain that formal plans scale by:

- traffic / AI Commerce Sessions;
- campaign count;
- intelligence depth;
- premium rendering;
- integrations / support.

Do not position pricing as cost per generated image.

---

## 4. P0 — Server-Side Pilot Entitlement

Before the first independent pilot, implement the smallest durable commercial policy.

Required capabilities:

- assign merchant to `FOUNDING_PILOT`;
- billing period start/end;
- Commerce Session allowance = 1,000;
- standard render quality policy;
- campaign allowance = 1;
- catalog guideline / operational validation;
- usage counters queryable by merchant and billing period;
- server-side enforcement;
- internal override with audit trail for pilot operations.

A generic billing engine is not required.

A configuration table / entitlement record is acceptable if the contract is durable, server-owned and testable.

---

## 5. P0 — Commerce Session Meter

Implement an idempotent meter before real pilot traffic.

Recommended v1 trigger:

> Count one Commerce Session when a merchant session first executes recommendation / enters the AI decision journey.

Required behavior:

- page refresh does not increment usage;
- retries do not increment the commercial session counter;
- Compare does not create a new Commerce Session;
- repeated renders within the same session remain individually measurable for COGS but do not create extra shopper sessions;
- session usage is merchant-scoped and billing-period-scoped;
- merchant quota does not touch Consumer Credits / subscription counters.

Record separately:

- recommendation attempts/success;
- render attempts/success;
- standard vs premium render;
- provider cost metadata where practical;
- frames rendered per session.

---

## 6. P0 — Partner Attribution

Because channel distribution is part of the business model from Day 1, pilot operations must be able to record who sourced the merchant.

Minimum initial implementation may be internal/admin-only.

Required fields/concepts:

```text
merchantId
acquisitionType: DIRECT | REFERRAL_PARTNER | AGENCY_PARTNER | STRATEGIC_PARTNER
partnerId?
commercialNote?
commissionStartAt?
commissionEndAt?
```

A spreadsheet may temporarily calculate partner payouts, but the merchant-partner relationship itself should be durable in the product/database before meaningful channel volume begins.

---

## 7. P1 — Pilot Operations Package

Prepare a repeatable merchant activation package.

### Sales / Commercial

- Founding Pilot one-page offer;
- $149 price and 30-day term;
- included scope;
- explicit exclusions;
- privacy / data-processing summary;
- no guaranteed conversion-uplift language;
- next-plan discussion: Launch / Growth / Scale.

### Product / Operations

- merchant onboarding checklist;
- catalog CSV template;
- frame enrichment / review workflow;
- source/campaign setup worksheet;
- merchant KPI selection;
- pilot launch checklist;
- weekly performance report template;
- end-of-pilot conversion / continuation review.

### Engineering

- entitlement assignment;
- usage dashboard/query;
- source attribution continuity;
- privacy / retention readiness;
- operational monitoring;
- Consumer regression suite.

---

## 8. P1 — Pricing-Aware Admin Surface

The Merchant/Admin product should eventually expose a lightweight plan/usage section.

Pilot minimum:

```text
Plan: Founding Pilot
Billing period: <date> – <date>
AI Commerce Sessions: 318 / 1,000
Active Campaigns: 1 / 1
Standard Quality: Enabled
Premium Quality: Not enabled / allowance
```

Do not expose internal model cost, provider names, partner payout or gross margin to the merchant.

Internal admin may additionally expose:

- recommendation count;
- render count;
- estimated AI COGS;
- support notes;
- partner source;
- commercial exception.

---

## 9. P1 — Premium Quality Switch

Prepare quality entitlement without making premium mode mandatory for Pilot.

Requirements:

- canonical policy: `STANDARD | PREMIUM`;
- server-side model resolution;
- campaign/merchant entitlement check;
- independent usage metering;
- merchant-facing quality naming without provider model name;
- operational ability to grant a temporary premium allowance for evaluation.

Decision to commercialize +$99 Premium Rendering should follow quality feedback from pilots rather than launch automatically.

---

## 10. P2 — Formal Plan Productization

Do not fully implement Launch / Growth / Scale billing until pilot evidence confirms the packaging.

When proceeding, implement:

### Plan catalog

```text
LAUNCH
GROWTH
SCALE
ENTERPRISE
```

with versioned entitlements.

### Required entitlements

- Commerce Session allowance;
- campaign allowance;
- catalog allowance/guideline;
- render quality allowance;
- analytics level;
- integration level;
- support level.

### Billing

- Stripe recurring price mapping;
- monthly and annual contracts;
- billing status sync;
- grace/suspension policy;
- manual enterprise contract support;
- credits/discount support where needed.

Do not derive entitlement only from Stripe price amount.

---

## 11. P2 — Campaign as Commercial Expansion Object

When real merchants require multiple persistent campaigns, promote Campaign into a first-class Commerce entity.

Trigger examples:

- same merchant runs multiple simultaneous acquisition campaigns;
- each campaign uses a different catalog subset;
- distinct landing/offer configuration is needed;
- merchant wants campaign-by-campaign performance;
- pricing starts charging for additional active campaigns.

Then implement:

- campaign status/lifecycle;
- merchant ownership;
- attribution identity;
- catalog subset;
- experience config;
- campaign usage/reporting;
- active campaign entitlement check.

Do not build a generalized visual marketing automation builder at this stage.

---

## 12. Unit Economics Instrumentation

To replace planning assumptions with real economics, every pilot should make the following data recoverable:

### Revenue

- contracted price;
- amount collected;
- discount / credit;
- partner relationship.

### AI cost

- recommendation count;
- standard render count;
- premium render count;
- provider/model cost metadata or recoverable unit-cost mapping.

### Human delivery

Track manually if necessary:

- merchant onboarding time;
- catalog prep/review time;
- campaign setup time;
- QA time;
- support time.

### Commerce value

- sessions;
- recommendations;
- Try-On;
- Compare;
- product clicks;
- favorites;
- inquiries;
- verified orders/revenue when merchant can supply it.

---

## 13. Pilot Review Gates

### After first merchant

Review operational correctness:

- allowance works;
- usage meter matches actual shopper activity;
- no Consumer contamination;
- merchant understands the pricing object;
- onboarding/support hours recorded.

### After 3 merchants

Review packaging:

- 1,000-session Pilot allowance;
- $149 willingness to pay;
- campaign value;
- catalog onboarding friction;
- premium quality demand;
- strongest KPI.

### After 5 merchants

Decide whether to publicly productize Launch and Growth.

### After 10 paying merchants

Recalculate:

- effective Stripe cost;
- average AI cost/merchant;
- support cost;
- gross margin;
- partner economics;
- usage overage design;
- annual plan economics.

---

## 14. Acceptance Criteria Before First External Paid Pilot

All of the following should be true:

1. `FOUNDING_PILOT` scope is written and approved.
2. Merchant has durable pilot entitlement.
3. 1,000 Commerce Session allowance is server-enforced.
4. Commerce Session meter is idempotent.
5. AI usage can be reconciled to merchant/session.
6. Standard quality policy is server-owned.
7. Partner/direct acquisition source can be recorded.
8. Shopper source/campaign context persists to intent.
9. Merchant/admin can see meaningful pilot usage/funnel data.
10. Sales collateral describes only implemented or explicitly assisted capabilities.
11. Pilot agreement does not promise guaranteed conversion or revenue uplift.
12. Consumer stability and privacy gates remain satisfied.

---

## 15. Non-Goals Before Pilot Evidence

Do not delay the first merchants to build:

- full pricing-page self-checkout;
- public partner portal;
- automated commission payout;
- generalized coupon engine;
- complex tax platform;
- advanced multi-touch attribution;
- automatic performance-fee settlement;
- enterprise CPQ;
- generalized campaign builder;
- public Shopify marketplace listing.

These become justified only when commercial evidence requires them.

---

## 16. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created implementation plan linking pricing, merchant entitlement, usage metering, partner attribution, Demo revision and Pilot readiness. |
