# VisuTry Merchant Pricing, Packaging & Unit Economics

**Status:** Active internal commercial baseline — Intent-First AI Commerce Economics v5  
**Owner:** Product / Strategy / Engineering / Sales  
**Created:** 2026-08-06  
**Last updated:** 2026-08-06  
**Review cadence:** Monthly during pilot stage; quarterly after pricing stabilizes  
**Related strategy:** `docs/strategy/commercial-strategy.md`  
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

The pricing thesis is now stated more precisely for the current stage:

> **VisuTry sells an AI-powered eyewear shopping decision experience and measurable purchase-intent intelligence.**

The current operating principle remains:

> **Merchant Value First. Sustainable Economics Always. Margin Expansion Over Time.**

---

## 2. Early-Stage Commercial Scope — Intent First

VisuTry must not position the current Pilot or early merchant product as a revenue-attribution or conversion-optimization platform.

The current product can reliably observe and deliver:

- merchant catalog onboarding;
- AI recommendation;
- Try-On;
- Frame Compare;
- shopper interaction and decision flow;
- source / campaign context;
- Product Click;
- Favorite;
- Inquiry;
- top-frame and high-intent behavior insights.

The current product **cannot reliably prove** without deeper commerce integrations and experimentation:

- completed merchant orders;
- attributed order revenue;
- incremental conversion uplift;
- incremental GMV;
- causal ROI.

Therefore the value maturity model is:

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
(requires controlled experimentation)
```

This distinction is mandatory in product, Sales and strategy language.

---

## 3. Value Claim Hierarchy

### 3.1 Current sellable value

Current merchant value should be expressed as:

> **Turn eyewear traffic into personalized shopping decisions and measurable purchase intent.**

The merchant should be able to understand a funnel such as:

```text
Campaign / Source Traffic
        ↓
AI Commerce Sessions
        ↓
Recommendations
        ↓
Try-On
        ↓
Compare
        ↓
