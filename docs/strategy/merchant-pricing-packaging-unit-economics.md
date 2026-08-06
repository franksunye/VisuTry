# VisuTry Merchant Pricing, Packaging & Unit Economics

**Status:** Active internal commercial baseline — Market-Capture Competitive Offer v8  
**Owner:** Product / Strategy / Engineering / Sales  
**Created:** 2026-08-06  
**Last updated:** 2026-08-06  
**Review cadence:** Monthly during the first 3–6 months; immediately after material provider, competitor, or product-value changes  
**Related provider risk:** `docs/strategy/merchant-provider-risk-and-fallback-economics.md`  
**Related entitlement spec:** `docs/product/specs/merchant-commercial-entitlements.md`  
**Related implementation plan:** `docs/product/plans/merchant-pricing-entitlement-implementation-plan.md`  
**Related sales demo:** `docs/product/specs/visutry-store-sales-demo.md`

---

## 1. Current Commercial Decision

VisuTry's current market-capture offer is intentionally optimized for **easy comparison, obvious value, low purchase friction, and fast merchant acquisition**.

The governing principle is:

> **Competitive VTO first; differentiated AI commerce value on top.**

The business should not ask the first merchants to accept materially worse VTO capacity in exchange for a category explanation that requires education.

The current-stage offer must satisfy two conditions at the same time:

1. **Competitive floor:** the merchant should not feel disadvantaged on the familiar VTO price/usage comparison.
2. **Differentiated upside:** VisuTry additionally provides Recommendation, Compare, purchase-intent signals, assisted onboarding, and merchant insight.

The current operating principle remains:

> **Merchant Value First. Sustainable Economics Always. Margin Expansion Over Time.**

---

## 2. Market Reality and Competitive Floor

Current planning benchmarks reviewed during this pricing exercise include:

- Fittingbox: approximately **$99/month for 1,500 VTO users** and **$199/month for 3,500 VTO users**;
- Banuba: approximately **$49/month for 1,000 try-ons** and **$99/month for 3,500 try-ons**.

Exact competitor pricing may change and must be rechecked before external comparative claims.

The commercial implication is stable:

> **A $149 VisuTry offer with only 1,000 Try-On generations creates unnecessary sales friction.**

The merchant should not have to understand why fewer generations are supposedly worth more before trying the product.

---

## 3. Current External Sellable Offer — Founding Merchant Pilot v8

### Founding Merchant Pilot

> **$149 / 30 days**

### Merchant-facing package

- merchant's own eyewear catalog;
- 8–50 reviewed frames;
- personalized AI frame recommendation;
- AI Virtual Try-On;
- multi-frame Compare;
- Product Click / Favorite / Inquiry intent tracking;
- source / campaign context;
- merchant intent-performance view;
- assisted setup;
- weekly review.

### Market-capture capacity

- **up to 1,500 AI-assisted shoppers / AI Commerce Sessions**;
- **up to 3,500 Standard Try-On generations**;
- one hosted Store / campaign experience.

This capacity is intentionally competitive with familiar VTO offers while VisuTry adds broader decision-support value.

### Optional launch bonus

For the first few strategically valuable merchants, Sales/Product may approve:

> **up to 5,000 Standard Try-On generations**

as a time-boxed Founding Launch Bonus.

This is not a permanent entitlement and must be recorded as a commercial exception.

---

## 4. Sales Positioning

The first 30 seconds should not ask the merchant to learn a new category.

Preferred framing:

> **You get a competitive virtual try-on package — and VisuTry goes further with personalized recommendations, frame comparison and shopper-intent insights.**

Then:

> **For $149, we run a 30-day Pilot using your real frames. We help set it up, shoppers can get recommendations, Try-On and Compare, and you can see which products and journeys create stronger purchase intent.**

Capacity wording:

> **The Pilot includes up to 1,500 AI-assisted shoppers and 3,500 standard Try-On generations.**

Do not lead with:

> `$149 / 1,500 sessions / 3,500 renders`

The capacity supports the sale; it is not the product story.

