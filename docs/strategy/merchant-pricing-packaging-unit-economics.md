# VisuTry Merchant Pricing, Packaging & Unit Economics

**Status:** Active internal commercial baseline — Market-Aware Economics v3  
**Owner:** Product / Strategy / Engineering / Sales  
**Created:** 2026-08-06  
**Last updated:** 2026-08-06  
**Review cadence:** Monthly during pilot stage; quarterly after pricing stabilizes  
**Related strategy:** `docs/strategy/commercial-strategy.md`  
**Related provider risk:** `docs/strategy/merchant-provider-risk-and-fallback-economics.md`  
**Related Store MVP:** `docs/product/specs/visutry-store-mvp.md`  
**Related commerce architecture:** `docs/product/specs/visutry-commerce-architecture.md`  
**Related pilot plan:** `docs/product/plans/visutry-store-demo-pilot-readiness-plan.md`  
**Related entitlement spec:** `docs/product/specs/merchant-commercial-entitlements.md`

---

## 1. Purpose

This document is the internal commercial baseline for VisuTry merchant pricing.

Pricing is treated as a cross-functional operating contract:

> **Sales promise = packaging = merchant value = feature entitlement = usage meter = delivery cost = gross margin = channel economics.**

The governing product thesis remains:

> **Storefront is the delivery surface. AI Commerce / Campaign Engine is the business.**

The governing pricing thesis remains:

> **VisuTry does not charge merchants for an AI try-on feature. It charges for an AI commerce system that turns traffic into measurable shopping intent and conversion.**

### v3 correction

v2 corrected the opposite problem of v1: it stopped relying on unusually low provider pricing, but it pushed customer-facing session allowances too low by treating the conservative four-render cost ceiling as if it were normal shopper behavior.

v3 therefore introduces a more practical rule:

> **Merchant-facing capacity and internal render-cost control are related, but they are not the same entitlement.**

VisuTry should sell enough shopper capacity for a merchant to run a meaningful campaign, while controlling COGS through a separate render pool and real usage instrumentation.

---

## 2. External Market Reality

Current market references show that merchants already see virtual try-on capacity in the hundreds to thousands of shoppers per month at sub-$200 price points.

Relevant examples researched for planning:

- Fittingbox Shopify pricing includes materially more VTO-user capacity at roughly $59–199/month depending on tier.
- Banuba and other VTO vendors similarly package thousands of monthly try-ons/users at low-to-mid hundreds of dollars.
- Optify proves optical merchants will pay roughly $149–299/month for a broader workflow that includes catalog, VTO, pre-shop and conversion/analytics value.

These products are not identical to VisuTry. VisuTry intends to sell a broader decision/conversion workflow:

> recommendation → try-on → compare → intent → attribution → commerce intelligence.

However, merchants will still compare effective shopper capacity. A plan that costs $199 but serves only ~250 shoppers/month is difficult to justify unless the value per shopper is already proven.

Therefore:

> **Usage packaging must be financially sustainable and market-credible at the same time.**

---

## 3. Cost Philosophy — Three Procurement Cases

VisuTry maintains three AI cost views.

| Cost case | Meaning | Use |
| --- | --- | --- |
| **Best / Procurement Alpha** | unusually favorable provider price such as current grsai pricing | upside, extra margin, CAC/channel buffer |
| **Base / Sustainable Procurement** | repeatable long-term commercial procurement level | primary pricing and entitlement baseline |
| **Stress / Official API** | direct official API list pricing / emergency fallback | continuity and downside stress test |

### 3.1 Best Case — current grsai observed cost

| Capability | Model | Current unit cost |
| --- | --- | ---: |
| Recommendation | `gemini-3.1-flash-lite` | RMB 0.0007425 / recommendation |
| Standard Try-On | `nano-banana-2-lite` | RMB 0.02725 / generated try-on |
| Premium Try-On | `nano-banana-2` | RMB 0.07425 / generated try-on |
| Failed / retried request | Current provider behavior | No model cost |
| Compare | Reuses existing try-ons | No additional model cost |

Planning FX remains RMB 7.0 = USD 1.00 for internal modeling only.

Approximate Best-Case USD costs:

