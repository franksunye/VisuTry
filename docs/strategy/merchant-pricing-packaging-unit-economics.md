# VisuTry Merchant Pricing, Packaging & Unit Economics

**Status:** Active internal commercial baseline — Sustainable Procurement Economics v2  
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

> **Sales promise = packaging = feature entitlement = usage meter = delivery cost = gross margin = channel economics.**

The governing product thesis remains:

> **Storefront is the delivery surface. AI Commerce / Campaign Engine is the business.**

The governing pricing thesis remains:

> **VisuTry does not charge merchants for an AI try-on feature. It charges for an AI commerce system that turns traffic into measurable shopping intent and conversion.**

The major v2 correction is:

> **Commercial pricing must be viable under a sustainable, repeatable industry procurement cost — not under an unusually low provider price.**

`grsai.com` remains economically valuable, but its low price is treated as **procurement alpha / upside**, not the base case that determines customer allowances.

---

## 2. Cost Philosophy — Three Procurement Cases

VisuTry must maintain three separate AI cost views.

| Cost case | Meaning | Use |
| --- | --- | --- |
| **Best / Procurement Alpha** | unusually favorable provider price such as current grsai pricing | upside, extra margin, CAC/channel buffer |
| **Base / Sustainable Procurement** | a repeatable long-term commercial procurement level | **primary pricing and entitlement baseline** |
| **Stress / Official API** | direct official API list pricing / emergency fallback | continuity and downside stress test |

Do not price a long-term contract using the Best Case.

Do not automatically assume official list pricing is the mature long-term Base Case either. The Base Case represents a reasonable sustainable procurement level between those two extremes.

### 2.1 Current grsai observed costs — Best Case

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

### 2.2 Sustainable procurement planning assumption — Base Case

Until VisuTry has negotiated quotes from multiple stable providers, use this planning assumption:

> **Standard image render = $0.025 / successful render**

This is an internal planning benchmark, not a claim about a specific supplier.

For recommendation, use a conservative planning reserve of:

> **$0.0002 / Commerce Session**

The exact recommendation cost is not currently material relative to image generation.

### 2.3 Official API stress assumption

For downside planning, use:

> **Standard image render = ~$0.0336 / successful render**

The provider-risk document owns detailed official fallback assumptions and should be refreshed when official pricing changes.

---

## 3. AI Commerce Session as the Commercial Usage Unit

Merchant pricing should not expose tokens, provider names, or image-generation units as the primary buying object.

The commercial unit is:

> **AI Commerce Session — one shopper decision journey within one merchant / campaign context.**

The conservative planning model is:

```text
1 recommendation
+ up to 4 standard try-on renders
+ Compare using existing renders
```

### 3.1 Session cost by procurement case

Approximate standard Commerce Session AI cost:

| Cost case | Cost / Commerce Session |
| --- | ---: |
| Best / grsai | **~$0.016** |
| Base / sustainable procurement | **~$0.100** |
| Stress / official API | **~$0.135** |

The v2 Pricing Architecture is based on the **~$0.10 Base Case**, not the ~$0.016 Best Case.

Important rules:

1. Four renders/session is a conservative planning ceiling, not a claim that every shopper will generate four images.
2. Actual average renders/session must be measured during pilots.
3. Compare has no extra model charge when it reuses completed renders.
4. The Commerce Session allowance is both a value fence and a cost-control mechanism.
5. Backend must meter recommendation, render and provider costs separately even though merchants buy sessions.

---

## 4. Pricing Architecture v2

List prices remain value-based and are not reduced merely because grsai is inexpensive.

### 4.1 Founding Merchant Pilot

**Price:** USD 149 / 30 days  
**Included AI Commerce Sessions:** **250**

Included baseline:

- 1 merchant;
- 1 active hosted campaign / Store experience;
- 8–50 representative frames;
- up to 250 AI Commerce Sessions;
- AI recommendation;
- Standard Try-On;
- Frame Compare;
- product click / favorite / inquiry intent tracking;
- source / campaign attribution;
- assisted onboarding;
- weekly performance summary.

Pilot pricing is a validation offer, not a permanent public price anchor.

### 4.2 Formal merchant plans

| Plan | Launch | Growth | Scale | Enterprise |
| --- | ---: | ---: | ---: | ---: |
| Monthly list price | **$199** | **$499** | **$999** | **$2,500+ / custom** |
| Included AI Commerce Sessions | **250** | **600** | **1,200** | Custom |
| Active campaigns | 1 | 3 | 10 | Custom |
| Catalog guideline | Up to 100 | Up to 500 | Up to 2,000 | Custom |
| Recommendation | Yes | Yes | Yes | Yes |
| Standard Try-On / Compare | Yes | Yes | Yes | Yes |
| Source attribution | Basic | Advanced | Advanced | Custom |
| AI-agent source attribution | Yes | Yes | Yes | Yes |
| Commerce intelligence | Basic | Advanced | Advanced | Custom |
| Verified conversion / revenue attribution | When integrated | Yes when integrated | Yes | Custom |
| Premium render allowance | Add-on | Allowance / add-on | Larger allowance | Custom |
| API / commerce integration | No | Limited / gated | Included where available | Custom |
| Support | Standard | Priority | Priority | SLA / dedicated |

