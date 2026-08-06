# VisuTry Merchant Commercial Entitlements Spec

**Status:** Approved baseline for Demo/Pilot alignment; formal Launch/Growth/Scale entitlements gated by implementation status  
**Owner:** Product / Engineering / Sales  
**Created:** 2026-08-06  
**Last updated:** 2026-08-06  
**Related pricing:** `docs/strategy/merchant-pricing-packaging-unit-economics.md`  
**Related provider risk:** `docs/strategy/merchant-provider-risk-and-fallback-economics.md`  
**Related Store MVP:** `docs/product/specs/visutry-store-mvp.md`  
**Related sales demo:** `docs/product/specs/visutry-store-sales-demo.md`  
**Related pilot plan:** `docs/product/plans/visutry-store-demo-pilot-readiness-plan.md`

---

## 1. Purpose

This spec translates merchant pricing into concrete product entitlement and backend metering requirements.

The operating rule is:

> **Sales promise = merchant value = product entitlement = server-side policy = measurable usage.**

The current baseline follows Market-Aware Economics v3.

Key correction:

> **AI Commerce Session allowance and AI render allowance are separate entitlements.**

A merchant buys shopper capacity. Rendering is the dominant variable cost and must be controlled independently.

---

## 2. Commercial Objects

The minimum commercial model must represent:

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

Each merchant commercial state should eventually resolve at minimum:

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

Do not infer entitlement from frontend copy or Stripe price amount alone.

---

## 3. Plan Codes

Canonical internal plan codes:

```text
FOUNDING_PILOT
LAUNCH
GROWTH
SCALE
ENTERPRISE
```

Price and entitlement version must be independently changeable.

---

## 4. Founding Pilot Entitlement

Commercial anchor:

> **USD 149 / 30 days**

Minimum deliverable:

- one merchant tenant;
- one hosted Store / campaign experience;
- 8–50 reviewed frames;
- up to **500 AI Commerce Sessions**;
- up to **1,000 Standard Try-On renders**;
- AI frame recommendation;
- Standard Try-On;
- Frame Compare;
- source / campaign continuity;
- product destination continuity;
- favorite / product click / inquiry signals;
- merchant/admin performance view;
- assisted setup;
- weekly pilot report;
- privacy / retention controls;
- merchant-specific session and render policies.

The Pilot is a validation product. It should provide enough capacity for meaningful real traffic while preserving explicit render-cost control.

Pilot exclusions unless explicitly agreed:

- unlimited traffic;
- public Shopify app;
- generalized campaign builder;
- custom API;
- real-time inventory sync;
- enterprise SSO;
- guaranteed revenue uplift;
- autonomous agent checkout;
- medical / optical measurement claims.

---

## 5. Formal Entitlement Matrix — v3

| Entitlement | Launch | Growth | Scale | Enterprise |
| --- | --- | --- | --- | --- |
| Merchant tenant | 1 | 1 | 1 | Custom / multi-brand |
| Monthly AI Commerce Sessions | **750** | **1,500** | **4,000** | Custom |
| Standard Render Pool | **1,500** | **3,000** | **8,000** | Custom |
| Active campaigns | 1 | 3 | 10 | Custom |
| Catalog guideline | 100 | 500 | 2,000 | Custom |
| Recommendation | Included | Included | Included | Included |
| Standard Try-On | Included within render pool | Included within render pool | Included within render pool | Custom |
| Compare | Included | Included | Included | Included |
| Product click / favorite / inquiry | Included | Included | Included | Included |
| Source attribution | Basic | Advanced | Advanced | Custom |
| AI-agent source classification | Included | Included | Included | Included |
| Commerce intelligence | Basic | Advanced | Advanced | Custom |
| Conversion / revenue attribution | When connected | When connected | Included where connected | Custom |
| Premium rendering | Add-on | Allowance / add-on | Larger allowance | Custom |
| CSV onboarding | Included | Included | Included | Included |
| URL-assisted import | Gated | Gated | Gated | Custom |
| Shopify / commerce integration | Future / no | Limited when available | Included where available | Custom |
| API | No | Gated | Gated / included | Custom |
| Support | Standard | Priority | Priority | SLA / dedicated |

These values supersede both:

- the original 1,000 / 5,000 / 10,000 session baseline;
- the v2 finance-floor 250 / 600 / 1,200 baseline.

---

## 6. AI Commerce Session Meter

### Definition

An AI Commerce Session is a merchant-scoped shopper session that first reaches the AI recommendation / decision boundary.

Do not count ordinary page views.

Recommended v1 rule:

> Count one Commerce Session when the shopper first executes recommendation or another explicitly configured decision-start event.

### Idempotency

Do not count again for:

- refresh;
- retry;
- polling;
- reopening Compare;
- duplicated events.

---

## 7. Render Pool Meter

Render consumption is separate from Commerce Session consumption.

Count each successful Standard or Premium Try-On render against the appropriate render pool according to server-side policy.

Required instrumentation:

- render attempt;
- successful render;
- failed/retried render;
- Standard vs Premium;
- provider/model;
- merchantId;
- merchantSessionId;
- campaignId where available;
- unit-cost version / recoverable cost mapping.

A shopper may use multiple renders within one Commerce Session.

The shopper experience should not be hard-limited to exactly two frames merely because the packaging model assumes an average of two renders/session.

---

## 8. Limit Behavior

Commerce Session and render-pool limits are independent.

Suggested states:

```text
NORMAL
APPROACHING_LIMIT
LIMIT_REACHED
MANUAL_EXTENSION
OVERAGE_ENABLED
```

