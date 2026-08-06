# VisuTry Merchant Provider Risk & Official-API Fallback Economics

**Status:** Active internal risk baseline  
**Owner:** Product / Strategy / Engineering  
**Created:** 2026-08-06  
**Review cadence:** Monthly during pilot stage, and immediately after any provider/model/pricing change  
**Related pricing baseline:** `docs/strategy/merchant-pricing-packaging-unit-economics.md`  
**Related entitlement spec:** `docs/product/specs/merchant-commercial-entitlements.md`  
**Related engineering foundation:** `docs/product/specs/visutry-store-engineering-foundation.md`

---

## 1. Purpose

VisuTry currently obtains materially discounted model economics through `grsai.com`. This is commercially attractive, but it introduces supplier concentration risk.

The business must therefore be able to answer two different questions:

1. **Primary economics:** What does the merchant business look like under the current grsai routing and cost structure?
2. **Business-continuity economics:** What happens if grsai is unavailable and VisuTry must route directly to the official Gemini API at official list pricing?

The governing risk principle is:

> **Merchant pricing must not assume that one discounted model reseller is permanently available.**

The governing engineering principle is:

> **Provider routing must remain replaceable without changing merchant-facing product contracts.**

---

## 2. Current Primary-Provider Cost Baseline

Current grsai costs supplied from the live VisuTry stack:

| Capability | Model | Current cost |
| --- | --- | ---: |
| Recommendation | `gemini-3.1-flash-lite` | RMB 0.0007425 / recommendation |
| Standard Try-On | `nano-banana-2-lite` | RMB 0.02725 / render |
| Premium Try-On | `nano-banana-2` | RMB 0.07425 / render |
| Failed / retried request | Current provider behavior | No model cost |
| Compare | Reuses completed renders | No additional model cost |

Using the pricing baseline planning FX of RMB 7.0 = USD 1.00:

- recommendation ≈ **$0.00011**;
- standard try-on ≈ **$0.00389**;
- premium try-on ≈ **$0.01061**.

Modeled AI Commerce Session:

```text
1 recommendation
+ up to 4 try-on renders
+ compare using those renders
```

Primary-provider modeled cost:

- Standard: ≈ **$0.01568 / Commerce Session**;
- Premium: ≈ **$0.04253 / Commerce Session**.

---

## 3. Official Gemini API Fallback Baseline

Official pricing reference reviewed on 2026-08-06:

- Google Gemini Developer API Pricing: `https://ai.google.dev/gemini-api/docs/pricing`
- Gemini image-generation model guide: `https://ai.google.dev/gemini-api/docs/image-generation`

Relevant official Standard prices at the time of review:

### 3.1 Nano Banana 2 Lite

Official model: `gemini-3.1-flash-lite-image`

- image output: **$0.0336 per 1K image**;
- input: $0.25 / 1M tokens;
- text/thinking output: $1.50 / 1M tokens.

### 3.2 Nano Banana 2

Official model: `gemini-3.1-flash-image`

- image output: **$0.067 per 1K image**;
- image output: $0.045 at 0.5K, $0.101 at 2K, $0.151 at 4K;
- input: $0.50 / 1M tokens;
- text/thinking output: $3.00 / 1M tokens.

### 3.3 Recommendation model

Official `gemini-3.1-flash-lite` Standard pricing:

- input: **$0.25 / 1M text/image/video tokens**;
- output including thinking: **$1.50 / 1M tokens**.

Recommendation cost therefore depends on actual input/output token consumption and must be measured in production before an exact official-fallback recommendation unit cost is locked.

For the stress test below, recommendation is modeled at **$0.00125 per call**, corresponding illustratively to approximately 2,000 input tokens + 500 output/thinking tokens. This is a conservative planning assumption, not an observed production number.

The image generation cost dominates the fallback model, so reasonable recommendation-token variation does not materially change the core conclusion.

---

## 4. Official-API Commerce Session Cost

Using the same commercial session assumption:

```text
1 recommendation
+ 4 × 1K try-on renders
```

### Standard fallback — Nano Banana 2 Lite

```text
4 × $0.0336 image output
+ ~$0.00125 recommendation
≈ $0.13565 / Commerce Session
```

Rounded operational baseline:

> **Official fallback Standard ≈ $0.136 / Commerce Session**

Compared with grsai Standard ≈ $0.01568/session:

> **official direct fallback is roughly 8.6× more expensive per modeled session.**

### Premium fallback — Nano Banana 2

```text
4 × $0.067 image output
+ ~$0.00125 recommendation
≈ $0.26925 / Commerce Session
```