---

## 5. Why We Are Willing to Be Aggressive for 3–6 Months

Current grsai economics materially reduce Standard Try-On COGS.

Observed current Standard Try-On cost:

> **RMB 0.02725 / render ≈ $0.00389 / render** at the internal RMB 7/USD planning FX.

Approximate AI render COGS under current grsai economics:

| Standard renders | Approx. render COGS |
| ---: | ---: |
| 1,000 | ~$3.9 |
| 3,500 | ~$13.6 |
| 5,000 | ~$19.5 |

Recommendation cost remains immaterial relative to image generation at current observed pricing.

Therefore the dominant early-stage costs are more likely to be:

- sales time;
- catalog preparation;
- onboarding;
- merchant support;
- founder/product attention.

The current procurement advantage should therefore be used deliberately as **market-capture capital**.

> **During Market Capture, procurement alpha may be invested in customer acquisition, competitive capacity, case studies, traffic, and product learning.**

This explicitly complements the long-term rule that procurement alpha must not become an irreversible lifetime entitlement.

---

## 6. Procurement Alpha Policy by Stage

### Market Capture — current 3–6 months

Procurement alpha may fund:

- higher included VTO capacity;
- Founding launch bonuses;
- easier competitive comparison;
- reference-customer acquisition;
- partner/channel experiments;
- learning from real traffic.

### Early Scale

Procurement alpha should increasingly fund:

- gross-margin improvement;
- CAC payback;
- channel economics;
- provider resilience;
- product development.

### Mature Platform

Procurement alpha should primarily support:

- margin expansion;
- strategic pricing flexibility;
- enterprise/service quality;
- infrastructure resilience.

---

## 7. Gross-Margin Philosophy

| Stage | GM guidance | Operating purpose |
| --- | ---: | --- |
| Market Capture / Pilot | **50–65% acceptable** | acquire merchants, validate value, learn quickly |
| Early Scale | **60–70%+ target** | repeatable growth with improving economics |
| Mature Platform | **70–80% target** | scalable software economics and pricing power |
| Long-term preferred benchmark | **~75%+ blended** | strong mature business quality |

75% is not a Day-1 sacred constraint.

The current Pilot may intentionally accept lower theoretical margin if it materially improves sales conversion and merchant usage.

However:

- recurring direct GM below ~50% requires explicit strategic approval;
- service continuity must remain gross-profit positive where practical;
- customer acquisition should not become structurally loss-making;
- low-margin terms must be versioned and time-boxed.

---

## 8. Pricing Is Stage-Based and Versioned

The current Founding offer is a **Market Capture Pricing Version**, not a permanent price card.

Minimum durable concepts:

```text
commercialStage
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

1. The current $149 / 1,500 shoppers / 3,500 generations offer is intended for the initial market-capture period.
2. Review it during the first **3–6 months**, and earlier after meaningful merchant evidence.
3. New merchants may receive a new pricing version without changing historical contracts.
4. Founding pricing is not lifetime pricing.
5. A later version may raise price, change capacity, add setup fees, or restructure around campaigns/intelligence.
6. A sustained upstream cost change may also trigger a new pricing version.
7. Existing signed terms remain governed by the applicable contract and pricing version.

Pricing evolution is expected.

---

## 9. Value Maturity Boundary

The current product sells:

> **AI-powered shopping decision experience + measurable purchase intent.**

Evidence maturity remains:

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

The first Pilot does not require revenue attribution or incremental-GMV proof.

---

## 10. Current Sales Talk Track

### Primary pitch

> **You get a competitive virtual try-on package, but VisuTry also helps shoppers decide what to try. For $149, we run a 30-day Pilot with your real frames: personalized recommendations, Try-On, Compare, and measurable shopper-intent signals. We handle the initial setup.**

### If the merchant compares with Fittingbox/Banuba or another VTO vendor

> **That is exactly why we designed the Founding Pilot to be competitive on VTO capacity as well. You are not paying more just to get fewer try-ons. The difference is that VisuTry adds recommendation, comparison and intent insight on top of the virtual try-on experience.**

### If the merchant asks about ROI

> **We do not want to overclaim revenue uplift before deeper commerce integration exists. The first Pilot measures whether shoppers actually use recommendation, Try-On and Compare, and which products create stronger purchase intent.**

### Close

> **The simplest next step is a 30-day Pilot for $149. We set up 8–50 of your frames, include capacity for up to 1,500 AI-assisted shoppers and 3,500 Try-On generations, and review the results with you before you decide whether to continue.**

---

## 11. Future Pricing Hypotheses — Not Commitments

Earlier Launch / Growth / Scale numbers remain useful as scenario models, but are no longer the active external pricing architecture.

A future Early Scale pricing version should be created from actual evidence on:

- merchant close rate;
- willingness to pay;
- continuation/retention;
- real VTO and Commerce Session usage;
- actual renders/session;
- competitor pricing;
- provider economics;
- support effort;
- channel economics;
- product maturity;
- Campaign / Intent Intelligence value.

Possible future structures may include:

- higher recurring price with similar capacity;
- larger usage tiers;
- Platform + Usage;
- Platform + Campaign + Usage;
- Premium rendering add-on;
- setup/onboarding fee;
- enterprise/API pricing.

No future structure is locked today.

---

## 12. Margin Trajectory

Strategic planning assumption:

> **Over a 3–5 year horizon, cost per unit of equivalent AI capability is expected to decline structurally, while product quality and usage intensity may also rise.**

Margin expansion may come from:

- lower provider/model cost;
- alternative provider competition;
- volume procurement;
- routing/model mix;
- lower renders/session through better recommendation;
- higher merchant WTP as value becomes clearer;
- Campaign / Commerce Intelligence revenue;
- integrations/API/enterprise revenue;
- support efficiency.

Do not assume every future cost reduction should be passed through to customers.

---

## 13. Review Gates

### After first paid Pilot

Review whether the competitive VTO capacity removed the main pricing objection and whether $149 was easy to approve.

### After 3 paid merchants

Review:

- comparison against Fittingbox/Banuba/other alternatives;
- willingness to pay;
- actual render utilization;
- continuation intent;
- sales cycle;
- onboarding/support cost;
- actual GM.

### After 5 paid merchants

Decide whether to keep or change:

- $149 Pilot price;
- 1,500 shopper capacity;
- 3,500 render capacity;
- assisted onboarding;
- Founding launch bonus;
- post-Pilot recurring structure.

### 3–6 month market-capture gate

Create the next formal pricing version using actual evidence. Do not preserve the Founding economics by inertia.

---

## 14. Operating Principles

1. **Competitive VTO first; differentiated AI commerce value on top.**
2. **Do not make the merchant pay an education tax.**
3. **Use current procurement alpha deliberately to acquire market evidence during the first 3–6 months.**
4. **Do not turn temporary procurement advantage into a lifetime entitlement.**
5. **$149 / 1,500 shoppers / 3,500 renders is a Market Capture offer, not a mature price card.**
6. **Merchant Value First. Sustainable Economics Always. Margin Expansion Over Time.**
7. **75% GM is a mature benchmark, not a Day-1 hard constraint.**
8. **Observed intent, attributed conversion and incremental revenue remain different evidence levels.**
9. **Pricing is versioned and expected to evolve.**
10. **Real merchant evidence overrides planning assumptions.**

---

## 15. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Initial merchant pricing and unit-economics baseline. |
| 2026-08-06 | v2–v7 | Iterated sustainable procurement, dual-meter packaging, AI-native GM, Intent-First scope, stage-based pricing, and sales-first Pilot framing. |
| 2026-08-06 | **v8: finalized current Market Capture conclusion: $149 / 30 days, up to 1,500 AI-assisted shoppers and 3,500 Standard Try-On generations; optional 5,000-render Founding Launch Bonus; explicitly uses current procurement alpha for the first 3–6 months to remove VTO price/volume objections while keeping Recommendation + Compare + Intent as differentiated upside.** |
