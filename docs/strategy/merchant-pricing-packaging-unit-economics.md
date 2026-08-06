# VisuTry Merchant Pricing, Packaging & Unit Economics

**Status:** Active internal commercial baseline  
**Owner:** Product / Strategy / Engineering / Sales  
**Created:** 2026-08-06  
**Review cadence:** Monthly during pilot stage; quarterly after pricing stabilizes  
**Related strategy:** `docs/strategy/commercial-strategy.md`  
**Related Store MVP:** `docs/product/specs/visutry-store-mvp.md`  
**Related commerce architecture:** `docs/product/specs/visutry-commerce-architecture.md`  
**Related pilot plan:** `docs/product/plans/visutry-store-demo-pilot-readiness-plan.md`  
**Related entitlement spec:** `docs/product/specs/merchant-commercial-entitlements.md`

---

## 1. Purpose

This document is the internal commercial baseline for VisuTry merchant pricing.

Pricing is not treated as a marketing page. It is a contract that aligns:

> Sales promise = packaging = feature entitlement = usage meter = delivery cost = gross margin = channel economics.

The goal is to define what VisuTry sells from the first merchant pilot onward, while preserving a credible path from hosted Storefront to Campaign Engine and, later, a broader vertical Martech / Commerce platform.

The governing product thesis remains:

> **Storefront is the delivery surface. AI Commerce / Campaign Engine is the business.**

The governing pricing thesis is:

> **VisuTry does not charge merchants for an AI try-on feature. It charges for an AI commerce system that turns traffic into measurable shopping intent and conversion.**

---

## 2. Current Cost Inputs

These are the current known unit-cost inputs supplied from the live VisuTry stack.

### 2.1 AI provider

Provider: `grsai.com`

| Capability | Model | Current unit cost |
| --- | --- | ---: |
| Recommendation | `gemini-3.1-flash-lite` | RMB 0.0007425 / recommendation |
| Standard Try-On | `nano-banana-2-lite` | RMB 0.02725 / generated try-on |
| Premium Try-On option | `nano-banana-2` | RMB 0.07425 / generated try-on |
| Failed / retried request | Current provider behavior | No model cost |
| Compare | Existing generated try-ons | No additional model cost |

For internal USD planning only, this document uses a **planning FX of RMB 7.0 = USD 1.00**. This is not an accounting rate and should be refreshed when pricing is reviewed.

Approximate planning USD costs:

| Capability | Planning USD cost |
| --- | ---: |
| Recommendation | ~$0.00011 |
| Standard Try-On | ~$0.00389 |
| Premium Try-On | ~$0.01061 |

### 2.2 Current infrastructure

Current marginal infrastructure cost is intentionally modeled as approximately zero for the pilot baseline because:

- Vercel Hobby currently supports the existing consumer product;
- Cloudflare remains an available future path for maintaining low edge/storage cost;
- Auth0 is currently within its free tier;
- Resend is currently within its 3,000/month free allowance;
- GA is used for analytics;
- current image storage / bandwidth / database cost is not yet material at merchant pilot volume.

This does **not** mean infrastructure is permanently free. Once merchant traffic becomes material, attributable storage, bandwidth, observability, database and queue costs must be added to this model.

### 2.3 Payment processing

The current USD 2.99 consumer transaction experiences approximately **14% effective Stripe cost**, primarily because fixed processing fees are large relative to a very small transaction.

That 14% rate must **not** be mechanically applied to USD 199–999 merchant subscriptions.

Until real B2B payment data exists, merchant economics should use a conservative planning assumption of:

> **5% of collected merchant subscription revenue for payment / billing cost.**

This is intentionally conservative and must be replaced by observed B2B effective processing cost after the first 10–20 merchant payments.

---

## 3. Commerce Session as the Commercial Usage Unit

VisuTry should not expose model calls, tokens or image-generation units as the primary merchant billing object.

The preferred commercial usage unit is:

> **AI Commerce Session** — one shopper decision journey within one merchant / campaign context.

For initial economics, one standard AI Commerce Session is modeled as:

```text
1 recommendation
+ up to 4 standard try-on renders
+ compare using those existing renders
```

