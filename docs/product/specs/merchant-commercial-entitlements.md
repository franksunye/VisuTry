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

> **Sales promise = product entitlement = server-side policy = measurable usage.**

No merchant plan may depend only on frontend copy or manual convention.

The current entitlement baseline is based on **Sustainable Procurement Economics v2**, not on unusually low current provider pricing.

A feature may appear in the pricing direction without being immediately sellable. Sales may only promise capabilities marked production-ready or explicitly included in a controlled pilot agreement.

---

## 2. Commercial Objects

The minimum commercial model must be able to represent:

```text
Merchant
  ├── Merchant Plan
  ├── Usage Allowance
  ├── Campaign Entitlements
  ├── Catalog Entitlements
  ├── Render Quality Entitlements
  ├── Analytics Entitlements
  └── Partner Attribution?
```

The future Commerce domain may introduce dedicated plan/subscription/campaign entities when real workflow requires them. The current implementation may use configuration or policy records provided the commercial contract is server-owned and durable.

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

Do not encode display price in the plan code.

Price may change independently from entitlement version.

Each merchant commercial state should eventually resolve at minimum:

```text
planCode
entitlementVersion
billingStatus
billingPeriodStart
billingPeriodEnd
commerceSessionAllowance
commerceSessionsUsed
campaignAllowance
premiumRenderAllowance?
partnerId?
```

Exact schema may evolve, but these concepts must remain explicit.

---

## 4. Founding Pilot Entitlement

Commercial anchor:

> **USD 149 / 30 days**

Minimum deliverable:

- one merchant tenant;
- one hosted Store / campaign experience;
- 8–50 reviewed frames;
- up to **250 AI Commerce Sessions**;
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
- merchant-specific usage policy.

Pilot exclusions unless explicitly agreed:

- public Shopify app;
- generalized campaign builder;
- custom API;
- real-time inventory sync;
- enterprise SSO;
- guaranteed revenue uplift;
- unlimited traffic;
- autonomous agent checkout;
- medical / optical measurement claims.

The Pilot is a validation product. Its 250-session allowance is deliberately based on sustainable procurement economics and is large enough to observe shopper behavior without creating a long-term usage promise from exceptional provider pricing.

---

## 5. Formal Entitlement Matrix

This matrix defines the target packaging contract. Production availability must be checked separately.

| Entitlement | Launch | Growth | Scale | Enterprise |
| --- | --- | --- | --- | --- |
| Merchant tenant | 1 | 1 | 1 | Custom / multi-brand |
| Monthly AI Commerce Sessions | **250** | **600** | **1,200** | Custom |
| Active campaigns | 1 | 3 | 10 | Custom |
| Catalog guideline | 100 | 500 | 2,000 | Custom |
| Recommendation | Included | Included | Included | Included |
| Standard Try-On | Included | Included | Included | Included |
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

The entitlement values above supersede the earlier 1,000 / 5,000 / 10,000 session baseline.

---

## 6. AI Commerce Session Meter

### 6.1 Definition

An AI Commerce Session is a merchant-scoped shopper decision session that enters a recommendation / try-on commerce journey.

Recommended meter rule for v1:

> Count one Commerce Session when a valid merchant shopper session first reaches the recommendation execution boundary or another explicitly configured decision-start event.

Do not count ordinary page views as Commerce Sessions.

### 6.2 Why session-level metering

Merchant-facing pricing should correspond to shoppers served, not model internals.

Backend instrumentation must still record:

- recommendation attempts / successes;
- standard render attempts / successes;
- premium render attempts / successes;
- provider / model;
- recoverable provider cost metadata;
- failed attempts;
- number of frames rendered;
- compare use.

This allows Product/Finance to reconcile commercial usage with actual cost and compare Best/Base/Stress provider economics.

### 6.3 Idempotency

A single shopper session must not be billed repeatedly because of:

- page refresh;
- retry;
- polling;
- reopening Compare;
- duplicated event delivery.

The meter must be idempotent.

---

## 7. Render Quality Policy

Canonical merchant-facing quality modes:

```text
STANDARD
PREMIUM
```

Provider model names are implementation details and must not be exposed as plan features.

Rules:

1. Server chooses the permitted quality mode from merchant/campaign entitlement.
2. Shopper UI must not bypass merchant allowance.
3. Premium usage must be independently measurable.
4. Provider changes must not require repricing the public feature name.
5. A merchant may be allowed campaign-level premium policy later.
6. Premium allowance must be set from a sustainable Premium procurement benchmark, not the current low-cost provider price.

---

## 8. Campaign Entitlement

Campaign is expected to become a first-class Commerce domain object once merchant workflow requires persistent campaign configuration.

Until then, campaign allowance may be represented by durable merchant/campaign attribution/configuration records.

A commercially active campaign is a merchant experience with a distinct combination of one or more of:

- acquisition source / audience;
- catalog subset;
- landing context;
- offer / merchandising context;
- measurement/reporting scope.

Do not count ordinary UTM values as separately billable campaigns unless the merchant has a configured commercial campaign object or equivalent product configuration.

Future additional-campaign pricing baseline:

> **+$99 to +$199 per active campaign / month**

Product must preserve the ability to meter active campaigns per billing period.