- Recommendation: ~$0.00011
- Standard render: ~$0.00389
- Premium render: ~$0.01061

### 3.2 Base Case — sustainable procurement planning assumption

Until VisuTry has negotiated quotes from multiple stable providers, use:

> **Standard render = $0.025 / successful render**

Recommendation reserve:

> **$0.0002 / Commerce Session**

These are planning assumptions, not claims about a specific supplier.

### 3.3 Stress Case — official API planning assumption

For downside planning use:

> **Standard render = ~$0.0336 / successful render**

The provider-risk document owns detailed fallback assumptions.

---

## 4. Commercial Usage Model — Dual Meter

### 4.1 Merchant-facing unit: AI Commerce Session

An **AI Commerce Session** is one merchant-scoped shopper decision journey that reaches the AI recommendation/decision boundary.

It represents a shopper served, not an image.

### 4.2 Internal cost unit: render pool

A shopper session may generate zero, one, two, three or four try-on renders.

Therefore the commercial system must meter separately:

```text
Commerce Sessions
Standard Renders
Premium Renders
```

The previous v2 assumption of four renders for every session remains useful only as a stress ceiling. It must not define normal customer capacity.

### 4.3 Planning average

Until pilot evidence exists, v3 uses:

> **2 standard renders per Commerce Session as the packaging planning average**

This is deliberately more realistic than the v2 four-render ceiling while remaining conservative enough for early planning.

Actual average renders/session is a primary pilot metric and must replace this assumption.

---

## 5. Pricing Architecture v3

List prices remain value-based:

| Plan | Founding Pilot | Launch | Growth | Scale | Enterprise |
| --- | ---: | ---: | ---: | ---: | ---: |
| Price | **$149 / 30d** | **$199/mo** | **$499/mo** | **$999/mo** | **$2,500+ / custom** |
| AI Commerce Sessions | **500** | **750** | **1,500** | **4,000** | Custom |
| Standard Render Pool | **1,000** | **1,500** | **3,000** | **8,000** | Custom |
| Active campaigns | 1 | 1 | 3 | 10 | Custom |
| Catalog guideline | 8–50 | Up to 100 | Up to 500 | Up to 2,000 | Custom |
| Recommendation | Yes | Yes | Yes | Yes | Yes |
| Try-On / Compare | Yes | Yes | Yes | Yes | Yes |
| Source attribution | Pilot | Basic | Advanced | Advanced | Custom |
| AI-agent attribution | Yes | Yes | Yes | Yes | Custom |
| Commerce intelligence | Pilot report | Basic | Advanced | Advanced | Custom |
| Conversion/revenue linkage | Assisted | When connected | When connected | Included where connected | Custom |
| Premium rendering | Evaluation only | Add-on | Allowance/add-on | Larger allowance | Custom |
| Support | Assisted | Standard | Priority | Priority | SLA / dedicated |

These values supersede both the original 1,000 / 5,000 / 10,000 session baseline and the v2 250 / 600 / 1,200 finance-floor baseline.

### Why v3 is better

- v1 was supplier-cost optimistic.
- v2 was financially safe but commercially too restrictive.
- v3 separates shopper capacity from render consumption and therefore better reflects how merchants actually evaluate the product.

---

## 6. Merchant Economics / ROI Logic

Pricing must be defensible from the merchant side, not only from VisuTry gross margin.

Working internal planning assumptions until pilot data exists:

- eyewear merchant AOV: **~$150**;
- baseline ecommerce conversion: **~2%**;
- Growth ICP monthly traffic: **~10K–50K visits**;
- Launch ICP monthly traffic: **~2K–10K visits**;
- Scale ICP: **50K+ visits and/or multiple campaigns/markets**.

### 6.1 Growth plan example

Growth includes 1,500 AI Commerce Sessions.

At $499/month and $150 AOV, merchant fee is recovered by roughly:

> **4 incremental orders/month**

because 4 × $150 = $600.

Across 1,500 engaged shoppers, four incremental orders correspond to only about:

> **0.27 percentage points of incremental conversion within the served cohort**

This does not prove VisuTry will achieve that uplift. It establishes that the economic hurdle is plausible enough to test.