Standard model cost per modeled Commerce Session:

```text
1 × RMB 0.0007425 recommendation
+ 4 × RMB 0.02725 try-on
= RMB 0.1097425
≈ USD 0.01568 at planning FX
```

Premium model equivalent:

```text
1 × RMB 0.0007425 recommendation
+ 4 × RMB 0.07425 try-on
= RMB 0.2977425
≈ USD 0.04253 at planning FX
```

Important rules:

1. The commercial unit is a shopper journey, not an image.
2. Backend metering may still count recommendation calls, renders, failures and storage separately.
3. Compare has no extra model charge when it reuses completed try-ons.
4. The session allowance is a value and packaging fence, not merely a cost cap.
5. Actual average renders/session must be measured during pilots; the four-render model is a conservative planning baseline.

---

## 4. Pricing Architecture v1

### 4.1 Founding Merchant Pilot

**Price:** USD 149 / 30 days

Purpose:

- prove willingness to pay;
- operate real merchant traffic;
- learn onboarding and support cost;
- validate which conversion KPI merchants care about;
- produce the first case-study evidence.

Included baseline:

- 1 merchant;
- 1 active hosted campaign / Store experience;
- 8–50 representative frames;
- up to 1,000 AI Commerce Sessions;
- AI recommendation;
- standard Try-On;
- Frame Compare;
- product click / favorite / inquiry intent tracking;
- source / campaign attribution;
- assisted onboarding;
- weekly performance summary.

Pilot pricing is a validation product, not the long-term public price anchor.

The pilot may be deposit-backed or prepaid. Free pilots require an explicit Product / Sales exception.

### 4.2 Formal merchant plans

| Plan | Launch | Growth | Scale | Enterprise |
| --- | ---: | ---: | ---: | ---: |
| Monthly list price | **$199** | **$499** | **$999** | **$2,500+ / custom** |
| Included AI Commerce Sessions | **1,000** | **5,000** | **10,000** | Custom |
| Active campaigns | 1 | 3 | 10 | Custom |
| Catalog guideline | Up to 100 | Up to 500 | Up to 2,000 | Custom |
| Recommendation | Yes | Yes | Yes | Yes |
| Standard Try-On / Compare | Yes | Yes | Yes | Yes |
| Source attribution | Basic | Advanced | Advanced | Custom |
| AI-agent source attribution | Yes | Yes | Yes | Yes |
| Commerce intelligence | Basic | Advanced | Advanced | Custom |
| Verified conversion / revenue attribution | When integrated | Yes when integrated | Yes | Custom |
| Premium render allowance | Add-on | Included / add-on | Larger allowance | Custom |
| API / commerce integration | No | Limited / gated | Included where available | Custom |
| Support | Standard | Priority | Priority | SLA / dedicated |

This table defines the **commercial direction**, not a promise that every future Scale / Enterprise feature already exists.

Sales must only sell features marked production-ready in the entitlement spec.

---

## 5. Why These Price Points

The selected prices serve three purposes simultaneously.

### 5.1 They avoid the pure-VTO price trap

If VisuTry is sold as an image-generation or virtual try-on widget, merchants will compare it primarily on per-render cost and low-end app pricing.

The target purchase reason is instead:

> traffic → recommendation → try-on → compare → intent → conversion insight.

Pricing must therefore align with merchant growth / ecommerce value, not model inference cost.

### 5.2 They create room for channel distribution

A channel-led company cannot price its direct plan at the lowest acceptable merchant price and then later attempt to add 20–30% partner margin.

List price must contain room for:

- referral economics;
- agency / reseller margin;
- annual prepay discount;
- customer acquisition and onboarding;
- healthy contribution margin.

### 5.3 They preserve expansion revenue

The long-term revenue equation is:

> **Merchant × Campaigns × Usage × Conversion Value**

Therefore plans deliberately use campaign count, traffic/session allowance, analytics depth, integration and support as value fences.

Unlimited usage should not be the default SMB offer even when marginal AI cost is low.

---

## 6. Gross Margin Baseline

### 6.1 Internal targets