Rules:

1. The server owns limit enforcement.
2. Merchant-facing UX must not fail silently.
3. First Pilot merchants must not receive surprise charges.
4. Product/Sales should be alerted before 80% exhaustion.
5. A temporary audited extension may be granted during Pilot.
6. Reaching the render pool must not accidentally mutate Consumer credits or quotas.

---

## 9. Overage Policy

Working post-pilot anchors:

- **500 additional Standard renders: $49**;
- **1,000 additional Standard renders: $99**.

These prices are provisional until pilot data confirms:

- actual renders/session;
- sustainable provider cost;
- utilization distribution;
- merchant willingness to pay.

Session expansion may later be sold through a plan upgrade or a traffic bundle if merchants value shopper capacity separately from renders.

---

## 10. Render Quality Policy

Canonical merchant-facing modes:

```text
STANDARD
PREMIUM
```

Provider/model names are implementation details.

Rules:

1. Server chooses the permitted quality mode.
2. Shopper UI cannot bypass merchant entitlement.
3. Premium usage is independently metered.
4. Provider change must not alter the commercial product name.
5. Premium allowance must use sustainable procurement economics.

---

## 11. Campaign Entitlement

Campaign becomes a first-class Commerce entity once persistent multi-campaign workflow is required.

A commercially active campaign may differ by:

- acquisition source / audience;
- catalog subset;
- landing context;
- offer / merchandising context;
- measurement/reporting scope.

Working additional-campaign pricing:

> **+$99 to +$199 / active campaign / month**

Do not count ordinary UTM values as billable campaigns without persistent commercial configuration.

---

## 12. Catalog Entitlement

Count active merchant product/frame records eligible for recommendation and commerce experience.

Do not count inactive/history-only records.

Stable commerce identity should preserve where available:

- merchant ID;
- SKU / product ID;
- canonical product URL;
- name;
- price/currency;
- image;
- enriched frame attributes;
- status.

---

## 13. Analytics Entitlement

### Basic

- Commerce Sessions;
- recommendation completion;
- Try-On rate;
- Compare rate;
- favorites;
- product clicks;
- inquiries;
- top frames;
- basic source/campaign view;
- session and render usage.

### Advanced

- source comparison;
- campaign comparison;
- high-intent shopper analysis;
- catalog/frame performance;
- funnel segmentation;
- AI-agent source segmentation where reliable;
- conversion linkage where connected;
- period-over-period reporting;
- later export/scheduled reporting.

Analytics copy must distinguish observed event, inferred intent, verified conversion and attributed revenue.

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

This supports:

- provider failover analysis;
- procurement alpha calculation;
- official-fallback stress analysis;
- merchant/cohort gross-margin reconciliation.

---

## 15. Channel Attribution

Supported acquisition relationships:

```text
DIRECT
REFERRAL_PARTNER
AGENCY_PARTNER
STRATEGIC_PARTNER
```

Minimum durable concepts:

```text
partnerId?
partnerType?
commissionPolicyVersion?
commissionStartAt?
commissionEndAt?
```

Partner attribution must not depend on coupon code alone.

---

## 16. Production-Readiness Rule for Sales

Every entitlement should be classified:

```text
PRODUCTION_READY
PILOT_ASSISTED
PLANNED
NOT_OFFERED
```

Sales may contract only `PRODUCTION_READY` or explicitly approved `PILOT_ASSISTED` capabilities.

---

## 17. Pilot Data Required to Recalibrate Entitlements

For every Pilot merchant collect:

- merchant monthly traffic;
- traffic routed to VisuTry;
- AI experience entry rate;
- Commerce Sessions;
- recommendation completion;
- Standard renders/session;
- Premium renders/session;
- render-pool utilization;
- Try-On completion;
- Compare use;
- provider/model distribution;
- actual AI cost/session;
- product clicks;
- favorites;
- inquiries;
- verified conversions/revenue where available;
- support hours;
- onboarding hours;
- requested campaign count;
- requested integrations;
- willingness-to-pay feedback.

The highest-priority unknowns are:

1. AI experience entry rate;
2. average renders / Commerce Session;
3. intent / conversion uplift;
4. willingness to pay by merchant segment.

---

## 18. Acceptance Criteria for First External Paid Pilot

Before a non-team Merchant Pilot is commercially ready:

1. Merchant is assigned `FOUNDING_PILOT` server-side.
2. **500 Commerce Sessions** are server-metered.
3. **1,000 Standard renders** are server-metered.
4. Both meters are durable and idempotent.
5. AI usage can be reconciled to merchant/session/provider.
6. Standard quality policy is server-owned.
7. Limit state and manual extension are operational.
8. Source/campaign context persists through intent.
9. Product destination remains attached to frames.
10. Merchant/admin can view commercially relevant usage and funnel data.
11. Partner attribution can be recorded manually where needed.
12. Consumer credit/subscription counters remain isolated.
13. Sales does not promise guaranteed conversion or unimplemented Scale/Enterprise features.

---

## 19. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created first merchant commercial entitlement baseline. |
| 2026-08-06 | v2: rebased session allowances on sustainable procurement economics. |
| 2026-08-06 | **v3: separated Commerce Session capacity from Standard Render Pool; Pilot/Launch/Growth/Scale session allowances revised to 500 / 750 / 1,500 / 4,000 and Standard render pools to 1,000 / 1,500 / 3,000 / 8,000; added dual-meter limit and overage rules.** |
