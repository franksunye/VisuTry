# VisuTry Store Sales Demo Spec

**Status:** Implemented — controlled production validation active; Gate A1 closed; Market-Capture Competitive Offer v8
**Owner:** Product / Engineering / Growth  
**Created:** 2026-08-05  
**Last updated:** 2026-08-06  
**Primary purpose:** Merchant sales validation before full Store productization  
**Related pricing:** `docs/strategy/merchant-pricing-packaging-unit-economics.md`  
**Related commercial entitlement:** `docs/product/specs/merchant-commercial-entitlements.md`

---

## 1. Decision

The Store Sales Demo remains the reusable working merchant-specific experience for the first paid Pilots.

The product story is:

> **Merchant catalog → AI-assisted frame discovery → Virtual Try-On → Frame Compare → Product / inquiry intent → Merchant insight.**

The commercial story is now explicitly:

> **Competitive VTO capacity first; Recommendation + Compare + Intent Intelligence as additional value.**

The merchant must not feel that VisuTry asks them to pay more for visibly fewer try-ons.

---

## 2. Sales Validation Question

The primary question is now:

> **Will an eyewear merchant pay $149 for a 30-day assisted Pilot that is competitive on VTO capacity and also adds recommendation, comparison and purchase-intent insight?**

Secondary questions:

- Does the larger VTO allowance remove the easiest competitor objection?
- Does the merchant understand the extra value without a long category explanation?
- Is $149 easy enough to approve?
- Does assisted setup reduce friction?
- Does the merchant want to route real traffic?
- Does the merchant want to continue after the Pilot?

---

## 3. Current Founding Merchant Pilot v8

### Headline

> **Founding Merchant Pilot — $149 / 30 days**

### Included value

- 8–50 real merchant frames;
- personalized AI frame recommendations;
- AI Virtual Try-On;
- multi-frame Compare;
- Product Click / Favorite / Inquiry tracking;
- source/campaign context;
- merchant intent-performance view;
- assisted setup;
- weekly review.

### Included capacity

> **Up to 1,500 AI-assisted shoppers and 3,500 Standard Try-On generations.**

Selected early merchants may receive an approved Founding Launch Bonus up to 5,000 Standard Try-On generations.

Do not present the optional bonus as the default public entitlement.

---

## 4. Sales Positioning

### 20-second pitch

> **You get a competitive virtual try-on package, but VisuTry also helps shoppers decide what to try. For $149, we run a 30-day Pilot with your real frames: personalized recommendations, Try-On, Compare, and measurable shopper-intent signals. We handle the initial setup.**

### Direct competitor comparison

If the merchant references Fittingbox, Banuba, or another VTO tool:

> **That comparison is fair. We designed the Founding Pilot so you are not paying more just to get fewer try-ons. The difference is that VisuTry adds personalized recommendation, comparison and shopper-intent insight on top of the VTO experience.**

### If the merchant asks why not simply buy a VTO widget

> **If VTO alone solves your problem, a commodity VTO tool may be enough. VisuTry is useful when you also want to help shoppers narrow the catalog, compare finalists and see which frames generate stronger purchase intent.**

### ROI question

> **We do not want to overclaim revenue uplift before deeper commerce integration exists. The first Pilot measures whether shoppers use recommendation, Try-On and Compare, and which products create stronger purchase intent.**

### Close

> **The simplest next step is a 30-day Pilot for $149. We set up 8–50 of your frames, include up to 1,500 AI-assisted shoppers and 3,500 Try-On generations, and review the results with you before you decide whether to continue.**

---

## 5. 10-Minute Demo Script

### Minute 0–1 — Merchant problem

Say:

> **Shoppers often browse many frames but do not know what to try first. VisuTry helps them narrow your own catalog, then Try-On and Compare the finalists.**

Do not lead with AI model names, tokens, or internal quota terminology.

### Minute 1–3 — Recommendation

1. Open merchant-specific Store.
2. Upload a shopper photo.
3. Run recommendation.
4. Show merchant-catalog shortlist.
5. Show short recommendation reasons.

Say:

> **These recommendations come from your catalog, not a generic frame library.**

### Minute 3–6 — Try-On and Compare