Product Click / Favorite / Inquiry
```

The product must make this funnel understandable without requiring merchant checkout integration.

### 3.2 Later integration-dependent value

Once Shopify / WooCommerce / merchant-site events or order data are connected, VisuTry may report:

- orders touched by VisuTry;
- attributed revenue;
- conversion rate among VisuTry-engaged shoppers;
- downstream checkout behavior.

These are **attributed** outcomes, not automatically incremental outcomes.

### 3.3 Future experiment-dependent value

Claims such as:

- conversion uplift;
- incremental orders;
- incremental GMV;
- causal ROI;

require experimental evidence such as A/B testing, holdout traffic, geo split, campaign split or another credible causal design.

Do not use these as first-Pilot sales promises or acceptance criteria.

---

## 4. Gross-Margin Philosophy

AI-native Martech has variable model COGS, so traditional SaaS margin standards should be treated as mature-state benchmarks rather than early-stage absolutes.

| Stage | Gross-margin guidance | Operating objective |
| --- | ---: | --- |
| Pilot / Market Capture | **50–65% acceptable** | merchant adoption, proof, learning, reference accounts |
| Early Scale | **60–70%+ target** | growth with improving cost control |
| Mature Platform | **70–80% target** | scalable software economics |
| Long-term preferred benchmark | **~75%+ blended** | strong mature economics |

Rules:

- recurring direct GM should not remain below ~50% without explicit approval;
- fallback operation must remain gross-profit positive;
- channel deals must preserve positive contribution;
- low-margin market-capture exceptions must be time-limited and purposeful.

The most important principle is:

> **A commercially weak 80% GM offer is worse than a strong 55–65% GM offer that merchants understand, adopt and continue using.**

---

## 5. Margin Trajectory

Strategic planning assumption:

> **Over a 3–5 year horizon, cost per unit of equivalent AI capability is expected to decline structurally, while product quality and AI usage may also rise.**

This is a planning assumption, not a contractual guarantee.

Margin expansion may come from:

- lower provider/model prices;
- volume procurement;
- provider routing;
- better model mix;
- lower renders/session through better recommendation quality;
- price increases;
- higher-margin Campaign / Commerce Intelligence revenue;
- API / integration / enterprise revenue;
- support efficiency.

Future cost reductions should not automatically become larger free allowances. Part of the benefit should become margin, CAC capacity, channel capacity and R&D funding.

---

## 6. Cost Philosophy — Three Procurement Cases

| Cost case | Meaning | Use |
| --- | --- | --- |
| **Best / Procurement Alpha** | unusually favorable provider pricing such as current grsai | upside, CAC/channel buffer, extra margin |
| **Base / Sustainable Procurement** | repeatable long-term commercial procurement level | primary pricing and entitlement planning |
| **Stress / Official API** | direct official list price / emergency fallback | continuity and downside test |

Current Best Case observed inputs:

| Capability | Model | Unit cost |
| --- | --- | ---: |
| Recommendation | `gemini-3.1-flash-lite` | RMB 0.0007425 |
| Standard Try-On | `nano-banana-2-lite` | RMB 0.02725 |
| Premium Try-On | `nano-banana-2` | RMB 0.07425 |
| Failed/retried request | current provider behavior | no model cost |
| Compare | reuses existing renders | no extra model cost |

Planning assumptions:

- Base Standard render: **$0.025 / successful render**;
- Recommendation reserve: **$0.0002 / Commerce Session**;
- Stress Standard render: approximately **$0.0336 / successful render**.

---

## 7. Commercial Usage Model — Dual Meter

Merchant-facing capacity and AI cost control are separate.

### Merchant-facing unit

> **AI Commerce Session** = one merchant-scoped shopper decision journey that reaches the AI recommendation / decision boundary.

### Cost units

Meter separately:

```text
Commerce Sessions
Standard Renders
Premium Renders
```

Current packaging planning average:

> **~2 Standard renders per Commerce Session**

This is a planning assumption only. Pilot data must replace it.

The shopper UX must not be forced into a fixed two-frame limit.

---

## 8. Pricing Architecture v5

| Plan | Founding Pilot | Launch | Growth | Scale | Enterprise |
| --- | ---: | ---: | ---: | ---: | ---: |
| Price | **$149 / 30d** | **$199/mo** | **$499/mo** | **$999/mo** | **$2,500+ / custom** |
| AI Commerce Sessions | **500** | **750** | **1,500** | **4,000** | Custom |
| Standard Render Pool | **1,000** | **1,500** | **3,000** | **8,000** | Custom |
| Active campaigns | 1 | 1 | 3 | 10 | Custom |
| Catalog guideline | 8–50 | 100 | 500 | 2,000 | Custom |
| Recommendation | Yes | Yes | Yes | Yes | Yes |
| Try-On / Compare | Yes | Yes | Yes | Yes | Yes |
| Source / campaign insight | Pilot | Basic | Advanced | Advanced | Custom |
| Purchase-intent intelligence | Pilot | Basic | Advanced | Advanced | Custom |
| Conversion/revenue linkage | Not required | Future / when connected | Future / when connected | When connected | Custom |
| Premium rendering | Evaluation | Add-on | Allowance/add-on | Larger allowance | Custom |
| Support | Assisted | Standard | Priority | Priority | SLA / dedicated |

These values remain hypotheses until Pilot evidence confirms them.

---

## 9. Merchant Value and Competitive Positioning

VisuTry must not compete on raw VTO volume alone.

If the merchant understands Growth as:

> `$499 for 1,500 try-ons`

then VisuTry will be compared directly with lower-cost VTO products.

The merchant should instead understand:

> **Traffic → personalized recommendation → shortlist → Try-On → Compare → measurable purchase intent.**

Current differentiated value is:

- decision guidance, not only visualization;
- merchant-specific catalog intelligence;
- multiple decision steps in one journey;
- observable Product Click / Favorite / Inquiry behavior;
- source/campaign-level shopper intent insight;
- ability to learn which frames and journeys create stronger intent.

The central commercial question is:

> **Does VisuTry create enough visible decision value per shopper served that the merchant wants to continue and expand usage?**

---

## 10. Merchant Economics — Use Value Hurdles, Not Revenue Claims

Early planning may use hypothetical economic hurdles internally, but they must not be presented as observed ROI.

Example:

- Growth price: $499;
- illustrative eyewear AOV: ~$150.

Approximately 4 additional orders would mathematically cover the fee.

This is only a **break-even hypothesis** showing that the commercial hurdle may be plausible. It is **not** evidence that VisuTry creates four incremental orders.

Therefore early Pilot decisions should use:

- merchant-perceived value;
- Product Click / Favorite / Inquiry rate;
- repeat usage;
- continuation intent;
- willingness to pay;
- merchant willingness to route more traffic into VisuTry.

Do not require incremental GMV proof before validating the product.

---

## 11. Market Capture Policy

VisuTry is entering an undeveloped category. Early economics may deliberately trade margin for:

- reference merchants;
- real shopper traffic;
- campaign data;
- stronger frame intelligence;
- case-study evidence around intent and engagement;
- integration learning;
- partner distribution;
- faster category occupation.

Strategic lower-margin offers are acceptable when:

1. expected GM remains roughly 50%+ or has explicit approval;
2. scope and duration are defined;
3. learning / distribution value is high;
4. evidence is reusable;
5. there is a credible path to higher margin.

Do not use low price or low margin to compensate for weak merchant value.

---

## 12. Current Base-Case Economics

Assumptions:

- Standard render: $0.025;
- payment reserve: 5% revenue;
- infra/observability reserve: 2% revenue;
- support reserve: Launch $10 / Growth $20 / Scale $40.

At full included Standard Render Pool consumption:

| Plan | Revenue | AI Cost | Other direct reserves | Approx. direct cost | Approx. GM |
| --- | ---: | ---: | ---: | ---: | ---: |
| Launch | $199 | ~$37.5 | ~$24 | ~$61.5 | **~69%** |
| Growth | $499 | ~$75 | ~$55 | ~$130 | **~74%** |
| Scale | $999 | ~$200 | ~$110 | ~$310 | **~69%** |

These are planning figures, not acceptance thresholds.

---

## 13. Procurement Alpha Policy

Low-cost provider advantage is strategic margin, not customer entitlement.

Use procurement alpha to fund:

- CAC recovery;
- partner share;
- market-capture promotions;
- provider fallback;
- R&D;
- margin buffer.

Do not convert temporary low provider pricing into irreversible customer allowances.

---

## 14. Overage and Expansion

Working post-pilot anchors:

- +500 Standard renders: **$49**;
- +1,000 Standard renders: **$99**;
- larger bundles: negotiated / plan upgrade.

No Pilot merchant should receive surprise automatic overage billing.

---

## 15. Higher-Margin Expansion

### Premium Rendering

Working anchor: **+$99/month**, allowance TBD.

### Additional Campaign

Working anchor: **+$99–199 / active campaign / month**.

### Future Commerce Intelligence

As the product matures, higher-margin value can come from:

- deeper intent segmentation;
- campaign comparison;
- catalog/frame performance insight;
- conversion linkage when integrated;
- eventually experiment-based incrementality measurement.

The early product must not pretend these later layers already exist.

---

## 16. Channel Economics

Planning mix remains approximately **50% direct / 50% channel**.

- Referral Partner: **20% of net collected recurring subscription revenue for first 12 months**;
- Agency / Solution Partner: **up to 30% recurring margin/revenue share**;
- Strategic Partner: negotiated;
- Merchant referral: prefer account credit.

Channel economics must be reviewed using actual usage and support cost.

---

## 17. Discount Policy

Default annual offer:

> **Pay for 10 months, receive 12 months.**

Default rule:

> **One primary commercial discount only unless explicitly approved.**

Annual contracts must be reviewed under Base and Stress procurement cases.

---

## 18. Pilot Evidence Required

### Current required value evidence

- merchant traffic;
- traffic routed to VisuTry;
- AI experience entry rate;
- recommendation completion;
- Try-On completion;
- Compare usage;
- Product Clicks;
- Favorites;
- Inquiries;
- top frames / intent concentration;
- merchant-perceived value;
- willingness to pay;
- continuation / expansion intent.

### AI economics

- Commerce Sessions;
- Standard/Premium renders;
- average renders/session;
- provider/model distribution;
- actual AI COGS;
- render-pool utilization.

### Commercial economics

- collected revenue;
- discount;
- partner source;
- onboarding/support hours;
- gross profit dollars;
- actual GM;
- CAC where measurable.

### Optional / later evidence

Collect orders or revenue only where merchant integration/data access already exists. Do not delay Pilot to build it.

Priority unknowns:

1. merchant-perceived value;
2. AI experience entry rate;
3. average renders / Commerce Session;
4. Product Click / Favorite / Inquiry behavior;
5. willingness to pay;
6. continuation / expansion intent;
7. margin trajectory.

---

## 19. Recalibration Gates

### After 1 merchant

Validate meters, renders/session, support effort and merchant understanding.

### After 3 merchants

Review Pilot capacity, perceived value, intent signals, willingness to pay and actual GM.

### After 5 merchants

Decide whether Launch/Growth packaging is market-ready. Priority order:

1. merchant understands differentiated value;
2. merchant wants to continue / route more traffic;
3. willingness to pay;
4. observable intent behavior;
5. sustainable positive economics;
6. current-period GM percentage.

### After 10 paying merchants

Recalculate:

- sustainable provider cost;
- actual GM / gross profit by plan;
- retention/expansion;
- support cost;
- partner contribution;
- overage design;
- annual economics;
- whether commerce integrations are now justified.

Do not make revenue attribution a prerequisite for early scale.

---

## 20. Operating Principles

1. **Merchant Value First. Sustainable Economics Always. Margin Expansion Over Time.**
2. **Current product sells decision experience + measurable purchase intent, not revenue attribution.**
3. **Observed intent, attributed conversion and incremental revenue are three different evidence levels.**
4. **Do not require commerce integration before proving merchant willingness to pay.**
5. **75% is a mature benchmark, not an early-stage sacred constraint.**
6. **Do not use procurement alpha to define permanent customer entitlement.**
7. **Do not sacrifice product usability for theoretical margin purity.**
8. **Do not sacrifice positive unit economics simply to buy revenue.**
9. **Price on merchant value; meter variable AI cost separately.**
10. **Pilot evidence overrides planning assumptions.**

---

## 21. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Initial merchant pricing and unit-economics baseline. |
| 2026-08-06 | v2: introduced sustainable procurement economics and provider-risk cases. |
| 2026-08-06 | v3: introduced market-aware dual-meter packaging. |
| 2026-08-06 | v4: introduced AI-native stage-based GM philosophy and margin-trajectory planning. |
| 2026-08-06 | **v5: corrected early-stage value framing from revenue/ROI attribution to Intent-First AI Commerce. Formalized three evidence levels: observed purchase intent now, attributed conversion later with integration, incremental revenue only with credible experimentation. Removed revenue attribution as a Pilot prerequisite.** |
