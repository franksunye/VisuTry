# VisuTry Merchant Commercial Entitlements Spec

**Status:** Approved Demo/Pilot baseline — Sales-First Founding Pilot v7  
**Owner:** Product / Engineering / Sales  
**Created:** 2026-08-06  
**Last updated:** 2026-08-06  
**Related pricing:** `docs/strategy/merchant-pricing-packaging-unit-economics.md`  
**Related provider risk:** `docs/strategy/merchant-provider-risk-and-fallback-economics.md`  
**Related sales demo:** `docs/product/specs/visutry-store-sales-demo.md`  
**Related implementation plan:** `docs/product/plans/merchant-pricing-entitlement-implementation-plan.md`

---

## 1. Purpose

This spec translates merchant pricing into product entitlement and server-side metering requirements.

Operating rule:

> **Sales promise = merchant value = product entitlement = server-side policy = measurable usage.**

Current-stage product value is intentionally scoped to:

> **AI-powered shopping decision experience + measurable purchase-intent intelligence.**

Revenue attribution and incrementality are later maturity layers, not Pilot requirements.

Pricing and entitlement are versioned by commercial stage. Founding Pilot terms must not be assumed to be the permanent Launch/Growth/Scale contract.

A v7 presentation rule is mandatory:

> **Capacity limits protect cost and define fair use, but they must not replace the merchant value proposition in Sales messaging.**

---

## 2. Evidence-Level Rule

### Level 1 — Observed Intent / Current

Primary Pilot analytics:

- AI Commerce Sessions;
- recommendation completion;
- Try-On;
- Compare;
- Product Click;
- Favorite;
- Inquiry;
- source/campaign context;
- top frames;
- high-intent behavior.

### Level 2 — Attributed Conversion / Integration-Dependent

Only where merchant commerce data is connected:

- attributed orders;
- attributed revenue;
- checkout behavior;
- conversion rate among VisuTry-engaged shoppers.

These are not automatically incremental outcomes.

### Level 3 — Incremental Outcome / Experiment-Dependent

Requires credible causal design:

- conversion uplift;
- incremental orders;
- incremental revenue / GMV;
- causal ROI.

These are never inferred from attribution alone.

---

## 3. Commercial Stage Model

```text
MARKET_CAPTURE / PILOT
    ↓
EARLY_SCALE
    ↓
MATURE_PLATFORM
```

Each stage may have different price, session allowance, render allowance, campaign allowance, discount policy, support scope, integration level and contract term.

Do not assume that a Founding Pilot entitlement persists unchanged after the Pilot period.

---

## 4. Commercial Objects

Minimum commercial model:

```text
Merchant
  ├── Commercial Stage
  ├── Pricing Version
  ├── Entitlement Version
  ├── Merchant Plan
  ├── Commerce Session Allowance
  ├── Standard Render Pool
  ├── Premium Render Pool?
  ├── Campaign Entitlements
  ├── Catalog Entitlements
  ├── Intent Analytics Entitlements
  └── Partner Attribution?
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
partnerId?
```

Price and entitlement version must be independently changeable.

---

## 5. Plan Codes

```text
FOUNDING_PILOT
LAUNCH
GROWTH
SCALE
ENTERPRISE
```

`FOUNDING_PILOT` is a market-capture offer, not a lifetime plan.

---

## 6. Current External Sellable Entitlement — Founding Pilot

Commercial anchor:

> **USD 149 / 30 days**

### Merchant-facing package

- one hosted merchant-specific AI shopping experience;
- 8–50 reviewed merchant frames;
- AI frame recommendation;
- Standard Try-On;
- Frame Compare;
- Product Click / Favorite / Inquiry intent signals;
- source/campaign continuity;
- merchant intent-performance view;
- assisted setup;
- weekly Pilot report/review.

### Fair-use / operational limits

- **up to 500 AI-assisted shoppers / AI Commerce Sessions**;
- **up to 1,000 Standard Try-On generations**;
- one active hosted Store / campaign experience.

