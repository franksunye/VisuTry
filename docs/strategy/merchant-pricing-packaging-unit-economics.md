# VisuTry Merchant Pricing, Packaging & Unit Economics

**Status:** Active internal commercial baseline — AI-Native Market Economics v4  
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

This document is the internal source of truth for merchant pricing, packaging, unit economics and gross-margin philosophy.

Pricing is a cross-functional operating contract:

> **Sales promise = merchant value = packaging = entitlement = usage meter = delivery cost = gross profit = channel economics.**

The product thesis remains:

> **Storefront is the delivery surface. AI Commerce / Campaign Engine is the business.**

The pricing thesis remains:

> **VisuTry does not charge merchants for an AI try-on feature. It charges for an AI commerce system that turns traffic into measurable shopping intent and conversion.**

The v4 operating principle is:

> **Merchant Value First. Sustainable Economics Always. Margin Expansion Over Time.**

This explicitly replaces a traditional SaaS interpretation in which every plan must show ~75% gross margin from Day 1.

---

## 2. Why AI-Native Martech Needs a Different Margin Model

Traditional SaaS often targets ~75–85%+ gross margin because marginal software-delivery cost is low.

AI-native products introduce a material variable COGS layer:

- model inference;
- image generation;
- provider routing/fallback;
- storage/observability at scale;
- usage that increases directly with customer activity.

Therefore 75% remains a useful **mature software-quality benchmark**, but should not be treated as an absolute early-stage constraint.

VisuTry is also creating a new category and must optimize for market adoption, merchant proof and learning velocity. A plan with 80% theoretical GM but insufficient merchant value is commercially worse than a 55–65% GM plan that produces strong adoption, retention and merchant ROI.

The correct objective is:

> **Maximize merchant value and market adoption subject to sustainable unit economics.**

---

## 3. Gross-Margin Philosophy v4

### 3.1 Stage targets

| Stage | Gross-margin guidance | Operating objective |
| --- | ---: | --- |
| Pilot / Market Capture | **50–65% acceptable** | merchant adoption, proof, case studies, learning |
| Early Scale | **60–70%+ target** | growth with improving cost control |
| Mature Platform | **70–80% target** | scalable software economics |
| Long-term preferred benchmark | **~75%+ blended** | high-quality mature economics |

### 3.2 Floors

- Recurring direct GM should not remain **below ~50%** without explicit strategic approval.
- Stress/fallback operation must remain **gross-profit positive**.
- Channel deals must preserve positive contribution after partner share and direct delivery cost.
- Low-margin acquisition exceptions must be time-limited and tied to a clear strategic objective.

### 3.3 What matters more than a single GM percentage

VisuTry should track:

- gross profit dollars / merchant;
- merchant ROI;
- attributed or verified commerce value / VisuTry fee;
- commerce value / AI COGS;
- actual renders / Commerce Session;
- retention and expansion;
- CAC payback;
- gross-margin trajectory by cohort and plan.

A 60% GM customer that clearly generates merchant value and expands may be superior to an 80% GM customer that does not retain.

---

## 4. Margin Trajectory Is a First-Class Metric

AI inference cost should not be modeled as permanently static.

The strategic planning assumption is:

> **Over a 3–5 year horizon, cost per unit of equivalent AI capability is expected to decline structurally, although product quality and usage intensity may increase at the same time.**

This is a planning assumption, not a contractual guarantee.

Margin expansion can come from:

- lower model/provider prices;
- negotiated volume procurement;
- provider routing;
- cheaper models for low-value steps;
- batch/caching where applicable;
- lower renders/session through better recommendation quality;
- product price increases;
- higher-margin Campaign / Commerce Intelligence revenue;
- integration/API/enterprise revenue;
- better support efficiency.

VisuTry should retain part of future cost improvement as margin expansion rather than automatically passing all savings into higher free usage.

---

## 5. Cost Philosophy — Three Procurement Cases

| Cost case | Meaning | Use |
| --- | --- | --- |
| **Best / Procurement Alpha** | unusually favorable provider pricing such as current grsai | upside, CAC/channel buffer, extra margin |
| **Base / Sustainable Procurement** | repeatable long-term commercial procurement level | primary pricing and entitlement planning |
| **Stress / Official API** | direct official list price / emergency fallback | continuity and downside test |

### 5.1 Current Best Case

Current observed grsai costs:

| Capability | Model | Unit cost |
| --- | --- | ---: |
| Recommendation | `gemini-3.1-flash-lite` | RMB 0.0007425 |
| Standard Try-On | `nano-banana-2-lite` | RMB 0.02725 |
| Premium Try-On | `nano-banana-2` | RMB 0.07425 |
| Failed/retried request | current provider behavior | no model cost |
| Compare | reuses existing renders | no extra model cost |

Planning FX: RMB 7.0 = USD 1.00.

### 5.2 Base Case

Until stable multi-provider quotes exist, planning assumptions remain:

- Standard successful render: **$0.025**;
- Recommendation reserve: **$0.0002 / Commerce Session**.

These are internal planning assumptions, not public market claims.

### 5.3 Stress Case

Use approximately **$0.0336 / Standard render** for official-API stress planning until the provider-risk document is refreshed.

---

## 6. Commercial Usage Model — Dual Meter

Merchant-facing capacity and AI cost control are separate.

### Merchant-facing unit

> **AI Commerce Session** = one merchant-scoped shopper decision journey that reaches the AI recommendation / decision boundary.

### Cost unit

Meter separately:

```text
Commerce Sessions
Standard Renders
Premium Renders
```

A shopper may generate zero to several renders. Two Standard renders per Commerce Session remains the current packaging planning average; actual pilot data must replace it.

The shopper UX must not be forced into an artificial fixed two-frame limit.

---

## 7. Pricing Architecture v4

| Plan | Founding Pilot | Launch | Growth | Scale | Enterprise |
| --- | ---: | ---: | ---: | ---: | ---: |
| Price | **$149 / 30d** | **$199/mo** | **$499/mo** | **$999/mo** | **$2,500+ / custom** |
| AI Commerce Sessions | **500** | **750** | **1,500** | **4,000** | Custom |
| Standard Render Pool | **1,000** | **1,500** | **3,000** | **8,000** | Custom |
| Active campaigns | 1 | 1 | 3 | 10 | Custom |
| Catalog guideline | 8–50 | 100 | 500 | 2,000 | Custom |
| Recommendation | Yes | Yes | Yes | Yes | Yes |
| Try-On / Compare | Yes | Yes | Yes | Yes | Yes |
| Source attribution | Pilot | Basic | Advanced | Advanced | Custom |
| Commerce intelligence | Pilot report | Basic | Advanced | Advanced | Custom |
| Conversion/revenue linkage | Assisted | When connected | When connected | Where connected | Custom |
| Premium rendering | Evaluation | Add-on | Allowance/add-on | Larger allowance | Custom |
| Support | Assisted | Standard | Priority | Priority | SLA / dedicated |

These values remain market hypotheses until pilot evidence confirms them.

---

## 8. Merchant Value and Competitive Positioning

VisuTry must not compete on raw VTO volume alone.

If a merchant perceives the offer as:

> `$499 for 1,500 try-ons`

then the product will be compared unfavorably with lower-cost VTO vendors.

The merchant must instead understand the value chain:

> **campaign traffic → AI recommendation → shortlist → try-on → compare → product intent → attribution → commerce intelligence.**

The commercial question is not only “how many renders?” but:

> **How much merchant decision value is created per shopper served?**

### Growth-plan hurdle example

Working planning assumptions:

- AOV: ~$150;
- Growth fee: $499;
- included Commerce Sessions: 1,500.

Roughly 4 incremental orders × $150 = $600, which covers the monthly fee.

Across 1,500 engaged shoppers this is ~0.27 percentage points of incremental conversion in the served cohort.

This is **not a promised uplift**. It is an internal plausibility test.

A strong long-term target is for a merchant to perceive and eventually verify **3×+ value / fee**, with higher targets where attribution quality allows.

---

## 9. Market Capture Policy

VisuTry is an innovative product entering an undeveloped category. Early economics may deliberately trade margin for:

- reference merchants;
- conversion case studies;
- real traffic data;
- campaign data;
- stronger frame intelligence;
- integration learning;
- partner distribution;
- faster category occupation.

Strategic low-margin offers are acceptable when:

1. expected GM remains roughly 50%+ or has explicit approval;
2. scope/time are defined;
3. merchant learning value is high;
4. the offer creates reusable product or GTM evidence;
5. there is a credible path to higher future margin.

Do not use low margin merely to hide weak merchant value.

---