These are internal target entitlements. Sales may only promise features marked production-ready or explicitly pilot-assisted in the entitlement spec.

---

## 5. Why the List Prices Stay the Same

The v2 correction changes **usage economics**, not the underlying merchant value thesis.

The price points remain appropriate working anchors because they are intended to price:

> traffic → recommendation → try-on → compare → intent → conversion intelligence

rather than per-image inference.

The v2 model intentionally separates:

- **Price** — determined primarily by merchant value, market alternatives, campaign scope and intelligence depth;
- **Allowance** — constrained by sustainable COGS and packaging strategy;
- **Provider advantage** — retained as margin rather than automatically given away as free usage.

---

## 6. Gross Margin Baseline v2

### 6.1 Internal targets

| Metric | Internal target |
| --- | ---: |
| Mature blended gross margin | **≥75%** |
| Mature direct SMB SaaS gross margin | **~75–85%** |
| Enterprise / high-service gross margin | **≥65–70%** |
| Contribution margin after channel share | **≥60% of retained revenue** |
| Absolute exception floor | **50% contribution margin** |

### 6.2 Base Case assumptions

Use:

- AI Commerce Session cost: **~$0.10**;
- payment / billing reserve: **5% of collected revenue**;
- infrastructure / observability reserve: **2% of revenue**;
- recurring support reserve:
  - Launch: $10/month;
  - Growth: $20/month;
  - Scale: $40/month.

### 6.3 Modeled Base Case economics

| Plan | Revenue | Sessions | AI cost | Payment 5% | Infra 2% | Support | Direct cost | Modeled GM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Launch | $199 | 250 | ~$25 | ~$10 | ~$4 | $10 | **~$49** | **~75%** |
| Growth | $499 | 600 | ~$60 | ~$25 | ~$10 | $20 | **~$115** | **~77%** |
| Scale | $999 | 1,200 | ~$120 | ~$50 | ~$20 | $40 | **~$230** | **~77%** |

These figures are planning estimates, not audited accounting results.

### 6.4 Stress Case — official API

At approximately $0.135 / Commerce Session, the v2 allowances still keep the business viable:

| Plan | Sessions | Approx. official AI cost | Approx. stressed GM after normal reserves |
| --- | ---: | ---: | ---: |
| Launch | 250 | ~$34 | **~71%** |
| Growth | 600 | ~$81 | **~73%** |
| Scale | 1,200 | ~$162 | **~73%** |

This is the key improvement over v1: temporary or even sustained official-price usage does not create structural negative gross margin at the included allowance.

---

## 7. Procurement Alpha Policy

If grsai or another provider continues to offer costs materially below the Base Case, the difference is treated as **procurement alpha**.

Procurement alpha should primarily fund:

- gross-margin buffer;
- CAC recovery;
- channel commissions;
- sales promotions;
- product R&D;
- provider-switching risk;
- temporary fallback cost.

It should **not** automatically be converted into a permanently higher customer allowance.

Example Growth plan at 600 sessions:

- Base Case AI cost: ~$60/month;
- current grsai-style AI cost: roughly ~$10/month;
- procurement alpha: roughly **$50/month** before other costs.

That $50 is strategic margin, not a customer entitlement obligation.

---

## 8. Overage and Usage Expansion

The first pilots should still avoid surprise automatic overage billing.

Working public anchors after pilot validation:

- **Additional 100 AI Commerce Sessions: $49**
- **Additional 1,000 AI Commerce Sessions: $399**

At the Base Case these maintain approximately 75–80% incremental gross margin before unusually high support cost.

Overage policy must remain server-owned and may use:

- soft warning;
- sales/upgrade review;
- prepaid usage bundle;
- automatic overage only after explicit merchant agreement.

Do not offer unlimited sessions by default.

---

## 9. Standard vs Premium Rendering

Merchant-facing quality modes remain:

```text
STANDARD
PREMIUM
```

Provider/model names are implementation details.

Premium pricing and allowance must be based on a sustainable Premium procurement benchmark, not the current grsai premium price.

Working commercial anchor remains:

> **Premium Visual Quality: +$99/month**

but the included Premium allowance is **not yet fixed** and must be determined from:

- normal sustainable premium cost;
- real pilot demand;
- quality uplift;
- average premium renders/session.

Do not promise a large fixed premium allowance until that recalculation is complete.

---

## 10. Campaign Expansion Pricing

Campaign remains both a product object and an expansion-revenue object.

Working anchor:

> **Additional active campaign: +$99 to +$199/month**

Campaign pricing is driven primarily by merchant value and operational scope, not inference cost alone.

The longer-term revenue equation remains:

