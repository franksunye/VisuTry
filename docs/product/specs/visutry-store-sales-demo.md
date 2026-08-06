# VisuTry Store Sales Demo Spec

**Status:** Implemented — controlled production validation active; Gate A1 closed; Sales-First Pilot framing v7
**Owner:** Product / Engineering / Growth  
**Created:** 2026-08-05  
**Last updated:** 2026-08-06  
**Primary purpose:** Merchant sales validation before full Store productization  
**Related LP:** `docs/product/specs/visutry-store-landing-page.md`  
**Related MVP:** `docs/product/specs/visutry-store-mvp.md`  
**Related pricing:** `docs/strategy/merchant-pricing-packaging-unit-economics.md`  
**Related commercial entitlement:** `docs/product/specs/merchant-commercial-entitlements.md`

---

## 1. Decision

VisuTry will use a real, reusable Store Sales Demo before building a public Shopify app, WooCommerce plugin, EHR/PMS integration, or large merchant administration system.

The demo is a working merchant-specific hosted experience that can be shown in a 10-minute sales call and reused for the first Pilot merchants.

The product story is:

> **Merchant catalog → AI-assisted frame discovery → Virtual Try-On → Frame Compare → Product / inquiry intent → Merchant insight.**

The demo must make clear that VisuTry is not only a virtual try-on feature. It is an AI decision layer that helps eyewear shoppers narrow a merchant's catalog and gives the merchant measurable purchase-intent signals.

The current commercial framing is:

> **Founding Merchant Pilot — $149 for 30 days. We set up the merchant's real frames in a guided AI shopping experience and measure shopper intent.**

Usage capacity is a fair-use scope, not the headline value proposition.

---

## 2. Sales Validation Question

The demo now exists to answer:

> **Will an eyewear merchant pay $149 for a 30-day assisted AI shopping Pilot using its own frames, even before VisuTry can prove downstream revenue attribution?**

The Merchant should be able to understand the value without needing a technical explanation of AI Commerce Sessions, tokens or render economics.

Secondary validation questions:

- Does the merchant understand why VisuTry is broader than a VTO widget?
- Is $149 low enough to make a first experiment easy to approve?
- Does assisted setup materially reduce purchase friction?
- Does the merchant want to route real traffic after the demo?
- Does the merchant want to continue after seeing intent data?

---

## 3. Current Founding Pilot Offer

### Headline

> **Founding Merchant Pilot — $149 / 30 days**

### Merchant-facing value

- use 8–50 real merchant frames;
- personalized AI frame recommendations;
- AI Virtual Try-On;
- compare multiple finalists;
- Product Click / Favorite / Inquiry intent tracking;
- merchant intent-performance view;
- assisted setup;
- weekly review.

### Fair-use scope

> **Up to 500 AI-assisted shoppers and up to 1,000 Standard Try-On generations during the Pilot.**

Do not headline the offer as `$149 / 1,000 generations` or `$149 / 500 sessions`.

The internal term `AI Commerce Session` may appear in agreement/admin usage details after the merchant understands the offer.

---

## 4. Target Merchant for Demo

Primary target:

- independent online eyewear brands;
- Shopify-native DTC eyewear stores;
- independent optical stores with an existing website and 20–500 frames;
- merchants with online purchase, inquiry, or pre-shop workflows;
- merchants that do not require medical-grade measurements or EHR/PMS integration for an initial Pilot.

Preferred qualification:

- at least 20 active frame SKUs;
- product images available online or by CSV;
- meaningful online traffic or active social selling;
- owner, ecommerce lead, or growth lead can make a Pilot decision;
- willing to start with a representative catalog rather than a full inventory integration.

---

## 5. Demo Outcome

A successful 10-minute demo should make the merchant understand:

1. VisuTry can use the merchant's own frames.
2. Shoppers receive a useful personalized shortlist.
3. Shoppers can Try-On and Compare finalists in one journey.
4. Recommended/tried frames stay connected to merchant products.
5. Merchant can see Product Click / Favorite / Inquiry and high-intent behavior.
6. No EHR/PMS or checkout integration is required to run the first Pilot.
7. The next step is a bounded $149 / 30-day experiment, not a large implementation project.