## 10. Current Base-Case Economics

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

These are planning stress-within-base-case figures, not required minimums or promises.

The important test is whether real merchant cohorts produce enough value and retain while blended GM moves toward the long-term target.

---

## 11. Procurement Alpha Policy

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

## 12. Overage and Expansion

The merchant buys shopper capacity; rendering is the dominant variable AI cost.

Working post-pilot anchors remain:

- +500 Standard renders: **$49**;
- +1,000 Standard renders: **$99**;
- larger bundles: negotiated / plan upgrade.

No Pilot merchant should receive surprise automatic overage billing.

---

## 13. Premium, Campaign and Higher-Margin Expansion

### Premium Rendering

Working anchor: **+$99/month**, allowance TBD from sustainable Premium cost and merchant demand.

### Additional Campaign

Working anchor: **+$99–199 / active campaign / month**.

### Strategic importance

Campaign, analytics, attribution and Commerce Intelligence are important because they can increase revenue without increasing AI COGS proportionally.

Long-term revenue equation:

> **Merchant × Campaigns × Usage × Conversion Value**

This is also a primary route to blended margin expansion.

---

## 14. Channel Economics

Planning mix remains approximately **50% direct / 50% channel**.

- Referral Partner: **20% of net collected recurring subscription revenue for first 12 months**;
- Agency / Solution Partner: **up to 30% recurring margin/revenue share**;
- Strategic Partner: negotiated;
- Merchant referral: prefer account credit.

Channel economics must be reviewed using actual usage and support cost, not theoretical plan averages alone.

---

## 15. Discount Policy

Default annual offer remains:

> **Pay for 10 months, receive 12 months.**

Default rule:

> **One primary commercial discount only unless explicitly approved.**

Annual contracts must be reviewed under Base and Stress procurement cases.

---

## 16. Pilot Evidence Required

Every pilot must capture:

### Merchant value

- merchant traffic;
- traffic routed to VisuTry;
- AI experience entry rate;
- recommendation/Try-On/Compare funnel;
- product clicks/favorites/inquiries;
- verified orders/revenue where available;
- merchant-reported value;
- willingness to pay.

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

Priority unknowns:

1. Merchant perceived value;
2. AI experience entry rate;
3. average renders / Commerce Session;
4. intent/conversion uplift;
5. willingness to pay;
6. gross-margin trajectory.

---

## 17. Recalibration Gates

### After 1 merchant

Validate meters, renders/session, support effort and merchant understanding.

### After 3 merchants

Review Pilot capacity, merchant perceived value, ROI narrative and actual GM.

### After 5 merchants

Decide whether Launch/Growth packaging is market-ready; prioritize merchant adoption evidence over preserving a theoretical 75% GM.

### After 10 paying merchants

Recalculate:

- sustainable provider cost;
- actual GM and gross profit by plan;
- merchant ROI evidence;
- retention/expansion;
- support cost;
- partner contribution;
- overage design;
- annual economics.

### Quarterly after early scale

Track whether gross margin is moving toward **60–70%+**, then **70–80% mature-state economics**.

---

## 18. Operating Principles

1. **Merchant Value First. Sustainable Economics Always. Margin Expansion Over Time.**
2. **75% is a mature benchmark, not an early-stage sacred constraint.**
3. **A 50–65% GM market-capture offer can be rational if it creates adoption, retention and evidence.**
4. **Do not use procurement alpha to define permanent customer entitlement.**
5. **Do not sacrifice product usability for theoretical margin purity.**
6. **Do not sacrifice positive unit economics simply to buy revenue.**
7. **Price on merchant value; meter variable AI cost separately.**
8. **Margin trajectory matters more than one-period margin snapshot.**
9. **Campaign and Commerce Intelligence should increase value faster than AI COGS.**
10. **Pilot evidence overrides planning assumptions.**

---

## 19. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Initial merchant pricing and unit-economics baseline. |
| 2026-08-06 | v2: introduced sustainable procurement economics and provider-risk cases. |
| 2026-08-06 | v3: introduced market-aware dual-meter packaging and merchant ROI tests. |
| 2026-08-06 | **v4: replaced 75%-GM-first thinking with AI-native market economics; added stage-based GM targets, market-capture policy, margin-trajectory principle, 3–5 year AI-cost-decline assumption, Merchant Value First operating principle, and stronger ROI/retention/gross-profit review gates.** |