| Metric | Internal target |
| --- | ---: |
| Mature blended gross margin | **≥75%** |
| Mature direct SMB SaaS gross margin | **~75–85%** |
| Enterprise / high-service gross margin | **≥65–70%** |
| Contribution margin after channel share | **≥60% of retained revenue** |
| Absolute exception floor for recurring contracts | **50% contribution margin** |

Pilot margin may be below mature targets because onboarding is intentionally assisted.

### 6.2 Standard usage model

Assumptions:

- standard `nano-banana-2-lite` rendering;
- modeled Commerce Session = 1 recommendation + 4 renders;
- payment/billing planning cost = 5% of collected revenue;
- marginal infra = 0 for current pilot baseline;
- monthly recurring support planning allowance:
  - Launch: $10;
  - Growth: $20;
  - Scale: $40.

| Plan | Revenue | Included sessions | AI cost | Payment cost | Support | Modeled direct cost | Modeled GM |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Launch | $199 | 1,000 | ~$15.7 | ~$10.0 | $10 | **~$35.7** | **~82.1%** |
| Growth | $499 | 5,000 | ~$78.4 | ~$25.0 | $20 | **~$123.4** | **~75.3%** |
| Scale | $999 | 10,000 | ~$156.8 | ~$50.0 | $40 | **~$246.8** | **~75.3%** |

These are planning economics, not audited accounting figures.

The most important operating conclusion is:

> **Model cost is currently low enough that VisuTry should price on merchant value and maintain usage allowances as packaging and margin safety controls.**

---

## 7. Standard vs Premium Rendering

`nano-banana-2-lite` should be the default merchant production model unless quality evidence requires otherwise.

`nano-banana-2` is approximately 2.7x the standard render cost and should be treated as a premium capability, not silently enabled for all merchant traffic.

Possible premium packaging:

- Premium Visual Quality add-on;
- included premium render allowance in Growth / Scale;
- campaign-level premium mode;
- enterprise-specific render policy.

A working commercial add-on anchor is:

> **Premium Rendering: +$99/month**, with an included allowance determined by pilot usage.

At current model economics, premium rendering can remain high-margin while providing a clear quality upsell.

Do not expose provider/model names in merchant-facing pricing copy. Sell outcome-oriented quality levels.

---

## 8. Campaign Expansion Pricing

Campaign is both a product object and an expansion-revenue object.

Working add-on anchor:

> **Additional active campaign: +$99 to +$199/month**

The final amount may vary by:

- included traffic;
- catalog subset size;
- campaign-specific experience;
- reporting depth;
- premium rendering;
- merchant service level.

Example Growth expansion:

```text
Growth base                 $499
2 additional campaigns      $198
usage / premium add-on       $120
--------------------------------
Example monthly revenue      $817
```

The purpose is not to charge for arbitrary configuration. The additional fee must correspond to additional merchant value, traffic, measurement and operational scope.

---

## 9. Channel and Referral Economics

The operating assumption is:

> **Long-term merchant acquisition mix: approximately 50% direct / 50% channel.**

Channel is therefore part of the pricing architecture from Day 1.

### 9.1 Referral Partner

Definition:

- introduces qualified merchant;
- VisuTry owns demo, close, onboarding, billing and support.

Baseline:

> **20% of net collected recurring subscription revenue for the first 12 months.**

Rules:

- commission is paid on cash collected, not list price;
- refunds / credits reduce commission basis;
- implementation fees may be excluded unless explicitly agreed;
- no perpetual referral commission by default.

### 9.2 Agency / Solution Partner

Definition:

Partner materially participates in:

- merchant acquisition;
- onboarding;
- catalog preparation;
- campaign setup;
- first-line merchant relationship or service.

Baseline:

> **Up to 30% recurring partner margin / revenue share.**

The partner may add its own implementation or managed-service fee if the merchant contract permits it.

### 9.3 Strategic / Platform Partner

Examples:

- commerce platform;
- optical software provider;
- major agency network;
- catalog/data provider;
- embedded distribution partner.

No standard public percentage.

Use negotiated:

- wholesale price;
- platform revenue share;
- usage economics;
- minimum commitment;
- annual contract.

