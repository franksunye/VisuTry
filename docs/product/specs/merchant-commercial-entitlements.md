# VisuTry Merchant Commercial Entitlements Spec

**Status:** Approved Demo/Pilot baseline — Intent-First AI Commerce v5  
**Owner:** Product / Engineering / Sales  
**Created:** 2026-08-06  
**Last updated:** 2026-08-06  
**Related pricing:** `docs/strategy/merchant-pricing-packaging-unit-economics.md`  
**Related provider risk:** `docs/strategy/merchant-provider-risk-and-fallback-economics.md`  
**Related sales demo:** `docs/product/specs/visutry-store-sales-demo.md`  
**Related pilot plan:** `docs/product/plans/merchant-pricing-entitlement-implementation-plan.md`

---

## 1. Purpose

This spec translates merchant pricing into product entitlement and server-side metering requirements.

Operating rule:

> **Sales promise = merchant value = product entitlement = server-side policy = measurable usage.**

Current product value is intentionally scoped to:

> **AI-powered shopping decision experience + measurable purchase-intent intelligence.**

Revenue attribution and incrementality are later maturity layers, not Pilot requirements.

---

## 2. Evidence-Level Rule

Every merchant-facing metric must be classified into one of three evidence levels.

### Level 1 — Observed Intent / Current

Directly observable within VisuTry:

- AI Commerce Sessions;
- recommendation completion;
- Try-On;
- Compare;
- Product Click;
- Favorite;
- Inquiry;
- source/campaign context;
- top frames;
- high-intent shopper behavior.

These are the primary Pilot and early-plan analytics.

### Level 2 — Attributed Conversion / Integration-Dependent

Only available where merchant commerce data is connected:

- orders touched by VisuTry;
- attributed orders;
- attributed revenue;
- checkout behavior;
- conversion rate among VisuTry-engaged shoppers.

These are not automatically incremental outcomes.

### Level 3 — Incremental Outcome / Experiment-Dependent

Requires credible causal design:

- conversion uplift;
- incremental orders;
- incremental revenue;
- incremental GMV;
- causal ROI.

These must never be inferred from attribution alone.

---

## 3. Commercial Objects

Minimum commercial model:

```text
Merchant
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
planCode
entitlementVersion
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
partnerId?
```

Price and entitlement version must be independently changeable.

---

## 4. Plan Codes

```text
FOUNDING_PILOT
LAUNCH
GROWTH
SCALE
ENTERPRISE
```

---

## 5. Founding Pilot Entitlement

Commercial anchor:

> **USD 149 / 30 days**

Included baseline:

- one merchant tenant;
- one hosted Store / campaign experience;
- 8–50 reviewed frames;
- **500 AI Commerce Sessions**;
- **1,000 Standard Try-On renders**;
- AI recommendation;
- Try-On / Frame Compare;
- source / campaign continuity;
- product destination continuity;
- Product Click / Favorite / Inquiry signals;
- merchant/admin intent-performance view;
- assisted setup;
- weekly Pilot report.

The Pilot must provide enough real shopper capacity to test merchant value. It must not be reduced merely to preserve a theoretical 75% GM.

Pilot exclusions unless explicitly agreed:

- unlimited traffic;
- public Shopify app;
- generalized campaign builder;
- custom API;
- real-time inventory sync;
- enterprise SSO;
- attributed revenue guarantee;
- guaranteed conversion uplift;
- incremental GMV claim;
- autonomous agent checkout;
- medical/optical measurement claims.

---

## 6. Formal Entitlement Matrix

