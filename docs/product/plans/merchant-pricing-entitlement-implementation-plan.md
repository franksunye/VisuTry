# Merchant Pricing & Entitlement Implementation Plan

**Status:** Approved execution plan for Demo revision and Pilot readiness  
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

The purpose is not to build a full billing platform. The purpose is to ensure that:

> **what Sales quotes, what the merchant receives, what the UI shows, what the backend meters, and what Finance expects all describe the same product.**

The implementation should remain compatible with the broader architecture rule:

> **Commerce is the domain; Storefront is one delivery surface.**

The pricing implementation must also follow the new procurement rule:

> **Customer entitlement is based on sustainable procurement economics, not on the current unusually low provider price.**

---

## 2. Immediate Commercial Baseline — v2

Current approved internal anchors:

- Founding Pilot: **$149 / 30 days / 250 AI Commerce Sessions**;
- Launch: **$199/month / 250 sessions**;
- Growth: **$499/month / 600 sessions**;
- Scale: **$999/month / 1,200 sessions**;
- Enterprise: **$2,500+/month / custom**;
- annual prepay baseline: 10 months paid / 12 months service;
- referral partner baseline: 20% of collected recurring revenue for first 12 months;
- agency / solution partner baseline: up to 30% recurring margin;
- direct/channel planning mix: approximately 50/50;
- Standard rendering is the default quality mode;
- Premium rendering is a separate entitlement/add-on;
- AI Commerce Session is the preferred merchant-facing usage unit;
- working post-pilot overage anchors: **$49 / 100 sessions** and **$399 / 1,000 sessions**.

Commercial economics must be reviewed against three cost cases:

```text
BEST      = current low-cost provider / procurement alpha
BASE      = sustainable long-term procurement assumption
STRESS    = official API / emergency fallback
```

The Base Case is the pricing baseline.

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

> **Start a 30-day Founding Merchant Pilot with your own frames for $149, including up to 250 AI Commerce Sessions.**

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
- **Commerce Session allowance = 250**;
- Standard render quality policy;
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
- Standard vs Premium render;
- provider;
- model;
- recoverable unit-cost version / cost metadata;
- fallback reason where applicable;
- frames rendered per session.

This instrumentation is mandatory because provider economics are now treated as a first-class commercial risk.

---

## 6. P0 — Provider Routing and Cost Observability

The production path must not assume one permanent upstream AI supplier.

Required architecture capability:

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
2. `STANDARD` / `PREMIUM` remain merchant-facing quality abstractions.
3. A provider switch does not change merchant entitlement.
4. Every billable/relevant AI task can be reconciled to provider/model.
5. Fallback reason can be recovered where practical.
6. Finance/Product can calculate Best/Base/Stress cost per Commerce Session.

Do not expose provider names to merchants as a contractual product feature.

---

## 7. P0 — Partner Attribution

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

A spreadsheet may temporarily calculate partner payouts, but the merchant-partner relationship itself should be durable before meaningful channel volume begins.

---

## 8. P1 — Pilot Operations Package

Prepare a repeatable merchant activation package.

### Sales / Commercial

- Founding Pilot one-page offer;
- $149 price and 30-day term;
- **250-session included allowance**;
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
- provider/cost observability;
- privacy / retention readiness;
- operational monitoring;
- Consumer regression suite.

---

## 9. P1 — Pricing-Aware Admin Surface

Pilot minimum:

```text
Plan: Founding Pilot
Billing period: <date> – <date>
AI Commerce Sessions: 118 / 250
Active Campaigns: 1 / 1
Standard Quality: Enabled
Premium Quality: Not enabled / allowance
```

Do not expose internal model cost, provider names, partner payout or gross margin to the merchant.

Internal admin may additionally expose:

- recommendation count;
- render count;
- average renders/session;
- provider/model;
- estimated actual AI COGS;
- Base Case modeled COGS;
- fallback usage;
- support notes;
- partner source;
- commercial exception.

---

## 10. P1 — Allowance Warning / Overage Readiness

Before public automated overage billing, implement allowance-state support.

Suggested states:

```text
NORMAL
APPROACHING_LIMIT
LIMIT_REACHED
MANUAL_EXTENSION
OVERAGE_ENABLED
```

Pilot behavior:

- warn internally before 80% usage;
- notify Sales/Product before limit exhaustion;
- do not surprise-charge Pilot merchants;
- allow audited temporary extension if commercially approved.

Future working anchors:

- +100 sessions = $49;
- +1,000 sessions = $399.

Do not hard-code public overage prices until pilot review approves them.

---

## 11. P1 — Premium Quality Switch

Prepare quality entitlement without making Premium mandatory for Pilot.

Requirements:

- canonical policy: `STANDARD | PREMIUM`;
- server-side model/provider resolution;
- campaign/merchant entitlement check;
- independent usage metering;
- merchant-facing quality naming without provider model name;
- operational ability to grant a temporary Premium allowance for evaluation.

The +$99 Premium commercial anchor remains provisional. A fixed included Premium allowance must wait for a sustainable Premium procurement benchmark.

---

## 12. P2 — Formal Plan Productization

Do not fully implement Launch / Growth / Scale billing until pilot evidence confirms the packaging.

When proceeding, implement versioned entitlements:

```text
LAUNCH     250 sessions
GROWTH     600 sessions
SCALE      1,200 sessions
ENTERPRISE custom
```

Required entitlement dimensions:

- Commerce Session allowance;
- campaign allowance;
- catalog allowance/guideline;
- render quality allowance;
- analytics level;
- integration level;
- support level.

Billing requirements:

- Stripe recurring price mapping;
- monthly and annual contracts;
- billing status sync;
- grace/suspension policy;
- manual enterprise contract support;
- credits/discount support where needed.

Do not derive entitlement only from Stripe price amount.

---

## 13. P2 — Campaign as Commercial Expansion Object

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

## 14. Unit Economics Instrumentation

To replace planning assumptions with real economics, every pilot should make the following data recoverable.

### Revenue

- contracted price;
- amount collected;
- discount / credit;
- partner relationship.

### AI cost

- recommendation count;
- Standard render count;
- Premium render count;
- provider/model;
- provider/model unit cost mapping;
- fallback events;
- average renders/session;
- actual AI COGS/merchant;
- modeled Base Case COGS/merchant.

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

## 15. Pilot Review Gates

### After first merchant

Review operational correctness:

- 250-session allowance works;
- usage meter matches actual shopper activity;
- average renders/session is measurable;
- provider/cost attribution works;
- no Consumer contamination;
- merchant understands the pricing object;
- onboarding/support hours recorded.

### After 3 merchants

Review packaging and economics:

- 250-session Pilot allowance;
- $149 willingness to pay;
- actual cost/session vs Base Case $0.10 planning assumption;
- merchant traffic distribution;
- campaign value;
- catalog onboarding friction;
- Premium demand;
- strongest KPI.

### After 5 merchants

Decide whether to publicly productize Launch and Growth.

### After 10 paying merchants

Recalculate:

- effective Stripe cost;
- actual blended provider cost;
- sustainable procurement benchmark;
- official fallback delta;
- average AI cost/merchant;
- support cost;
- gross margin by plan;
- partner economics;
- usage overage design;
- annual plan economics.

---

## 16. Acceptance Criteria Before First External Paid Pilot

All of the following should be true:

1. `FOUNDING_PILOT` scope is written and approved.
2. Merchant has durable pilot entitlement.
3. **250 Commerce Session allowance is server-enforced.**
4. Commerce Session meter is idempotent.
5. AI usage can be reconciled to merchant/session/provider.
6. Standard quality policy is server-owned.
7. Provider routing/fallback does not alter commercial entitlement.
8. Partner/direct acquisition source can be recorded.
9. Shopper source/campaign context persists to intent.
10. Merchant/admin can see meaningful pilot usage/funnel data.
11. Sales collateral describes only implemented or explicitly assisted capabilities.
12. Pilot agreement does not promise guaranteed conversion or revenue uplift.
13. Consumer stability and privacy gates remain satisfied.

---

## 17. Non-Goals Before Pilot Evidence

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

---

## 18. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created implementation plan linking pricing, merchant entitlement, usage metering, partner attribution, Demo revision and Pilot readiness. |
| 2026-08-06 | **v2:** replaced grsai-derived 1,000-session Pilot baseline with sustainable 250-session allowance; aligned Launch/Growth/Scale to 250/600/1,200; added Provider Router, cost observability, allowance-state and fallback-economics implementation requirements. |
