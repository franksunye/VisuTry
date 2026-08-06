# VisuTry Merchant Provider Risk & Fallback Economics

**Status:** Active internal risk baseline — Market-Capture Procurement v8  
**Owner:** Product / Strategy / Engineering  
**Created:** 2026-08-06  
**Last updated:** 2026-08-06  
**Review cadence:** Monthly during first 3–6 months and immediately after any provider/model/pricing change  
**Related pricing baseline:** `docs/strategy/merchant-pricing-packaging-unit-economics.md`  
**Related entitlement spec:** `docs/product/specs/merchant-commercial-entitlements.md`

---

## 1. Purpose

VisuTry currently has materially favorable Standard Try-On economics through `grsai.com`.

The current strategy deliberately uses part of this procurement advantage during the first 3–6 months to make the merchant offer competitive on VTO capacity.

The governing risk principle remains:

> **Merchant contracts must not assume that one discounted provider is permanently available.**

The new Market Capture principle is:

> **Temporary procurement alpha may be intentionally invested in competitive capacity, merchant acquisition, and product learning.**

These two principles are compatible because the current offer is explicitly stage-based, versioned, and time-bounded.

---

## 2. Current Observed Provider Economics

Current grsai costs supplied from the live VisuTry stack:

| Capability | Model | Current cost |
| --- | --- | ---: |
| Recommendation | `gemini-3.1-flash-lite` | RMB 0.0007425 / recommendation |
| Standard Try-On | `nano-banana-2-lite` | RMB 0.02725 / render |
| Premium Try-On | `nano-banana-2` | RMB 0.07425 / render |
| Failed / retried request | Current provider behavior | No model cost |
| Compare | Reuses completed renders | No additional model cost |

Using internal planning FX RMB 7/USD:

- Standard Try-On ≈ **$0.00389 / render**;
- Premium Try-On ≈ **$0.01061 / render**.

Approximate Standard render cost at current Market Capture allowances:

| Standard renders | Approx. grsai render COGS |
| ---: | ---: |
| 3,500 | **~$13.6** |
| 5,000 | **~$19.5** |

Therefore AI inference is not currently the dominant Pilot cost. Sales, onboarding, catalog preparation, and support remain more material early-stage cost drivers.

---

## 3. Current Market-Capture Entitlement

Active Founding Merchant Pilot:

> **$149 / 30 days**

Default capacity:

- **1,500 AI Commerce Sessions / AI-assisted shoppers**;
- **3,500 Standard Try-On renders**.

Optional selected-merchant bonus:

- up to **5,000 Standard renders**.

This offer intentionally uses current procurement alpha to remove a visible VTO price/volume disadvantage.

It must not be interpreted as a permanent mature-state allowance.

---

## 4. Three Cost Cases

VisuTry should maintain three distinct cost views:

| Cost case | Meaning | Role |
| --- | --- | --- |
| **Procurement Alpha / Best** | current unusually favorable qualified-provider cost | Market Capture flexibility and upside |
| **Sustainable Base** | repeatable long-term qualified-provider cost | long-term pricing planning |
| **Stress / Official** | official API/list-price fallback | continuity and downside planning |

Current internal planning references:

- Best Standard render: **~$0.00389**;
- Sustainable Base Standard render: **$0.025** planning assumption;
- Stress Standard render: **~$0.0336** planning reference.

The Base Case is not a verified market quote. It is a planning assumption until stable provider quotes exist.

---

## 5. Why v8 Is Still Economically Rational

At current grsai pricing:

- 3,500 renders cost only about $13.6;
- 5,000 renders cost only about $19.5.

Therefore using higher VTO capacity to improve conversion from sales conversation to paid Pilot is economically rational during Market Capture.

The decision rule is:

> **Do not save a few dollars of AI COGS if doing so creates an obvious competitive sales disadvantage.**

The main current cost question is not whether the render pool is theoretically expensive. It is whether the total merchant acquisition and delivery economics remain sensible.

---

## 6. Fallback Reality

A provider outage or permanent price deterioration materially changes economics.

The official fallback reference is substantially more expensive than current grsai pricing.

Therefore the current aggressive Pilot entitlement is safe only as a **time-boxed Market Capture version**, not as a perpetual unconditional allowance.

During a temporary fallback event:

- preserve merchant continuity where possible;
- accept temporary margin compression;
- prioritize active paid Pilots;
- do not silently route all traffic to Premium;
- track incremental fallback cost;
- apply abuse/concurrency controls if necessary.