Merchant-facing Sales copy should normally say **“up to 500 AI-assisted shoppers”** before introducing the internal term `AI Commerce Session`.

The 500 / 1,000 limits should appear in the one-page offer, agreement, usage section, admin and FAQ, but they should not become the primary headline or first comparison point.

The Pilot is optimized for easy comparison, low-friction approval, visible shopper value, meaningful real-traffic testing and fast merchant learning. It is not optimized for mature ARPU or maximum GM.

Do not promise lifetime Pilot pricing.

Pilot exclusions unless explicitly agreed:

- unlimited traffic;
- guaranteed attributed revenue;
- guaranteed conversion uplift;
- incremental GMV claim;
- public Shopify app;
- generalized campaign builder;
- custom API;
- real-time inventory sync;
- enterprise SSO;
- autonomous agent checkout;
- medical/optical measurement claims.

---

## 7. Future Formal Entitlement Matrix — Internal Hypothesis

| Entitlement | Launch | Growth | Scale | Enterprise |
| --- | --- | --- | --- | --- |
| Working monthly price | $199 | $499 | $999 | $2,500+ / custom |
| Monthly AI Commerce Sessions | **750** | **1,500** | **4,000** | Custom |
| Standard Render Pool | **1,500** | **3,000** | **8,000** | Custom |
| Active campaigns | 1 | 3 | 10 | Custom |
| Catalog guideline | 100 | 500 | 2,000 | Custom |
| Recommendation | Included | Included | Included | Included |
| Try-On / Compare | Included | Included | Included | Custom |
| Product Click / Favorite / Inquiry | Included | Included | Included | Included |
| Source / campaign insight | Basic | Advanced | Advanced | Custom |
| Intent intelligence | Basic | Advanced | Advanced | Custom |
| Attributed conversion/revenue | Future / when connected | When connected | When connected | Custom |
| Incrementality measurement | Not offered | Not offered | Future / gated | Custom |
| Premium rendering | Add-on | Allowance/add-on | Larger allowance | Custom |
| CSV onboarding | Included | Included | Included | Included |
| Shopify / commerce integration | Future / no | Limited when available | Included where available | Custom |
| API | No | Gated | Gated / included | Custom |
| Support | Standard | Priority | Priority | SLA / dedicated |

These are post-Pilot hypotheses and may change after Pilot evidence.

---

## 8. Entitlement Decision Rule

When revising plan structure, Product / Finance / Sales evaluate together:

1. **Sales trialability** — can the merchant easily justify trying the product at the current evidence level?
2. **Merchant usability** — enough capacity for meaningful traffic.
3. **Market credibility** — competitive against VTO / optical-commerce alternatives.
4. **Perceived decision value** — merchant understands why VisuTry is more than VTO.
5. **Observed intent evidence** — Product Click / Favorite / Inquiry and journey depth.
6. **Sustainable COGS** — Base Case economics remain viable.
7. **Margin trajectory** — credible path toward mature 70–80% economics.
8. **Commercial stage** — Pilot, Early Scale and Mature Platform may intentionally use different prices and allowances.

A plan may operate at ~50–65% GM during market capture when this is deliberate and evidence-producing.

---

## 9. Pricing / Entitlement Change Policy

- internal pricing and entitlement hypotheses may be revised after any commercial review gate;
- new merchants may be offered the latest approved pricing version;
- signed merchant terms remain effective for their contractual period unless the agreement allows change;
- renewal may migrate to a newer pricing version subject to Sales and contract policy;
- Founding/Pilot pricing should be time-boxed or contract-boxed;
- pricing changes do not require changing plan codes if a new pricing/entitlement version represents them cleanly;
- historical merchants must remain auditable against the pricing version they bought.

---

## 10. AI Commerce Session Meter

An AI Commerce Session is a merchant-scoped shopper session that first reaches the AI recommendation / decision boundary.

Do not count ordinary page views. The meter must be idempotent across refresh, retry, polling, Compare reopen and duplicated events.