1. Select 2–4 frames.
2. Generate Try-On results.
3. Compare finalists.
4. Keep merchant product identity visible.

Say:

> **The virtual try-on itself is competitive with familiar tools; VisuTry adds the decision layer before and after it.**

### Minute 6–8 — Purchase intent

Show Product Click, Favorite / Interested, and Inquiry where enabled.

Say:

> **We can measure these intent signals without requiring your checkout integration for the first Pilot.**

### Minute 8–9 — Merchant insight

Show:

- AI-assisted shoppers;
- recommendation completion;
- Try-On / Compare;
- Product Click / Favorite / Inquiry;
- top frames;
- recent high-intent journeys;
- source/campaign context where available.

### Minute 9–10 — Commercial close

Use the standard close above.

If the merchant asks for capacity, say directly:

> **The Pilot includes up to 1,500 AI-assisted shoppers and 3,500 Standard Try-On generations.**

This number should now be stated confidently rather than defensively.

---

## 6. Merchant Dashboard Story

Merchant-facing hierarchy:

```text
1. Shopping / decision funnel
2. Top frames and high-intent journeys
3. Source / campaign context
4. Usage / capacity
```

Usage may show:

```text
AI-assisted shoppers: 420 / 1,500
Standard Try-On generations: 910 / 3,500
```

Do not present revenue attribution or incremental GMV unless those evidence layers are actually implemented.

---

## 7. Current Demo Product Requirements

The existing shopper flow remains:

1. merchant context;
2. photo upload;
3. AI-assisted shortlist;
4. Try-On;
5. Compare;
6. intent action.

The current Pilot does not require:

- checkout integration;
- Shopify app installation;
- EHR/PMS;
- revenue attribution;
- incrementality experiments.

Recommendation remains a required differentiation from generic VTO.

---

## 8. Catalog / Assisted Onboarding

Approved Founding Pilot path:

1. obtain public catalog data or prepared CSV;
2. normalize metadata;
3. enrich frame attributes;
4. manually review 8–50 frames;
5. load into merchant experience.

Assisted onboarding is part of the $149 offer.

The merchant should experience the result rather than the internal manual work.

---

## 9. Usage and Exception Handling

Default:

- 1,500 AI-assisted shoppers;
- 3,500 Standard Try-On generations.

Selected merchant exception:

- Founding Launch Bonus up to 5,000 generations.

Rules:

- no surprise overage charge;
- monitor before 80% usage;
- Sales/Product review before interruption;
- commercial exceptions recorded server-side/admin-side;
- no lifetime-capacity promise.

---

## 10. Commercial Acceptance Metrics

Track:

| Metric | Initial target |
| --- | ---: |
| Qualified merchants contacted | 50+ |
| Replies | 10+ |
| Demo calls | 5–10 |
| Merchants requesting own Pilot | 3+ |
| Paid / deposit-backed Pilot | 1+ initially; target 3 in validation cycle |

Additionally record:

- competitor named;
- whether raw VTO capacity was an objection;
- whether 3,500 included generations removed that objection;
- whether Recommendation/Compare/Intent differentiation was understood;
- whether $149 felt easy to approve;
- time to decision;
- continuation intent.

---

## 11. Current Sales Non-Goals

Do not delay Market Capture for:

- checkout/order integration;
- revenue attribution;
- incrementality measurement;
- generalized campaign builder;
- public Shopify marketplace listing;
- enterprise SSO;
- public API;
- EHR/PMS integration.

---

## 12. Review Window

This sales offer is intended for the initial **3–6 month Market Capture period**.

Review earlier after 3–5 paid merchants or material changes in competitor/provider economics.

The next pricing version may change price, capacity, support scope, or packaging.

---

## 13. Change Log

| Date | Change |
| --- | --- |
| 2026-08-05 | Created and implemented reusable Store Sales Demo. |
| 2026-08-06 | v7: aligned demo to a sales-first $149 Intent-First Pilot. |
| 2026-08-06 | **v8: aligned Sales Demo to the finalized Market Capture offer: $149 / 30 days, 1,500 AI-assisted shoppers, 3,500 Standard Try-On generations, optional 5,000-generation Founding Launch Bonus; replaced defensive VTO positioning with competitive-floor + differentiated-upside sales language.** |