Rounded operational baseline:

> **Official fallback Premium ≈ $0.269 / Commerce Session**

Compared with grsai Premium ≈ $0.04253/session:

> **official direct fallback is roughly 6.3× more expensive per modeled session.**

---

## 5. Stress Test Against Current Merchant Packaging

Current commercial baseline:

| Plan | Price | Included Commerce Sessions |
| --- | ---: | ---: |
| Launch | $199 | 1,000 |
| Growth | $499 | 5,000 |
| Scale | $999 | 10,000 |

For comparability with the existing pricing baseline, this stress test uses:

- payment/billing cost = 5% of revenue;
- support allowance: Launch $10, Growth $20, Scale $40;
- marginal infra = 0 for current pilot-scale planning;
- official Standard model = Nano Banana 2 Lite;
- recommendation fallback planning cost ≈ $0.00125/call.

### 5.1 If full included usage is consumed under official Standard pricing

| Plan | Revenue | AI cost | Payment + Support | Total modeled direct cost | Modeled GM |
| --- | ---: | ---: | ---: | ---: | ---: |
| Launch | $199 | ~$136 | ~$20 | **~$156** | **~22%** |
| Growth | $499 | ~$678 | ~$45 | **~$723** | **negative (~-45%)** |
| Scale | $999 | ~$1,357 | ~$90 | **~$1,447** | **negative (~-45%)** |

Exact values move slightly with real recommendation token usage and payment cost, but the conclusion does not change:

> **The current 1K / 5K / 10K session allowances are economically viable under grsai pricing but are not viable as permanent unconditional allowances if VisuTry must run entirely on the official Standard Gemini API at list price.**

### 5.2 Premium official fallback is not a default continuity mode

If all sessions used Nano Banana 2 at approximately $0.269/session, even Launch becomes structurally loss-making at full included usage.

Therefore:

> **Premium rendering must never become the automatic emergency fallback for all traffic.**

Use Premium only when specifically entitled, manually approved, or required by a quality incident.

---

## 6. Gross-Margin-Safe Session Capacity Under Official Pricing

If VisuTry wanted to preserve approximately **75% direct gross margin** under official Standard fallback pricing while keeping current list prices and current support/payment assumptions, approximate included-session ceilings would be:

| Plan | Approx. 75% GM-safe official sessions |
| --- | ---: |
| Launch | **~220–230 sessions** |
| Growth | **~600–625 sessions** |
| Scale | **~1,200–1,250 sessions** |

These are not recommended merchant-facing allowances. They are risk-capacity numbers showing the magnitude of provider-price sensitivity.

A temporary continuity event may accept lower margin. For example, at roughly **30% gross margin**, approximate safe official Standard capacity rises to:

| Plan | Approx. 30% GM-safe official sessions |
| --- | ---: |
| Launch | **~900 sessions** |
| Growth | **~2,250 sessions** |
| Scale | **~4,500 sessions** |

This supports a practical continuity policy:

> **A short provider outage can be absorbed with margin compression; a long-term move to official list pricing requires entitlement, price, or usage redesign.**

---

## 7. Business-Continuity Policy

VisuTry should distinguish three operating states.

### State A — Normal

Primary provider: grsai or another approved low-cost provider.

Policy:

- current list pricing and allowances apply;
- Standard uses the efficient render model;
- Premium remains a paid / tiered capability;
- target direct GM remains ≥75%.

### State B — Temporary provider failover

Trigger examples:

- grsai outage;
- severe latency / error spike;
- account or routing incident;
- short-duration regional availability issue.

Policy:

- automatically or operationally fail over to official Nano Banana 2 Lite;
- preserve active merchant sessions and paid customer continuity;
- accept temporary margin compression;
- do not silently switch all traffic to Premium;
- alert Product/Engineering/Operations;
- track fallback usage and incremental cost separately;
- apply reasonable concurrency / abuse controls.

Target duration:

> **hours to a few days, not a permanent operating mode.**

### State C — Sustained loss of discounted provider economics

Trigger examples:

- primary provider unavailable for an extended period;
- material permanent price increase;
- reliability or compliance makes provider unusable;
- no equivalent discounted replacement available.

Required commercial response:

1. reforecast merchant gross margin immediately;
2. stop selling old usage allowances to new customers unless economics are approved;
3. reduce included Commerce Sessions for new contracts, raise price, or introduce overage / usage packs;
4. preserve contracted customers according to contract terms while applying fair-use and abuse protections;
5. accelerate alternative provider qualification;
6. review channel shares and discounts before approving new channel deals;
7. re-evaluate Premium Rendering allowance.