### 6.2 Value proof requirement

A $499 Growth plan is only defensible if VisuTry can show more than VTO volume.

The product must increasingly prove:

- Recommendation completion;
- Try-On / Compare engagement;
- Product clicks;
- Favorites / inquiries;
- high-intent shoppers;
- verified orders where connected;
- attributed revenue where evidence is reliable.

If VisuTry cannot connect usage to merchant outcomes, merchants will benchmark it as a VTO widget and $499 becomes difficult to defend.

---

## 7. Gross Margin Model v3

### 7.1 Internal targets

| Metric | Target |
| --- | ---: |
| Mature blended gross margin | **≥70–75%** |
| Mature direct SMB target | **~70–80%** |
| Enterprise / high-service target | **≥65–70%** |
| Contribution after channel share | **≥60% of retained revenue where practical** |
| Absolute recurring-contract exception floor | **50% contribution margin** |

The previous hard assumption that every standard SMB plan must show ≥75% gross margin at 100% maximum theoretical usage is intentionally relaxed. A market-usable product with measured overage is preferable to an unattractive plan with theoretical margin purity.

### 7.2 Base Case at full render-pool consumption

Assumptions:

- Standard render: $0.025;
- payment reserve: 5% revenue;
- infra/observability reserve: 2% revenue;
- support reserve: Launch $10 / Growth $20 / Scale $40.

| Plan | Revenue | Render Pool | AI Cost | Payment | Infra | Support | Direct Cost | Full-pool GM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Launch | $199 | 1,500 | ~$37.5 | ~$10 | ~$4 | $10 | **~$61.5** | **~69%** |
| Growth | $499 | 3,000 | ~$75 | ~$25 | ~$10 | $20 | **~$130** | **~74%** |
| Scale | $999 | 8,000 | ~$200 | ~$50 | ~$20 | $40 | **~$310** | **~69%** |

Recommendation cost is immaterial at this scale and included in planning reserve.

These are worst-case included-pool economics. Actual GM should be calculated from real render utilization.

### 7.3 Stress Case

At official-price stress cost (~$0.0336/render), the same pools reduce margin materially but remain manageable for temporary failover.

Sustained stress-mode operation requires one or more of:

- provider renegotiation;
- lower render pool on new contracts;
- overage activation;
- plan repricing;
- quality-routing changes.

Do not promise annual economics that assume the Best Case.

---

## 8. Overage / Expansion

The first Pilot must not surprise-charge merchants.

Usage states:

```text
NORMAL
APPROACHING_LIMIT
LIMIT_REACHED
MANUAL_EXTENSION
OVERAGE_ENABLED
```

Working post-pilot anchors:

- additional **500 standard renders: +$49**;
- additional **1,000 standard renders: +$99**;
- larger volume bundles: negotiated / plan upgrade.

Why render-based overage instead of session-only overage:

> the merchant buys shopper capacity, while rendering is the dominant variable AI cost.

This protects both merchant usability and VisuTry margin.

Public overage pricing remains provisional until 3–5 merchant pilots provide real distribution data.

---

## 9. Procurement Alpha Policy

Low-cost provider advantage is strategic margin, not customer entitlement.

Procurement alpha should fund:

- CAC recovery;
- channel commissions;
- promotions;
- R&D;
- provider switching risk;
- temporary fallback cost;
- margin buffer.

Do not automatically increase contractual render pools because a temporary provider is unusually inexpensive.

---

## 10. Premium Rendering

Merchant-facing quality modes remain:

```text
STANDARD
PREMIUM
```

Provider/model names are implementation details.

Working commercial anchor:

> **Premium Visual Quality: +$99/month**

The included Premium render pool is not yet fixed. It must be based on:

- sustainable Premium procurement cost;
- measured quality improvement;
- actual merchant demand;
- average premium renders/session.

---

## 11. Campaign Expansion Pricing

Campaign remains both a product object and an expansion-revenue object.

Working anchor:

> **Additional active campaign: +$99 to +$199/month**

The longer-term revenue equation remains:

> **Merchant × Campaigns × Usage × Conversion Value**