| Entitlement | Launch | Growth | Scale | Enterprise |
| --- | --- | --- | --- | --- |
| Merchant tenant | 1 | 1 | 1 | Custom / multi-brand |
| Monthly AI Commerce Sessions | **750** | **1,500** | **4,000** | Custom |
| Standard Render Pool | **1,500** | **3,000** | **8,000** | Custom |
| Active campaigns | 1 | 3 | 10 | Custom |
| Catalog guideline | 100 | 500 | 2,000 | Custom |
| Recommendation | Included | Included | Included | Included |
| Standard Try-On | Included within render pool | Included | Included | Custom |
| Compare | Included | Included | Included | Included |
| Product Click / Favorite / Inquiry | Included | Included | Included | Included |
| Source / campaign insight | Basic | Advanced | Advanced | Custom |
| Intent intelligence | Basic | Advanced | Advanced | Custom |
| Attributed conversion/revenue | Not required / future | When connected | When connected | Custom |
| Incrementality measurement | Not offered | Not offered | Future / gated | Custom |
| Premium rendering | Add-on | Allowance/add-on | Larger allowance | Custom |
| CSV onboarding | Included | Included | Included | Included |
| URL-assisted import | Gated | Gated | Gated | Custom |
| Shopify / commerce integration | Future / no | Limited when available | Included where available | Custom |
| API | No | Gated | Gated / included | Custom |
| Support | Standard | Priority | Priority | SLA / dedicated |

These values remain hypotheses until Pilot evidence confirms them.

---

## 7. Entitlement Decision Rule

A plan entitlement must not be determined only by AI cost.

When revising session/render allowances, Product and Finance evaluate:

1. **Merchant usability** — enough capacity for meaningful traffic.
2. **Market credibility** — competitive against VTO / optical-commerce alternatives.
3. **Perceived decision value** — merchant understands why the product is more than VTO.
4. **Observed purchase-intent signals** — Product Click / Favorite / Inquiry and journey depth.
5. **Sustainable COGS** — Base Case economics remain viable.
6. **Margin trajectory** — credible path toward mature 70–80% economics.

A plan may operate at ~50–65% GM during market capture when this is deliberate and evidence-producing.

---

## 8. AI Commerce Session Meter

An AI Commerce Session is a merchant-scoped shopper session that first reaches the AI recommendation / decision boundary.

Do not count ordinary page views.

Recommended rule:

> Count one Commerce Session when the shopper first executes recommendation or another approved decision-start event.

The meter must be idempotent across refresh, retry, polling, Compare reopen and duplicated events.

---

## 9. Render Pool Meter

Render consumption is independent from Commerce Session consumption.

Count each successful Standard or Premium Try-On render against the appropriate pool.

Instrument:

- render attempt/success/failure;
- Standard vs Premium;
- provider/model;
- merchant/session/campaign;
- unit-cost version;
- fallback reason.

Do not force exactly two frames merely because packaging assumes an average of two renders/session.

---

## 10. Limit Behavior

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
- limit handling never mutates Consumer credits/quotas.

During Pilot, Product may extend usage when additional traffic has high learning or case-study value, provided economics remain gross-profit positive or are explicitly approved.

---

## 11. Overage Policy

Working post-Pilot anchors:

- **+500 Standard renders: $49**;
- **+1,000 Standard renders: $99**.

These are provisional.

Overage exists to protect cost and support expansion, not to make the base package feel artificially constrained.

---

## 12. Render Quality Policy

Merchant-facing modes:

```text
STANDARD
PREMIUM
```

Provider/model names remain implementation details.

Premium usage is separately metered and must use sustainable procurement economics.

---

## 13. Campaign Entitlement

Campaign becomes a first-class Commerce object once merchants require persistent multi-campaign workflow.

Working additional-campaign anchor:

> **+$99–199 / active campaign / month**

Campaign and Intent Intelligence are strategically important because they can increase merchant value without increasing rendering COGS proportionally.

---

## 14. Analytics Entitlement

### Basic — Current Sellable

- Commerce Sessions;
- recommendation completion;
- Try-On / Compare;
- Product Click;
- Favorite;
- Inquiry;
- top frames;
- basic source/campaign view;
- session/render usage.