---

## 8. Pricing Design Implications

This stress test changes how pricing should be interpreted.

### 8.1 The list price remains value-based

Do not reprice VisuTry today as if official API list price were the normal supplier cost.

The current provider economics are real and commercially advantageous.

However, the pricing model must contain enough controls to survive supplier changes.

### 8.2 Included sessions are an entitlement, not an unlimited promise

Merchant contracts and product UI should avoid language that implies unlimited generation.

Backend must enforce:

- plan session allowance;
- render count;
- premium render allowance;
- campaign usage;
- overage / exhaustion behavior.

### 8.3 Contract language should preserve provider flexibility

Merchant-facing contracts should sell service quality and outcomes, not a named model provider.

VisuTry must retain the right to:

- change underlying AI provider/model;
- route across approved providers;
- adjust model quality tier within the contracted entitlement;
- apply fair-use / abuse limits;
- revise pricing or allowances at renewal where upstream cost changes materially.

Do not promise a permanent model name or permanent lifetime usage allowance.

### 8.4 Annual contracts need cost-change protection

Annual prepay is commercially useful, but long commitments increase provider-cost exposure.

Before scaling annual sales:

- define contract renewal mechanics;
- prohibit permanent lifetime pricing;
- reserve emergency fair-use controls;
- maintain a supplier-cost reserve in annual-plan planning;
- review upstream model costs before each annual pricing cycle.

---

## 9. Channel Economics Under Fallback

The current 20% referral / up-to-30% agency model is healthy under grsai economics.

It is **not** automatically healthy if a merchant consumes its full existing allowance under official API pricing.

Therefore:

> **Channel share is calculated from collected revenue, but new channel commitments must also pass provider-stress economics.**

During a sustained official-price operating state:

- no new exceptional discount + agency margin stacking;
- Growth/Scale high-usage deals require explicit margin review;
- partner economics may need to be based on a lower wholesale entitlement or usage-based overage;
- strategic/platform deals require a minimum commitment and usage economics rather than flat unlimited access.

---

## 10. Engineering Requirements

Provider resilience is now a commercial requirement, not only an infrastructure preference.

The generation layer must support:

1. provider-neutral application contracts;
2. explicit provider/model routing configuration;
3. merchant-safe failover to an approved official provider;
4. per-provider cost attribution;
5. per-task provider and model observability;
6. usage metering independent from provider billing units;
7. circuit breaker / failure-rate monitoring;
8. configurable quality tier and fallback order;
9. no merchant-facing dependency on grsai-specific response fields;
10. the ability to disable Premium fallback independently from Standard fallback.

Recommended routing concept:

```text
Commerce Generation Request
        ↓
Provider Router
        ↓
Primary: approved low-cost provider
        ↓ failure / policy
Fallback: official Gemini API — Nano Banana 2 Lite
        ↓ explicit premium entitlement only
Premium: Nano Banana 2
```

Provider selection remains an infrastructure concern. Merchant pricing and entitlements remain stable product concepts.

---

## 11. Required Measurements During Pilot

The fallback model becomes materially more accurate once the first real pilot usage exists.

Capture at minimum:

- Commerce Sessions / merchant / month;
- recommendation token input/output distribution;
- renders / Commerce Session — mean, median, p90;
- percent of sessions that use 1 / 2 / 3 / 4 renders;
- failed render rate;
- retry behavior by provider;
- Standard vs Premium usage;
- provider-specific cost per successful session;
- provider-specific latency and success rate;
- actual merchant payment processing cost;
- support hours / merchant.

After the first 3–5 pilots, replace the conservative four-render/session assumption with observed usage distributions.

---

## 12. Risk Conclusion

Current economics under grsai remain highly attractive and support the existing merchant pricing baseline.

However:

> **The current margin profile contains a meaningful supplier-economics dependency.**

At official Gemini API Standard list price, one modeled four-render Commerce Session rises from roughly **$0.016 to $0.136**, an approximately **8× increase**. If current 1K / 5K / 10K allowances were fully consumed under that fallback, Launch margin compresses sharply and Growth / Scale become loss-making.

This does **not** invalidate the pricing strategy. It means the business must treat provider resilience as part of commercial architecture:

> **low-cost provider for normal economics + official API for continuity + metered entitlements + contract flexibility + alternative-provider qualification.**

The operational objective is not to guarantee 75% margin during a short supplier outage. It is to guarantee service continuity without allowing a temporary fallback to become an unnoticed permanent loss-making operating mode.
