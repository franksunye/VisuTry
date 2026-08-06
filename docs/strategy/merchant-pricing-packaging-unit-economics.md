# VisuTry Merchant Pricing, Packaging & Unit Economics

**Status:** Active internal commercial baseline — Stage-Based Intent-First Pricing v6  
**Owner:** Product / Strategy / Engineering / Sales  
**Created:** 2026-08-06  
**Last updated:** 2026-08-06  
**Review cadence:** Monthly during Pilot / market-capture stage; at every major product-maturity gate thereafter  
**Related provider risk:** `docs/strategy/merchant-provider-risk-and-fallback-economics.md`  
**Related entitlement spec:** `docs/product/specs/merchant-commercial-entitlements.md`  
**Related implementation plan:** `docs/product/plans/merchant-pricing-entitlement-implementation-plan.md`

---

## 1. Purpose

This document is the internal source of truth for merchant pricing, packaging, unit economics and commercial-value framing.

Pricing is a cross-functional operating contract:

> **Sales promise = merchant value = packaging = entitlement = usage meter = delivery cost = gross profit = channel economics.**

The product thesis remains:

> **Storefront is the delivery surface. AI Commerce / Campaign Engine is the business.**

The current-stage pricing thesis is:

> **VisuTry sells an AI-powered eyewear shopping decision experience and measurable purchase-intent intelligence.**

The operating principle is:

> **Merchant Value First. Sustainable Economics Always. Margin Expansion Over Time.**

A second v6 principle is now explicit:

> **Pricing is stage-dependent and versioned. The price that best accelerates the first 3–10 merchants is not assumed to be the price that maximizes value at Early Scale or Mature Platform stage.**

---

## 2. Early-Stage Commercial Scope — Intent First

VisuTry must not position the current Pilot as a revenue-attribution or conversion-optimization platform.

Current reliably sellable value:

- merchant-specific catalog;
- AI recommendation;
- Try-On;
- Frame Compare;
- source / campaign context;
- Product Click;
- Favorite;
- Inquiry;
- top-frame and high-intent behavior insights;
- merchant-visible usage and intent funnel.

Current product does **not** need to prove:

- attributed order revenue;
- incremental conversion uplift;
- incremental GMV;
- causal ROI.

Value maturity remains:

```text
CURRENT
Observed Engagement + Purchase Intent
        ↓
LATER
Attributed Conversion / Revenue
(requires commerce integration)
        ↓
FUTURE
Incremental Conversion / Revenue
(requires credible experimentation)
```

---

## 3. Pricing Is a Product-Lifecycle Decision

VisuTry should not assume one static public pricing structure from Pilot through maturity.

| Commercial stage | Primary pricing objective | GM guidance | Pricing posture |
| --- | --- | ---: | --- |
| **Market Capture / Pilot** | make the first purchase easy to understand and easy to justify without ROI proof | **50–65% acceptable** | low-friction, time-boxed, evidence-oriented offer |
| **Early Scale** | convert validated value into repeatable recurring revenue | **60–70%+ target** | clearer tiering by shopper capacity, campaigns and intelligence depth |
| **Mature Platform** | monetize differentiated workflow, integrations and pricing power | **70–80% target** | higher ARPU, enterprise packaging, integration/API/commerce-intelligence expansion |
| **Long-term aspiration** | high-quality blended software economics | **~75%+ blended** | optimize mix, procurement and higher-margin product layers |

The stages do **not** require the same price, allowance, discount or contract structure.

### 3.1 Current sales priority

For the first stage, Sales must be able to answer a simple merchant question:

> **“Why is this Pilot worth trying now, even before VisuTry can prove downstream revenue attribution?”**

The answer must be easy to perceive:

- use your own frames;
- give real shoppers personalized recommendations;
- let them Try-On and Compare;
- observe Product Click / Favorite / Inquiry intent;
- learn which frames and traffic sources create stronger shopping intent;
- do it in a bounded 30-day experiment with limited implementation burden.

The current Pilot therefore optimizes for **trialability and visible decision value**, not maximum ARPU.

---

## 4. Current External Sellable Offer

### Founding Merchant Pilot

**Current external sales anchor:**

> **USD 149 / 30 days**

Included baseline:

- 1 merchant;
- 1 hosted Store / campaign experience;
- 8–50 reviewed frames;
- **500 AI Commerce Sessions**;
- **1,000 Standard Try-On renders**;
- recommendation;
- Try-On;
- Compare;
- Product Click / Favorite / Inquiry tracking;
- source / campaign context;
- merchant intent report;
- assisted onboarding;
- weekly review.

This offer is intentionally easy to compare with existing VTO / optical-commerce tools while providing a broader decision workflow.

It is a **Founding Pilot offer**, not a permanent public price promise.

Do not promise lifetime pricing.

---

## 5. Future Packaging Hypotheses — Not Current Public Commitments

The following remain internal planning hypotheses for post-Pilot productization:

| Plan | Launch | Growth | Scale | Enterprise |
| --- | ---: | ---: | ---: | ---: |
| Working monthly price | **$199** | **$499** | **$999** | **$2,500+ / custom** |
| AI Commerce Sessions | **750** | **1,500** | **4,000** | Custom |
| Standard Render Pool | **1,500** | **3,000** | **8,000** | Custom |
| Active campaigns | 1 | 3 | 10 | Custom |
| Catalog guideline | 100 | 500 | 2,000 | Custom |
| Intent intelligence | Basic | Advanced | Advanced | Custom |
| Commerce integration | Future / when justified | Gated | Where connected | Custom |
| Support | Standard | Priority | Priority | SLA / dedicated |

These values are **not immutable price cards**.

They may change after merchant evidence on:

- willingness to pay;
- perceived differentiation;
- actual Commerce Session demand;
- actual renders/session;
- competitor pricing;
- provider cost;
- support burden;
- channel economics;
- product maturity;
- integration depth.

---

## 6. Pricing Versioning and Change Policy

Pricing must be treated as a versioned commercial artifact.

Minimum concepts:

```text
pricingVersion
entitlementVersion
effectiveFrom
customerCohort
contractPrice
listPrice
approvedDiscount
renewalPolicy
```

Rules:

1. **Internal pricing may be revised at any review gate.**
2. **Public pricing may change for new merchants when product value, market position or costs change.**
3. Existing signed terms are honored for their contract period unless the agreement explicitly allows adjustment.
4. Renewal pricing may migrate to a newer pricing version subject to contract and Sales policy.
5. Founding/Pilot pricing should be time-boxed or contract-boxed, not lifetime locked by default.
6. Price and entitlement version must be independently changeable.
7. A lower provider cost does not automatically create a larger permanent allowance.
8. A higher product maturity level does not require preserving an early market-capture price.

Pricing evolution is expected, not treated as a failure of the initial model.

---

## 7. Gross-Margin Philosophy

AI-native Martech carries material variable inference COGS. Traditional SaaS margin standards are mature-state references, not Day-1 constraints.

| Stage | GM guidance | Meaning |
| --- | ---: | --- |
| Pilot / Market Capture | **50–65% acceptable** | invest margin in adoption and learning |
| Early Scale | **60–70%+ target** | improve repeatability and cost control |
| Mature Platform | **70–80% target** | scalable software economics |
| Long-term preferred benchmark | **~75%+ blended** | mature-quality economics |

Rules:

- recurring direct GM should not remain below ~50% without explicit strategic approval;
- fallback operation must remain gross-profit positive;
- channel deals must preserve positive contribution;
- low-margin offers must be purposeful and time-limited.

The important operating rule is:

> **A commercially weak 80% GM offer is worse than a 55–65% GM offer that is easy to buy, easy to understand and creates strong merchant learning.**

---

## 8. Margin Trajectory

Strategic planning assumption:

> **Over a 3–5 year horizon, cost per unit of equivalent AI capability is expected to decline structurally, while product quality and usage intensity may also rise.**

This is a planning thesis, not a guarantee.

Margin expansion may come from:

- lower model/provider prices;
- volume procurement;
- provider routing;
- cheaper models for lower-value steps;
- lower renders/session through better recommendation;
- higher plan prices as value becomes clearer;
- Campaign / Commerce Intelligence expansion;
- integration/API/enterprise revenue;
- support efficiency.

Future cost reductions should partly improve margin, CAC capacity and channel economics rather than being fully passed through as free usage.

---

## 9. Cost Philosophy — Three Procurement Cases

| Cost case | Meaning | Use |
| --- | --- | --- |
| **Best / Procurement Alpha** | unusually favorable provider pricing such as current grsai | upside and commercial buffer |
| **Base / Sustainable Procurement** | repeatable long-term commercial procurement level | primary planning case |
| **Stress / Official API** | direct official list price / emergency fallback | continuity test |

Current observed Best Case:

| Capability | Model | Unit cost |
| --- | --- | ---: |
| Recommendation | `gemini-3.1-flash-lite` | RMB 0.0007425 |
| Standard Try-On | `nano-banana-2-lite` | RMB 0.02725 |
| Premium Try-On | `nano-banana-2` | RMB 0.07425 |
| Failed/retried request | current provider behavior | no model cost |
| Compare | reuses existing renders | no extra model cost |

Current internal planning assumptions:

- Base Standard render: **$0.025 / successful render**;
- Recommendation reserve: **$0.0002 / Commerce Session**;
- Stress Standard render: approximately **$0.0336 / successful render**.

---

## 10. Commercial Usage Model — Dual Meter

Merchant-facing unit:

> **AI Commerce Session** = one merchant-scoped shopper decision journey that reaches the AI recommendation boundary.

Cost meters:

```text
Commerce Sessions
Standard Renders
Premium Renders
```

Current packaging planning average:

> **~2 Standard renders per Commerce Session**

This is a hypothesis only; Pilot data must replace it.

---

## 11. Merchant Value and Sales Positioning

Current value proposition:

> **Turn eyewear traffic into personalized shopping decisions and measurable purchase intent.**

The Merchant must not hear:

> `$149 for 1,000 generated images`

or:

> `we will increase your revenue by X%`.

The Merchant should hear:

> **Use your own catalog to run a 30-day AI shopping experience. See how shoppers move from recommendation to Try-On, Compare and purchase-intent actions.**

The first-stage product should be easy to compare against VTO products but visibly broader than VTO through:

- recommendation;
- shortlist / decision support;
- Compare;
- product intent signals;
- source/campaign insight;
- merchant-specific frame intelligence.

---

## 12. Value Hurdles, Not ROI Claims

Internal economics may use hypothetical value hurdles, but Sales must not represent them as observed ROI.

Example:

- Growth hypothesis: $499/month;
- illustrative AOV: ~$150;
- mathematically, ~4 additional orders would cover the fee.

This is only a **commercial plausibility check**.

Early Pilot decisions should prioritize:

- merchant-perceived value;
- Product Click / Favorite / Inquiry behavior;
- merchant willingness to continue;
- willingness to route more traffic;
- willingness to pay;
- sustainable positive economics.

---

## 13. Current Base-Case Economics

Planning assumptions:

- Standard render: $0.025;
- payment reserve: 5% revenue;
- infra/observability reserve: 2%;
- support reserve: Launch $10 / Growth $20 / Scale $40.

At full included render-pool consumption:

| Plan | Revenue | AI Cost | Other direct reserves | Approx. direct cost | Approx. GM |
| --- | ---: | ---: | ---: | ---: | ---: |
| Launch | $199 | ~$37.5 | ~$24 | ~$61.5 | **~69%** |
| Growth | $499 | ~$75 | ~$55 | ~$130 | **~74%** |
| Scale | $999 | ~$200 | ~$110 | ~$310 | **~69%** |

These figures are planning references, not required current-stage thresholds.

---

## 14. Channel, Discount and Expansion Principles

Planning channel mix remains approximately **50% direct / 50% channel**.

- Referral Partner: **20% of net collected recurring subscription revenue for first 12 months**;
- Agency / Solution Partner: **up to 30% recurring margin/revenue share**;
- Strategic Partner: negotiated;
- Merchant referral: prefer account credit.

Default annual hypothesis remains:

> **Pay for 10 months, receive 12 months.**

But annual terms should not be pushed during the first Pilot unless the merchant explicitly wants them. Early-stage Sales should optimize for low-friction entry rather than maximum contract value.

Working future expansion anchors remain provisional:

- +500 Standard renders: $49;
- +1,000 Standard renders: $99;
- Premium Quality: +$99/month anchor;
- additional Campaign: +$99–199/month anchor.

---

## 15. Pricing Review Gates

### After first paid Pilot

Review:

- was $149 easy to explain and close?
- did the merchant understand the value without ROI attribution?
- did 500 Commerce Sessions / 1,000 renders feel sufficient?
- what objections appeared?

### After 3 paid merchants

Review:

- willingness to pay;
- perceived comparison against VTO / optical-commerce alternatives;
- continuation intent;
- usage distribution;
- support burden;
- actual GM.

Pricing may be revised at this gate.

### After 5 paid merchants

Decide whether to:

- keep Pilot at $149;
- raise/lower the Pilot price;
- change included capacity;
- introduce a setup fee;
- productize Launch;
- change Launch/Growth hypotheses.

### After 10 paying merchants

Create the next formal pricing version using:

- merchant conversion from Pilot to recurring plan;
- actual willingness to pay;
- retention/expansion;
- competitive alternatives;
- AI COGS;
- channel economics;
- support cost;
- product maturity.

### Early Scale / Mature gates

Pricing should be reviewed again when:

- commerce integrations become standard;
- Campaign becomes a first-class paid object;
- intent analytics becomes materially differentiated;
- enterprise/API capabilities are sellable;
- procurement cost changes materially.

---

## 16. Operating Principles

1. **Merchant Value First. Sustainable Economics Always. Margin Expansion Over Time.**
2. **Pricing is stage-dependent and versioned.**
3. **The first Pilot price optimizes trialability, not mature-platform ARPU.**
4. **Current product sells decision experience + measurable purchase intent, not revenue attribution.**
5. **Observed intent, attributed conversion and incremental revenue are different evidence levels.**
6. **75% is a mature benchmark, not an early-stage sacred constraint.**
7. **Do not use procurement alpha to define permanent entitlement.**
8. **Do not preserve an early price after product value and maturity have materially increased.**
9. **Do not make future pricing changes retroactively without contract support.**
10. **Pilot evidence overrides planning assumptions.**

---

## 17. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Initial merchant pricing and unit-economics baseline. |
| 2026-08-06 | v2: sustainable procurement and provider-risk cases. |
| 2026-08-06 | v3: market-aware dual-meter packaging. |
| 2026-08-06 | v4: AI-native stage-based GM and margin trajectory. |
| 2026-08-06 | v5: Intent-First value framing; revenue attribution removed from Pilot prerequisites. |
| 2026-08-06 | **v6: made pricing explicitly stage-dependent and versioned; separated current external Founding Pilot pricing from future Launch/Growth/Scale hypotheses; added sales-first Pilot trialability objective, pricing-change policy, customer-cohort/version rules and recurring pricing review gates.** |