All strategic deals remain subject to the margin floor.

### 9.4 Merchant referral

Merchant-to-merchant referral should normally use account credit rather than ongoing cash revenue share.

Working anchor:

> Refer a qualified merchant → both accounts may receive up to $100 VisuTry credit after the referred merchant pays.

This is a growth loop, not a reseller channel.

---

## 10. Channel Contribution Margin Check

Using Growth as the reference plan:

### Direct

```text
List revenue                       $499
Modeled direct cost              -$123
--------------------------------------
Contribution                      ~$376
Contribution margin                ~75%
```

### Referral partner at 20%

```text
Collected revenue                  $499
Referral share                   -$100
Retained revenue                  ~$399
Modeled direct cost              -$123
--------------------------------------
Contribution                      ~$276
Contribution / retained revenue    ~69%
```

### Agency partner at 30%

```text
Collected revenue                  $499
Agency share                     -$150
Retained revenue                  ~$349
Modeled direct cost              -$123
--------------------------------------
Contribution                      ~$226
Contribution / retained revenue    ~65%
```

This validates the current 20% referral / 30% agency baseline under the standard model.

If the customer uses materially higher support or premium rendering, the partner share or price must be re-evaluated rather than allowing contribution margin to fall silently.

---

## 11. Discount Policy

### 11.1 Annual prepay

Default annual offer:

> **Pay for 10 months, receive 12 months.**

Equivalent discount: approximately 16.7%.

Examples:

| Plan | Monthly | Annual prepay |
| --- | ---: | ---: |
| Launch | $199 | $1,990 |
| Growth | $499 | $4,990 |
| Scale | $999 | $9,990 |

### 11.2 Discount stacking

Default rule:

> **One primary commercial discount only unless explicitly approved.**

Annual prepay, founding discount, agency wholesale discount and ad-hoc sales discount must not automatically stack.

Partner payout is calculated on **net collected revenue** after approved customer discount.

### 11.3 Founding merchant pricing

Founding pricing may be time-limited or contract-limited.

Do not promise a permanent lifetime price without explicit approval because:

- AI/provider cost can change;
- included usage may evolve;
- product scope will expand;
- channel economics may be affected.

---

## 12. Onboarding and Human Delivery Cost

Founder / internal labor must not be treated as zero for unit-economics planning.

Until real time tracking exists, use:

> **$50/hour loaded delivery cost**

as the internal planning rate.

### Pilot working estimate

| Activity | Pilot estimate |
| --- | ---: |
| Merchant setup | 1.0 h |
| 8–50 frame catalog preparation / review | 1.5–2.0 h |
| Campaign / source setup | 0.5 h |
| QA | 0.5 h |
| Kickoff / training | 0.5 h |
| **Total** | **4–5 h** |

Modeled first-time onboarding cost:

> **~$200–250 per pilot merchant.**

This makes the $149 pilot intentionally acquisition / validation investment rather than a mature profitable month.

Mature operating target:

> **≤2 internal hours to activate a normal Launch/Growth merchant.**

This target should drive CSV import, catalog review tooling, campaign templates and onboarding automation.

---

## 13. Merchant Value Model Before First Pilot Data

VisuTry does not yet have reliable merchant conversion / GMV benchmarks from its own customers.

Until pilot evidence exists, merchant value calculations must be labeled **planning scenarios**, not sales claims.

A useful internal scenario model is:

```text
Monthly merchant traffic
× baseline ecommerce conversion
× AOV
= baseline merchant GMV
```

Then:

```text
VisuTry-assisted relative conversion uplift
× baseline GMV
= estimated incremental commerce value
```

For pricing decisions, Sales / Product should test scenarios rather than claiming a guaranteed uplift.

Initial target segmentation can use traffic as a practical proxy:

| Segment | Working monthly traffic | Commercial fit |
| --- | ---: | --- |
| Launch | ~2K–10K visits | $199 entry product |
| Growth | ~10K–50K visits | $499 primary plan |
| Scale | 50K+ visits | $999+ and multiple campaigns |
| Enterprise | High-volume / multi-brand / multi-market | Custom $2.5K+ |

