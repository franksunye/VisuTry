# VisuTry Merchant Commercial Entitlements Spec

**Status:** Approved Demo/Pilot baseline — AI-Native Market Economics v4  
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

The entitlement philosophy is no longer “maximize theoretical GM first.” Entitlements must balance:

- merchant-perceived value;
- market competitiveness;
- shopper capacity;
- sustainable AI COGS;
- product adoption;
- long-term margin trajectory.

---

## 2. Commercial Objects

Minimum commercial model:

```text
Merchant
  ├── Merchant Plan
  ├── Commerce Session Allowance
  ├── Standard Render Pool
  ├── Premium Render Pool?
  ├── Campaign Entitlements
  ├── Catalog Entitlements
  ├── Analytics Entitlements
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

## 3. Plan Codes

```text
FOUNDING_PILOT
LAUNCH
GROWTH
SCALE
ENTERPRISE
```

---

## 4. Founding Pilot Entitlement

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
- favorite / product click / inquiry signals;
- merchant/admin performance view;
- assisted setup;
- weekly pilot report.

The Pilot must provide enough real shopper capacity to test merchant value. It must not be reduced merely to preserve a theoretical 75% GM.

Pilot exclusions unless agreed:

- unlimited traffic;
- public Shopify app;
- generalized campaign builder;
- custom API;
- real-time inventory sync;
- enterprise SSO;
- guaranteed revenue uplift;
- autonomous agent checkout;
- medical/optical measurement claims.

---

## 5. Formal Entitlement Matrix

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
| Product click / favorite / inquiry | Included | Included | Included | Included |
| Source attribution | Basic | Advanced | Advanced | Custom |
| AI-agent source classification | Included | Included | Included | Included |
| Commerce intelligence | Basic | Advanced | Advanced | Custom |
| Conversion/revenue linkage | When connected | When connected | Where connected | Custom |
| Premium rendering | Add-on | Allowance/add-on | Larger allowance | Custom |
| CSV onboarding | Included | Included | Included | Included |
| URL-assisted import | Gated | Gated | Gated | Custom |
| Shopify / commerce integration | Future / no | Limited when available | Included where available | Custom |
| API | No | Gated | Gated / included | Custom |
| Support | Standard | Priority | Priority | SLA / dedicated |

These values remain hypotheses until pilot evidence confirms them.

---

## 6. Entitlement Decision Rule

A plan entitlement must not be determined only by AI cost.

When revising session/render allowances, Product and Finance must evaluate five dimensions together:

1. **Merchant usability** — enough capacity to run a meaningful campaign.
2. **Market credibility** — competitive against VTO and optical-commerce alternatives.
3. **Merchant ROI** — plausible path to value greater than software fee.
4. **Sustainable COGS** — Base Case economics remain viable.
5. **Margin trajectory** — credible path toward mature 70–80% economics.

A plan may operate at ~50–65% GM during market capture if the exception is deliberate and the commercial evidence justifies it.

---

## 7. AI Commerce Session Meter

An AI Commerce Session is a merchant-scoped shopper session that first reaches the AI recommendation / decision boundary.

Do not count ordinary page views.

Recommended rule:

> Count one Commerce Session when the shopper first executes recommendation or another approved decision-start event.

The meter must be idempotent across refresh, retry, polling, Compare reopen and duplicated events.

---

## 8. Render Pool Meter

Render consumption is independent from Commerce Session consumption.

Count each successful Standard or Premium Try-On render against the appropriate pool.

Instrument:

- render attempt/success/failure;
- Standard vs Premium;
- provider/model;
- merchant/session/campaign;
- unit-cost version;
- fallback reason.

A shopper may render multiple frames in one Commerce Session. Do not force exactly two frames just because packaging assumes an average of two renders/session.

---

## 9. Limit Behavior

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

During Pilot, Product may extend usage intentionally when additional real traffic has high learning or case-study value, provided economics remain gross-profit positive or are explicitly approved as market-capture investment.

---

## 10. Overage Policy

Working post-pilot anchors:

- **+500 Standard renders: $49**;
- **+1,000 Standard renders: $99**.

These are provisional.

Overage exists to protect cost and support expansion, not to make the base package feel artificially constrained.

---

## 11. Render Quality Policy

Merchant-facing modes:

```text
STANDARD
PREMIUM
```

Provider/model names remain implementation details.

Premium usage is separately metered and must use sustainable procurement economics.

---

## 12. Campaign Entitlement

Campaign becomes a first-class Commerce object once merchants require persistent multi-campaign workflow.

Working additional-campaign anchor:

> **+$99–199 / active campaign / month**

Campaign and Commerce Intelligence are strategically important because they can increase merchant value and revenue without increasing rendering COGS proportionally.

---

## 13. Analytics Entitlement

### Basic

- Commerce Sessions;
- recommendation completion;
- Try-On / Compare;
- favorites;
- product clicks;
- inquiries;
- top frames;
- basic source/campaign view;
- session/render usage.

### Advanced

- source/campaign comparison;
- high-intent shopper analysis;
- catalog/frame performance;
- funnel segmentation;
- AI-agent segmentation where reliable;
- conversion linkage where connected;
- period-over-period reporting.

Analytics must distinguish observed event, inferred intent, verified conversion and attributed revenue.

---

## 14. Provider / Cost Attribution

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

## 15. Channel Attribution

Supported merchant acquisition relationships:

```text
DIRECT
REFERRAL_PARTNER
AGENCY_PARTNER
STRATEGIC_PARTNER
```

Partner attribution must be durable and not depend on a coupon alone.

---

## 16. Production-Readiness Rule for Sales

Every entitlement status:

```text
PRODUCTION_READY
PILOT_ASSISTED
PLANNED
NOT_OFFERED
```

Sales may contract only production-ready or explicitly approved pilot-assisted capabilities.

---

## 17. Pilot Data Required

For every Pilot collect:

### Merchant value

- merchant monthly traffic;
- traffic routed to VisuTry;
- AI experience entry rate;
- recommendation/Try-On/Compare usage;
- product clicks/favorites/inquiries;
- verified conversion/revenue where available;
- merchant-perceived value;
- willingness to pay;
- retention/continuation decision.

### AI economics

- Commerce Sessions;
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

Highest-priority unknowns:

1. merchant-perceived value;
2. AI experience entry rate;
3. renders / Commerce Session;
4. intent/conversion uplift;
5. willingness to pay;
6. margin trajectory.

---

## 18. Acceptance Criteria for First External Paid Pilot

1. Merchant has `FOUNDING_PILOT` server-side.
2. 500 Commerce Sessions are metered.
3. 1,000 Standard renders are metered.
4. Both meters are durable/idempotent.
5. AI usage reconciles to merchant/session/provider.
6. Standard quality policy is server-owned.
7. Limit state/manual extension are operational.
8. Source/campaign context persists through intent.
9. Merchant/admin can see meaningful usage/funnel data.
10. Partner attribution can be recorded.
11. Consumer counters remain isolated.
12. Sales does not promise guaranteed conversion or unimplemented features.

---

## 19. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created merchant entitlement baseline. |
| 2026-08-06 | v2: sustainable procurement rebasing. |
| 2026-08-06 | v3: dual-meter market-aware capacity model. |
| 2026-08-06 | **v4: aligned entitlement decisions to Merchant Value First economics; added market-credibility, merchant ROI, stage-based GM flexibility, market-capture extensions and margin-trajectory evidence requirements.** |