---

## 9. Catalog Entitlement

Catalog count is a packaging guideline and operational fence, not a claim that each plan requires a separate storage architecture.

Meter:

> Count active merchant product/frame records eligible for recommendation and commerce experiences.

Do not bill inactive/history-only frames as active catalog entitlement.

Merchant product identity should include stable commerce fields where available:

- merchant ID;
- SKU / product ID;
- canonical product URL;
- name;
- price / currency where verified;
- image;
- enriched frame attributes;
- status.

Catalog limits may later be replaced by product-sync or integration economics if pilot evidence shows SKU count is not a meaningful buying fence.

---

## 10. Analytics Entitlement

### Basic

Intended Launch baseline:

- shopper sessions;
- recommendation completion;
- Try-On rate;
- Compare rate;
- favorites;
- product clicks;
- inquiries;
- top frames;
- basic source/campaign view;
- usage allowance view.

### Advanced

Intended Growth/Scale baseline:

- source comparison;
- campaign comparison;
- high-intent shopper analysis;
- catalog / frame performance;
- funnel segmentation;
- AI-agent source segmentation where reliable;
- conversion linkage where integrated;
- period-over-period reporting;
- export / scheduled report later when implemented.

Analytics copy must distinguish observed event, inferred intent, verified conversion and attributed revenue.

---

## 11. Overage Policy

The first Pilot stage should not launch surprise automated overage billing.

Initial policy:

1. Merchant receives an included monthly Commerce Session allowance.
2. Usage is visible internally and preferably to the merchant.
3. Approaching allowance triggers upgrade / sales review.
4. Hard stop, soft overage, or automatic overage is configured server-side.
5. Pilot merchants should not unexpectedly incur uncommunicated overage charges.

Working post-pilot commercial anchors:

- **100 additional Commerce Sessions: $49**;
- **1,000 additional Commerce Sessions: $399**.

These anchors remain subject to pilot validation and sustainable procurement review.

---

## 12. Provider / Cost Attribution Requirement

Because provider cost is a commercial risk, every merchant AI task should be attributable where practical to:

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

This enables:

- provider failover analysis;
- procurement alpha calculation;
- official-fallback stress analysis;
- merchant/cohort gross-margin reconciliation.

Customer entitlements must not depend on provider identity.

---

## 13. Channel Attribution Requirement

A merchant account may have an acquisition relationship:

```text
DIRECT
REFERRAL_PARTNER
AGENCY_PARTNER
STRATEGIC_PARTNER
```

Minimum durable commercial fields eventually required:

```text
partnerId?
partnerType?
commissionPolicyVersion?
commissionStartAt?
commissionEndAt?
```

Partner attribution must not depend on a temporary coupon code alone.

---

## 14. Discount and Contract Metadata

The system should eventually distinguish:

- list price;
- approved discount;
- net contract price;
- annual prepay;
- founding price;
- partner relationship;
- credit balance;
- manual commercial exception.

Do not infer plan entitlement from Stripe price amount alone.

---

## 15. Production-Readiness Rule for Sales

Every entitlement should have one of these statuses internally:

```text
PRODUCTION_READY
PILOT_ASSISTED
PLANNED
NOT_OFFERED
```

Sales rules:

- `PRODUCTION_READY`: may be included in standard offer.
- `PILOT_ASSISTED`: may be offered only with explicit operational ownership.
- `PLANNED`: roadmap only, not current contractual functionality.
- `NOT_OFFERED`: must not be represented as available.

---

## 16. Pilot Data Required to Recalibrate Entitlements

For every pilot merchant collect:

- active frames;
- traffic source mix;
- Commerce Sessions;
- recommendation completion;
- average renders/session;
- Try-On completion;
- Compare use;
- provider/model distribution;
- actual AI cost/session;
- premium-render requests;
- product clicks;
- favorites;
- inquiries;
- verified conversions where available;
- support hours;
- onboarding hours;
- merchant-requested campaign count;
- requested integrations;
- willingness-to-pay feedback.

After 3–5 real merchants, entitlement values should be reviewed before being treated as permanent public limits.

---

## 17. Acceptance Criteria for Pilot Commercial Readiness

Before a non-team merchant pilot is considered commercially ready:

1. Merchant is assigned a plan / pilot entitlement server-side.
2. **250 Commerce Session allowance** is server-enforced for `FOUNDING_PILOT`.
3. Commerce Session meter is durable and idempotent.
4. Recommendation and render usage can be reconciled to merchant/session/provider.
5. Source/campaign context persists through intent.
6. Product destination remains attached to merchant frames.
7. Merchant/admin can view commercially relevant funnel signals.
8. Partner attribution can be recorded manually if the pilot came through a partner.
9. Consumer credit/subscription counters remain isolated.
10. Pilot agreement does not promise unimplemented Scale/Enterprise functionality.

---

## 18. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created first merchant commercial entitlement and backend metering baseline aligned to pricing/unit economics. |
| 2026-08-06 | **v2:** rebased Commerce Session entitlements on sustainable procurement economics; Pilot/Launch/Growth/Scale allowances changed to **250 / 250 / 600 / 1,200**; added provider/cost attribution and working overage anchors. |