Primary CTA:

> **Start a 30-day Founding Merchant Pilot with 8–50 representative frames for $149.**

---

## 6. 10-Minute Sales Demo Script

### Minute 0–1: Merchant problem

Say:

> **Shoppers often browse many frames but do not know what to try first. Most virtual try-on tools start after that decision. VisuTry starts earlier: it helps shoppers narrow your own catalog, then Try-On and Compare the finalists.**

Do not lead with model names, AI infrastructure or usage limits.

### Minute 1–3: Recommendation

1. Open the merchant-specific Store.
2. Upload a front-facing shopper photo.
3. Run recommendation.
4. Show merchant-specific shortlisted frames.
5. Show short recommendation reasons.

Say:

> **These recommendations come from your catalog, not a generic frame library.**

### Minute 3–6: Try-On and Compare

1. Select 2–4 recommended frames.
2. Generate try-on results.
3. Open side-by-side comparison.
4. Keep product identity/link visible.

Say:

> **Virtual Try-On is one step in the journey. The value is helping the shopper move from “I don't know what suits me” to a small set of products they are actually considering.**

### Minute 6–8: Purchase intent

Show:

- View Product;
- Favorite / I'm interested;
- Inquiry if enabled.

Say:

> **We do not need your checkout integration to see these signals. For the first Pilot, we focus on what shoppers recommend, try, compare and actively show interest in.**

### Minute 8–9: Merchant insight

Show:

- shopper sessions;
- recommendation completion;
- Try-On / Compare;
- Product Click;
- Favorite / Inquiry;
- top frames;
- recent high-intent journeys.

Do not lead with quota cards. Usage can be shown in a secondary section.

### Minute 9–10: Commercial close

Say:

> **The simplest next step is a 30-day Founding Merchant Pilot. It is $149. We use 8–50 of your real frames, help set it up, and then review how your shoppers actually used recommendation, Try-On and Compare before you decide whether to continue.**

If needed, add:

> **The Pilot includes up to 500 AI-assisted shoppers and 1,000 standard Try-On generations.**

---

## 7. Sales Objection Handling

### “There are cheaper VTO tools.”

> **Yes. If you only need a high-volume VTO widget, there are lower-cost options. VisuTry is testing a broader shopping journey: recommendation, Try-On, Compare and measurable purchase intent, using your own catalog, with setup included.**

### “Can you prove this increases sales?”

> **Not yet, and we do not want to overclaim. Revenue attribution needs deeper commerce integration. The first Pilot measures the shopper decision journey and purchase-intent signals. The purpose is to see whether shoppers use it and whether the insight is valuable enough for you to continue.**

### “Why pay for a Pilot?”

> **Because this is not a generic demo. We prepare your real frame catalog, configure the experience, support the launch and review the results with you. The $149 keeps the test serious while keeping the decision small.**

### “What happens after 30 days?”

> **We review the usage and intent data together. If it is useful, we discuss the next commercial plan based on your traffic and what you actually need. Founding Pilot pricing is not a lifetime price commitment.**

### “What if we hit the usage limit?”

> **We monitor usage during the Pilot and will discuss an extension before anything is stopped or charged. There are no surprise Pilot overage charges.**

---

## 8. Merchant Dashboard Story

The dashboard is a sales tool, but its semantics remain production-grade.

Merchant-facing hierarchy:

```text
1. Shopping intent / decision funnel
2. Top frames and high-intent journeys
3. Usage / fair-use status
```

Required intent metrics:

- AI-assisted shoppers / Commerce Sessions;
- recommendation completion;
- Try-On completion;
- Compare use;
- Product Click;
- Favorite;
- Inquiry;
- top frames;
- source/campaign context where available.

Usage section may show:

```text
AI-assisted shoppers: 236 / 500
Standard Try-On generations: 418 / 1,000
```

Do not present attributed revenue, conversion uplift or incremental GMV unless those evidence levels are actually implemented and supported.