### Advanced — Current / Near-Term

- source/campaign comparison;
- high-intent shopper analysis;
- catalog/frame performance;
- funnel segmentation;
- AI-agent source segmentation where reliable;
- period-over-period reporting.

### Integration-Dependent

Only where merchant commerce data is connected:

- attributed order count;
- attributed revenue;
- downstream conversion linkage.

### Experiment-Dependent

Only after credible experimental design:

- conversion uplift;
- incremental orders;
- incremental revenue / GMV.

Analytics copy must never collapse these evidence levels.

---

## 15. Provider / Cost Attribution

Every merchant AI task should be attributable where practical to:

```text
provider
model
qualityMode
merchantId
merchantSessionId
campaignId?
unitCostVersion?
fallbackReason?
```

Customer entitlement must not depend on provider identity.

---

## 16. Channel Attribution

Supported merchant acquisition relationships:

```text
DIRECT
REFERRAL_PARTNER
AGENCY_PARTNER
STRATEGIC_PARTNER
```

Partner attribution must be durable and not depend on coupon alone.

---

## 17. Production-Readiness Rule for Sales

Every entitlement status:

```text
PRODUCTION_READY
PILOT_ASSISTED
PLANNED
NOT_OFFERED
```

Sales may contract only production-ready or explicitly approved Pilot-assisted capabilities.

Revenue attribution must not be sold as current functionality unless the specific merchant integration exists.

Incrementality must not be sold as current functionality unless an approved experiment framework exists.

---

## 18. Pilot Data Required

### Current mandatory merchant-value evidence

- merchant monthly traffic;
- traffic routed to VisuTry;
- AI experience entry rate;
- Commerce Sessions;
- recommendation completion;
- Try-On completion;
- Compare usage;
- Product Clicks;
- Favorites;
- Inquiries;
- top frames / intent concentration;
- merchant-perceived value;
- willingness to pay;
- continuation / expansion decision.

### AI economics

- Standard/Premium renders;
- renders/session;
- render-pool utilization;
- provider/model distribution;
- actual AI COGS.

### Commercial economics

- collected revenue;
- discount;
- partner source;
- onboarding/support hours;
- gross profit dollars;
- actual GM;
- CAC where measurable.

### Optional / later

- orders/revenue where already available from merchant data;
- attributed conversion when integration exists;
- incrementality only when experiment design exists.

Highest-priority unknowns:

1. merchant-perceived value;
2. AI experience entry rate;
3. renders / Commerce Session;
4. Product Click / Favorite / Inquiry behavior;
5. willingness to pay;
6. continuation / expansion intent;
7. margin trajectory.

---

## 19. Acceptance Criteria for First External Paid Pilot

1. Merchant has `FOUNDING_PILOT` server-side.
2. 500 Commerce Sessions are metered.
3. 1,000 Standard renders are metered.
4. Both meters are durable/idempotent.
5. AI usage reconciles to merchant/session/provider.
6. Standard quality policy is server-owned.
7. Limit state/manual extension are operational.
8. Source/campaign context persists through intent.
9. Merchant/admin can see meaningful usage + intent funnel data.
10. Partner attribution can be recorded.
11. Consumer counters remain isolated.
12. Sales does not promise revenue attribution, conversion uplift or incremental GMV unless separately implemented and evidenced.

Revenue attribution is **not** a Pilot-readiness requirement.

---

## 20. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created merchant entitlement baseline. |
| 2026-08-06 | v2: sustainable procurement rebasing. |
| 2026-08-06 | v3: dual-meter market-aware capacity model. |
| 2026-08-06 | v4: aligned entitlements to AI-native Merchant Value First economics. |
| 2026-08-06 | **v5: moved early merchant entitlement to Intent-First AI Commerce. Added evidence-level separation between observed intent, attributed conversion and experiment-dependent incrementality; removed revenue attribution from Pilot requirements and current Sales promise.** |