> **Merchant × Campaigns × Usage × Conversion Value**

---

## 11. Channel and Referral Economics

Long-term planning assumption remains:

> **~50% direct / ~50% channel**

### Referral Partner

> **20% of net collected recurring subscription revenue for the first 12 months.**

### Agency / Solution Partner

> **Up to 30% recurring partner margin / revenue share.**

### Strategic / Platform Partner

Negotiated wholesale, revenue share, minimum commitment or usage economics.

### Merchant referral

Prefer account credit over perpetual cash revenue share.

---

## 12. Channel Contribution Margin Check — v2 Growth Reference

Use Growth $499 / 600 sessions under Base Case.

### Direct

```text
Collected revenue                  $499
Modeled direct cost               -$115
---------------------------------------
Contribution                       $384
Contribution margin                 ~77%
```

### Referral partner — 20%

```text
Collected revenue                  $499
Referral share                    -$100
Retained revenue                   $399
Modeled direct cost               -$115
---------------------------------------
Contribution                       $284
Contribution / retained revenue     ~71%
```

### Agency partner — 30%

```text
Collected revenue                  $499
Agency share                      -$150
Retained revenue                   $349
Modeled direct cost               -$115
---------------------------------------
Contribution                       $234
Contribution / retained revenue     ~67%
```

The 20% referral / 30% agency baseline remains viable under sustainable procurement assumptions.

---

## 13. Discount Policy

Default annual offer remains:

> **Pay for 10 months, receive 12 months.**

Equivalent discount: ~16.7%.

Default rule:

> **One primary commercial discount only unless explicitly approved.**

Partner payout is calculated on net collected revenue after approved customer discount.

Long-term contracts must be reviewed against the Base Case and Stress Case before approval. Do not rely on current grsai pricing to justify annual commitments.

---

## 14. Onboarding and Human Delivery Cost

Founder / internal labor must not be treated as zero.

Until real tracking exists, use:

> **$50/hour loaded delivery cost**

Pilot planning assumption:

- merchant setup: ~1 h;
- 8–50 frame catalog prep/review: ~1.5–2 h;
- campaign setup: ~0.5 h;
- QA: ~0.5 h;
- kickoff/training: ~0.5 h.

Expected initial Pilot labor: **~4–5 h / $200–250 internal cost**.

Pilot therefore remains a validation/acquisition investment. Mature onboarding should be reduced to **≤2 h/customer**.

---

## 15. Target Merchant Economics — Working Planning Assumptions

Until first-party pilot data exists, use these only for internal planning, not external ROI claims:

- Merchant AOV: ~$150;
- baseline ecommerce conversion: ~2%;
- Growth ICP traffic: ~10K–50K visits/month;
- Launch ICP traffic: ~2K–10K visits/month;
- Scale ICP: 50K+ visits/month and/or multiple campaigns/markets.

Pricing must eventually be validated against merchant willingness to pay and observed commerce value, not only these planning assumptions.

---

## 16. Required Cost Instrumentation

Every merchant pilot must make the following recoverable:

- provider;
- model;
- standard/premium mode;
- recommendation count;
- successful renders;
- failed/retried renders;
- average renders/Commerce Session;
- provider unit cost / recoverable cost mapping;
- Commerce Sessions;
- payment cost;
- support time;
- onboarding time;
- partner source;
- collected revenue.

This is required to replace planning assumptions with actual cohort economics.

---

## 17. Recalibration Gates

### After first merchant

Validate metering and actual renders/session.

### After 3 merchants

Review:

- 250-session Pilot allowance;
- sustainable AI cost/session;
- merchant traffic distribution;
- support/onboarding effort;
- willingness to pay.

### After 5 merchants

Decide whether Launch/Growth entitlements are ready for public use.

### After 10 paying merchants

Recalculate:

- actual B2B payment cost;
- blended provider cost;
- Base Case procurement benchmark;
- official fallback delta;
- gross margin by plan;
- channel economics;
- overage design;
- annual contract safety.

---

## 18. Decision Rules

1. **Price on merchant value; validate margin on sustainable procurement cost.**
2. **Never use an unusually cheap provider as the sole basis for customer allowance.**
3. **Treat low provider cost as procurement alpha.**
4. **Keep official API economics as a standing stress test.**
5. **Do not sign long-term unlimited-usage contracts.**
6. **Direct mature GM target remains ≥75%.**
7. **Post-channel contribution target remains ≥60% of retained revenue.**
8. **Recalculate allowance before changing list price unless merchant willingness-to-pay evidence requires price movement.**

---

## 19. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created initial merchant Pricing / Packaging / Unit Economics baseline using current observed provider cost. |
| 2026-08-06 | **v2:** rebased pricing economics on sustainable procurement cost; changed Pilot/Launch/Growth/Scale allowances from 1K/1K/5K/10K to **250/250/600/1,200**; introduced Best/Base/Stress procurement cases, procurement alpha policy, infra reserve, official-fallback stress margin and working overage anchors. |