---

## 11. Render Pool Meter

Count each successful Standard or Premium Try-On render against the appropriate pool.

Instrument render attempt/success/failure, Standard vs Premium, provider/model, merchant/session/campaign, unit-cost version and fallback reason.

Do not force exactly two frames because packaging assumes ~2 renders/session.

---

## 12. Limit / Extension Behavior

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
- Pilot merchants are not surprise-charged;
- internal warning before ~80% exhaustion;
- temporary audited extension may be approved;
- Product/Sales may extend Pilot capacity if additional traffic creates valuable evidence;
- limit handling never mutates Consumer credits/quotas.

---

## 13. Overage Policy

Working post-Pilot anchors remain provisional:

- +500 Standard renders: $49;
- +1,000 Standard renders: $99.

Overage exists to protect cost and enable expansion, not to make the base package feel artificially constrained.

---

## 14. Analytics Entitlement

### Current / Pilot

- Commerce Sessions;
- recommendation completion;
- Try-On / Compare;
- Product Click;
- Favorite;
- Inquiry;
- top frames;
- source/campaign context;
- session/render usage.

### Later / Advanced

- source/campaign comparison;
- high-intent shopper analysis;
- catalog/frame performance;
- funnel segmentation;
- AI-agent segmentation where reliable;
- conversion linkage where connected;
- period-over-period reporting.

Analytics must distinguish observed event, attributed conversion and incremental outcome.

---

## 15. Production-Readiness Rule for Sales

Every entitlement status:

```text
PRODUCTION_READY
PILOT_ASSISTED
PLANNED
NOT_OFFERED
```

Sales may contract only production-ready or explicitly approved pilot-assisted capabilities.

The current Founding Pilot must be sellable without claiming revenue attribution and without making raw render volume the core value proposition.

---

## 16. Pilot Data Required

### Sales / Merchant Value

- sales objections;
- time from demo to Pilot decision;
- merchant comparison set;
- whether merchant first compared on VTO volume or broader decision value;
- merchant-perceived value;
- willingness to pay;
- continuation intent;
- willingness to route more traffic.

### Shopper / Intent

- merchant monthly traffic;
- traffic routed to VisuTry;
- AI experience entry rate;
- recommendation/Try-On/Compare;
- Product Click / Favorite / Inquiry;
- top-frame / intent concentration.

### AI Economics

- Commerce Sessions;
- Standard/Premium renders;
- renders/session;
- render-pool utilization;
- provider/model distribution;
- actual AI COGS.

### Commercial Economics

- collected revenue;
- discount;
- partner source;
- onboarding/support hours;
- gross profit dollars;
- actual GM.

---

## 17. Acceptance Criteria for First External Paid Pilot

1. Merchant has `FOUNDING_PILOT` server-side.
2. Pricing/entitlement version is recorded.
3. 500 Commerce Sessions are metered.
4. 1,000 Standard renders are metered.
5. meters are durable/idempotent.
6. AI usage reconciles to merchant/session/provider.
7. source/campaign context persists through intent.
8. Merchant/Admin shows meaningful intent funnel and usage.
9. Sales can explain the Pilot without revenue-ROI claims.
10. Sales can explain the Pilot without leading with price-per-render comparison.
11. no lifetime price promise is implied.
12. Consumer counters remain isolated.

---

## 18. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created merchant entitlement baseline. |
| 2026-08-06 | v2: sustainable procurement rebasing. |
| 2026-08-06 | v3: dual-meter market-aware capacity model. |
| 2026-08-06 | v4: Merchant Value First economics. |
| 2026-08-06 | v5: Intent-First evidence hierarchy and no Pilot revenue-attribution requirement. |
| 2026-08-06 | v6: commercial stage, pricing version and entitlement version made explicit. |
| 2026-08-06 | **v7: separated external Pilot value package from fair-use limits; standardized merchant-facing wording as “up to 500 AI-assisted shoppers” and made raw generation limits secondary to assisted AI commerce value.** |