These thresholds are provisional and must be recalibrated using the first 3–10 pilot merchants.

---

## 14. Pricing Waterfall Requirement

Every real merchant contract should be representable as:

```text
List Price
- approved customer discount
= Net Contract Price
- partner / referral share
= Retained Revenue
- payment / billing cost
- AI usage cost
- attributable infra / support cost
= Contribution
```

For internal reporting, maintain at minimum:

- list MRR;
- net collected MRR;
- partner payout;
- AI cost;
- payment cost;
- support / direct delivery cost;
- contribution dollars;
- contribution margin;
- included usage consumed;
- overage / expansion revenue.

---

## 15. Required Product / Engineering Meters

Pricing cannot become real until the backend can meter the commercial objects.

Required meters:

1. merchant plan;
2. active campaign count;
3. AI Commerce Sessions;
4. recommendation calls;
5. standard render attempts / successes;
6. premium render attempts / successes;
7. merchant usage allowance consumed;
8. source / campaign attribution;
9. product click / favorite / inquiry;
10. verified conversion / order value when integration exists;
11. partner attribution where applicable.

Usage policy must remain server-owned. Merchant-facing UI must never be able to bypass allowance or billing policy.

Detailed entitlement behavior is defined in `docs/product/specs/merchant-commercial-entitlements.md`.

---

## 16. Pricing Governance

Pricing is a living commercial system, but changes must be controlled.

### Review after first 3 pilot merchants

Recalculate:

- renders/session;
- recommendation/session;
- support hours;
- onboarding hours;
- usage distribution;
- merchant objections;
- willingness to pay;
- preferred campaign count;
- value KPI.

### Review after first 10 paying merchants

Replace planning assumptions for:

- Stripe effective rate;
- support cost;
- infra cost;
- churn / retention;
- channel close rate;
- partner economics.

### Review after first 3 active channel partners

Re-evaluate:

- 20% referral rate;
- 30% agency margin;
- partner enablement cost;
- sales-cycle reduction;
- support transfer to partner;
- minimum partner volume commitment.

---

## 17. Decisions Locked by This Baseline

Until explicitly superseded:

1. Pilot anchor is **$149 / 30 days**, normally paid or deposit-backed.
2. Formal plan anchors are **$199 / $499 / $999 / $2,500+**.
3. Growth is the intended hero plan once the product is ready for it.
4. Standard rendering uses the lower-cost production model by default.
5. Premium rendering is an upsell / entitlement, not the universal default.
6. AI Commerce Session is the preferred customer-facing usage unit.
7. Referral baseline is **20% of collected recurring revenue for 12 months**.
8. Agency / solution partner baseline is **up to 30% recurring margin**.
9. Long-term acquisition planning assumes approximately **50% direct / 50% channel**.
10. Annual prepay baseline is **10 months paid / 12 months service**.
11. Mature direct gross-margin target is **≥75%**.
12. Mature post-channel contribution target is **≥60% of retained revenue**.
13. Campaign is an expansion-revenue dimension, not merely a UI grouping.
14. No salesperson may promise unimplemented future entitlements as current product capability.
15. Pilot data, not theoretical market models, is the next source of truth for recalibration.

---

## 18. Open Questions to Resolve With Pilot Evidence

1. What is the real average number of selected / rendered frames per shopper session?
2. Does the merchant value 1,000 / 5,000 / 10,000 session packaging, or another unit more naturally?
3. Is Campaign count a meaningful buying / expansion unit for SMB merchants?
4. Which KPI drives willingness to pay: product click, inquiry, appointment, add-to-cart, purchase or attributed revenue?
5. How much higher is willingness to pay when verified conversion / revenue attribution exists?
6. Do merchants perceive premium rendering quality strongly enough to support a separate paid tier?
7. How much merchant onboarding work can agencies absorb?
8. What is the right overage policy after real usage distribution is known?
9. When does an Enterprise customer require minimum annual commitment rather than month-to-month pricing?

---

## 19. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created v1 internal pricing, packaging, unit economics, channel economics, margin targets and governance baseline using current VisuTry AI cost inputs. |