During sustained high-cost operation:

- stop selling the existing v8 entitlement to new customers unless explicitly approved;
- create a new pricing/entitlement version;
- review price, capacity, provider mix, and overage design;
- accelerate qualification of alternative providers.

---

## 7. Operating States

### State A — Market Capture / Normal

Primary condition:

- current qualified low-cost provider economics are available and quality/reliability are acceptable.

Policy:

- v8 $149 / 1,500 shoppers / 3,500 renders may be sold;
- selected strategic merchants may receive up to 5,000 renders;
- use procurement alpha for market acquisition;
- track actual cost and usage closely.

### State B — Temporary Failover

Policy:

- route to approved fallback provider;
- preserve active customer experience;
- accept short-term margin compression;
- alert Product/Engineering/Operations;
- monitor cost daily;
- do not change signed merchant terms mid-Pilot unless contract/safety requires it.

Target duration:

> hours to a few days, not a permanent operating model.

### State C — Sustained Cost Deterioration

Trigger examples:

- low-cost provider disappears;
- material permanent price increase;
- reliability/compliance makes provider unusable;
- no equivalent alternative can be qualified.

Required response:

1. stop default sale of v8 entitlement to new customers;
2. calculate actual stressed GM using observed renders/session;
3. issue a new pricing/entitlement version;
4. revise included capacity and/or price;
5. review discounts and partner economics;
6. preserve existing contracted customers according to contract terms;
7. accelerate alternative procurement.

---

## 8. Provider Acceptance Gates

A provider is not qualified only because it is cheap.

Evaluate:

- output quality;
- success rate;
- latency;
- uptime;
- billing transparency;
- effective cost per successful render;
- retry/failure billing behavior;
- data/privacy terms;
- regional routing/availability;
- operational support;
- model/version stability.

A provider may be used as Market Capture infrastructure only if quality and operational risk are acceptable.

---

## 9. Engineering Requirements

The generation layer must support:

1. provider-neutral application contracts;
2. server-side provider/model routing;
3. Standard/Premium abstraction;
4. per-provider cost attribution;
5. per-task provider/model observability;
6. usage metering independent from provider billing units;
7. fallback reason logging;
8. circuit-breaker/failure monitoring;
9. configurable provider priority;
10. merchant-facing entitlements that do not name or depend on grsai.

Recommended concept:

```text
Commerce Generation Request
        ↓
Provider Router
        ↓
Approved low-cost provider
        ↓ failure / policy
Approved fallback provider
        ↓ explicit entitlement only
Premium provider/model
```

---

## 10. Required Market-Capture Measurements

Capture per merchant:

- Commerce Sessions;
- Standard renders;
- mean/median/p90 renders per Commerce Session;
- render-pool utilization;
- failed/retried renders;
- provider-specific cost;
- provider-specific latency/success rate;
- fallback share;
- AI COGS;
- onboarding hours;
- support hours;
- collected revenue;
- merchant continuation intent.

The first 3–5 paid merchants should replace theoretical assumptions with observed distributions.

---

## 11. 3–6 Month Review

At the end of the initial Market Capture period, decide:

- whether low-cost provider economics remain reliable;
- whether 3,500/5,000 render allowances are actually consumed;
- whether the higher capacity improved sales conversion;
- whether Merchant WTP supports higher future pricing;
- whether a new sustainable provider quote changes the Base Case;
- whether a new Early Scale pricing version should retain, reduce, or increase usage capacity.

Do not preserve v8 merely because it exists.

---

## 12. Risk Conclusion

The current low-cost provider advantage is real and commercially valuable.

The correct response is neither:

> **ignore the advantage and price as if official API cost were normal**

nor:

> **promise the advantage to customers forever.**

The v8 strategy is:

> **Use procurement alpha now to remove obvious VTO sales friction and acquire merchants; keep provider routing, versioned entitlements, telemetry, and repricing freedom so the business can adapt if upstream economics change.**

This is the approved Market Capture risk posture for the first 3–6 months.

---

## 13. Change Log

| Date | Change |
| --- | --- |
| 2026-08-06 | Created provider-risk and fallback baseline. |
| 2026-08-06 | **v8: replaced the old 75%-GM-safe allowance framing with a stage-aware Market Capture policy; aligned risk controls to the active $149 / 1,500 shopper / 3,500 render Pilot, optional 5,000-render bonus, and explicit temporary use of grsai procurement alpha while preserving fallback/versioning protections.** |