Campaign price is driven by additional merchant value, traffic, measurement and operational scope, not arbitrary configuration count.

---

## 12. Channel Economics

Long-term acquisition mix assumption:

> **~50% direct / ~50% channel**

Baseline policies:

- Referral Partner: **20% of net collected recurring subscription revenue for first 12 months**;
- Agency / Solution Partner: **up to 30% recurring margin/revenue share**;
- Strategic partner: negotiated wholesale/revenue share/minimum commitment;
- Merchant-to-merchant referral: prefer account credit over perpetual cash share.

Channel margin must be recalculated using actual render utilization. Heavy-usage or highly serviced merchants may require different channel economics.

---

## 13. Discount Policy

Default annual offer:

> **Pay for 10 months, receive 12 months.**

Default rule:

> **One primary commercial discount only unless explicitly approved.**

Partner payout is calculated on net collected revenue after approved customer discount.

Annual contracts must be reviewed against Base and Stress procurement cases.

---

## 14. Onboarding / Human Delivery Cost

Until real tracking exists, use:

> **$50/hour loaded delivery cost**

Pilot planning estimate:

- merchant setup: ~1 h;
- 8–50 frame catalog prep/review: ~1.5–2 h;
- campaign setup: ~0.5 h;
- QA: ~0.5 h;
- kickoff/training: ~0.5 h.

Expected initial Pilot labor: **~4–5 h / $200–250 internal cost**.

Pilot remains a validation/acquisition investment. Mature onboarding target: **≤2 h/customer**.

---

## 15. Required Pilot Evidence

Every pilot must capture:

### Merchant demand / traffic

- monthly site traffic;
- campaign traffic routed to VisuTry;
- AI Commerce Sessions;
- AI experience entry rate.

### AI usage

- recommendations/session;
- renders/session;
- standard/premium split;
- render pool utilization;
- provider/model distribution;
- actual AI COGS.

### Commerce value

- recommendation completion;
- Try-On completion;
- Compare usage;
- product clicks;
- favorites;
- inquiries;
- verified orders/revenue where available;
- merchant-reported conversion impact.

### Commercial delivery

- contracted price;
- discount;
- partner source;
- onboarding hours;
- support hours;
- willingness-to-pay feedback.

The four highest-priority unknowns are:

1. AI experience entry rate;
2. average renders / Commerce Session;
3. measurable intent / conversion uplift;
4. willingness to pay by merchant segment.

---

## 16. Recalibration Gates

### After first merchant

Validate meter correctness and actual renders/session.

### After 3 merchants

Review 500-session Pilot capacity, render-pool utilization, $149 willingness to pay and merchant ROI narrative.

### After 5 merchants

Decide whether Launch/Growth pricing and 750/1,500 session capacities are ready for public productization.

### After 10 paying merchants

Recalculate:

- effective Stripe cost;
- actual sustainable provider cost;
- render utilization;
- support cost;
- gross margin by plan;
- channel contribution;
- overage bundles;
- annual-plan economics;
- actual merchant ROI evidence.

No allowance should become a long-term immutable promise before these reviews.

---

## 17. Operating Principles

1. **Price on merchant value, not current provider cost.**
2. **Base entitlement on sustainable procurement, not procurement alpha.**
3. **Do not confuse four-render stress cost with average shopper behavior.**
4. **Merchant-facing shopper capacity and internal render-cost control must be separately measurable.**
5. **A commercially unusable plan is not made correct by showing a high theoretical gross margin.**
6. **A higher-priced plan must prove conversion/commerce intelligence value, not only VTO volume.**
7. **Pilot evidence overrides planning assumptions.**

---

## 18. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created initial merchant pricing, packaging and unit-economics baseline. |
| 2026-08-06 | v2: rebased allowances on sustainable procurement economics and introduced Best/Base/Stress provider cases. |
| 2026-08-06 | **v3: market-aware revision. Replaced finance-floor 250/600/1,200 session entitlements with 500 Pilot / 750 Launch / 1,500 Growth / 4,000 Scale; introduced independent Standard Render Pools (1,000 / 1,500 / 3,000 / 8,000), merchant ROI tests, render-based overage, and market-credibility requirements.** |