---

## 9. Shopper Demo Flow

### Step 1 — Merchant context

Display merchant logo/name, merchant-specific headline, privacy notice and one dominant photo-upload CTA.

### Step 2 — Photo upload

Accept one front-facing portrait, use existing validation, create merchant session and record upload without exposing raw image to merchant insights.

### Step 3 — AI-assisted shortlist

Required because this is the core differentiation from generic VTO.

Minimum output:

- 4–8 recommended merchant frames;
- recommendation reason per frame;
- visible shape/style tags;
- select up to 4 for Try-On/Compare.

### Step 4 — Try-On

Reuse existing generation pipeline with merchant attribution and merchant-specific usage policy.

### Step 5 — Compare

Compare up to 4 frames, keep product metadata and link visible, allow replacement without losing completed results.

### Step 6 — Intent

Minimum:

- favorite / interested;
- product click;
- lightweight inquiry where enabled.

No checkout, revenue attribution or appointment scheduling is required for the Founding Pilot.

---

## 10. Events

Required Sales Demo events:

```text
merchant_page_viewed
merchant_photo_uploaded
merchant_recommendation_started
merchant_recommendation_completed
merchant_frame_selected
merchant_tryon_started
merchant_tryon_completed
merchant_tryon_failed
merchant_compare_started
merchant_favorite_saved
merchant_product_clicked
merchant_inquiry_submitted
merchant_insights_viewed
```

Do not send raw image URLs or sensitive face-analysis payloads into general analytics events.

---

## 11. Catalog Source / Assisted Onboarding

The Founding Pilot does not require self-service integration.

Approved path:

1. seed catalog from public merchant product data or prepared CSV;
2. normalize product metadata;
3. enrich frame tags;
4. manually review 8–50 frames;
5. load into merchant experience.

The merchant experiences the finished Pilot, not the manual preparation.

Assisted onboarding is part of the current sales value proposition and should be stated explicitly.

---

## 12. Privacy and Claims

Required principles:

- shopper sees privacy/retention information before upload;
- merchant does not receive raw face photos by default;
- merchant insights focus on product interest and decision signals;
- no medical diagnosis;
- no prescription claims;
- no guaranteed physical fit or PD accuracy;
- no guaranteed revenue/conversion claims;
- describe Try-On as visual decision support.

---

## 13. Commercial Acceptance Criteria

After the demo is usable, Growth/Product should track:

| Metric | Initial target |
| --- | ---: |
| Qualified merchants contacted | 50+ |
| Replies | 10+ |
| Demo calls | 5–10 |
| Merchants requesting their own sample/Pilot | 3+ |
| Paid / deposit-backed Pilot | 1+ initially; target 3 within validation cycle |

Additionally record:

- whether merchant compared VisuTry mainly with VTO price/volume;
- whether the guided shopping differentiation was understood;
- whether $149 felt easy to approve;
- time from demo to decision;
- objections;
- continuation intent after Pilot.

A strong signal is a merchant asking to put its own frames into the experience or asking how quickly it can launch for real shoppers.

---

## 14. Explicit Non-Goals for Current Sales Demo

Do not delay Pilot for:

- Shopify app installation;
- WooCommerce plugin;
- EHR/PMS connectors;
- merchant checkout/order integration;
- revenue attribution;
- incrementality experiments;
- enterprise SSO;
- generalized campaign builder;
- public API;
- real-time 3D AR.

---

## 15. Change Log

| Date | Change |
| --- | --- |
| 2026-08-05 | Created engineering-ready Store Sales Demo spec and made AI-assisted merchant-catalog recommendation required. |
| 2026-08-05 | Implemented controlled D0 sales demo and merchant-intelligence surfaces. |
| 2026-08-06 | **v7: aligned Sales Demo to the $149 Founding Merchant Pilot; reframed the offer as an assisted 30-day AI shopping experiment, moved 500 shoppers / 1,000 generations to fair-use scope, added exact talk track and objection handling, and removed revenue attribution from the sales close.** |
