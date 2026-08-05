# VisuTry Store Sales Demo Spec

**Status:** Approved for engineering  
**Owner:** Product / Engineering / Growth  
**Created:** 2026-08-05  
**Last updated:** 2026-08-05  
**Primary purpose:** Merchant sales validation before full Store productization  
**Related LP:** `docs/product/specs/visutry-store-landing-page.md`  
**Related MVP:** `docs/product/specs/visutry-store-mvp.md`  
**Related plan:** `docs/product/plans/visutry-store-implementation-plan.md`
**Required engineering foundation:** `docs/product/specs/visutry-store-engineering-foundation.md`

---

## 1. Decision

VisuTry will build a real, reusable Store Sales Demo before building a public Shopify app, WooCommerce plugin, EHR/PMS integration, or large merchant administration system.

The demo is not a Figma prototype and not a one-off presentation. It should be a working merchant-specific hosted experience that can be shown in a 10-minute sales call and reused for the first pilot merchants.

The product story is:

> Merchant catalog → AI-assisted frame discovery → Virtual Try-On → Frame Compare → Product / inquiry intent → Merchant insight.

The demo must make clear that VisuTry is not only a virtual try-on feature. It is an AI decision layer that helps eyewear shoppers narrow a merchant's catalog and gives the merchant measurable purchase-intent signals.

---

## 2. Sales Validation Question

The demo exists to answer one commercial question:

> Will an eyewear merchant pay approximately USD 99-199/month for VisuTry to help shoppers discover suitable frames, try and compare them, and surface purchase intent?

The demo should therefore optimize for merchant comprehension and willingness to pilot, not feature completeness.

---

## 3. Target Merchant for Demo

Primary target:

- independent online eyewear brands;
- Shopify-native DTC eyewear stores;
- independent optical stores with an existing website and 20-500 frames;
- merchants with online purchase, inquiry, or pre-shop workflows;
- merchants that do not require medical-grade measurements or EHR/PMS integration to run an initial pilot.

Preferred qualification:

- at least 20 active frame SKUs;
- existing product images available online or by CSV;
- meaningful online traffic or active social selling;
- owner, ecommerce lead, or growth lead can make a pilot decision;
- willing to start with a small representative catalog rather than a full inventory integration.

Do not optimize the first demo for:

- enterprise procurement;
- chain-wide inventory synchronization;
- insurance / prescription workflows;
- medical-grade fit claims;
- real-time 3D AR requirements;
- full white-label implementation.

---

## 4. Demo Outcome

A successful 10-minute demo should allow a merchant to understand all of the following without additional explanation:

1. VisuTry can use the merchant's own frames.
2. Shoppers can upload one photo and receive a useful shortlist.
3. Shoppers can try frames and compare finalists in one flow.
4. Each recommended / tried frame remains connected to the merchant's product.
5. The merchant can see which frames and shoppers show stronger purchase intent.
6. The merchant can start with a small catalog and does not need EHR/PMS integration.
7. The next step is a small pilot, not a large implementation project.

Primary CTA after the demo:

> Create a sample Store / start a 30-day pilot with 8-20 representative frames.

---

## 5. Demo Architecture

The first demo should use a dedicated sample merchant, for example `Luna Optical`, matching the current Store landing-page visuals.

Recommended route shape:

```text
/store/demo/luna
/store/demo/luna/catalog
/store/demo/luna/insights
```

Exact route naming may follow the existing Next.js architecture, but the implementation must preserve one merchant-scoped identifier through the entire flow.

The demo can use seeded merchant and frame data. It must not depend on a production Shopify installation.

### Required demo data

Seed one merchant with:

- name;
- logo;
- website / product base URL;
- contact email;
- optional accent color;
- 12-20 representative frames;
- realistic frame names, SKU, price, product URL, image URL, shape, material, style tags, color, and width class.

The frame catalog should include enough variation to demonstrate recommendations:

- rectangle;
- round;
- cat-eye;
- aviator;
- browline;
- geometric;
- at least two materials;
- at least three color directions;
- narrow / medium / wide classes where known.

---

## 6. 10-Minute Sales Demo Script

The product must support this exact narrative.

### Minute 0-1: Merchant problem

Show the merchant Store page and explain:

> Shoppers often browse many frames but do not know which ones to try first. VisuTry helps them narrow your catalog before they buy or contact your team.

Do not lead with model names or AI infrastructure.

### Minute 1-3: Upload and recommendation

1. Open the merchant-specific Store.
2. Upload a clear front-facing shopper photo.
3. Run face understanding / recommendation.
4. Show a shortlist of merchant frames.
5. For each recommendation, show a short reason such as shape balance, visual width, or style direction.

The demo should prove that recommendations come from the merchant catalog, not from generic VisuTry presets.

### Minute 3-6: Try-On and Compare

1. Select 2-4 recommended frames.
2. Generate realistic try-on results using the existing VisuTry generation pipeline.
3. Open side-by-side comparison.
4. Allow switching / removing finalists.
5. Keep merchant product name, image, price if available, and product link visible.

The product should make the transition from recommendation to try-on to compare feel like one decision journey.

### Minute 6-8: Purchase intent

From the shortlist or comparison result, support at least:

- `View product`;
- `I'm interested` / favorite;
- optional lightweight inquiry submission.

Every action must remain attributed to `merchantId`, `frameId`, and `merchantSessionId`.

### Minute 8-10: Merchant insights

Open the merchant insight view and show:

- shopper sessions;
- recommendation starts;
- try-on completions;
- compare starts;
- product clicks;
- favorites / inquiry intents;
- top frames by attention;
- recent high-intent sessions.

Close with:

> We can launch this with 8-20 of your frames first, measure how shoppers use it, and expand only if it improves your selling workflow.

---

## 7. Shopper Demo Flow

### Step 1 — Merchant context

Display:

- merchant logo / name;
- short merchant-specific headline;
- clear privacy notice;
- CTA to upload a photo.

Do not show VisuTry consumer pricing or Credits Pack inside the merchant demo.

### Step 2 — Photo upload

Requirements:

- accept one front-facing portrait;
- use existing photo validation where possible;
- show upload guidance;
- create a merchant session before generation;
- record upload event without exposing the raw image to merchant insight UI.

### Step 3 — AI-assisted shortlist

The Sales Demo must include recommendation. This is no longer optional because it is the core differentiation from a generic VTO widget.

Recommendation should combine currently available consumer face-analysis / recommendation logic with merchant frame metadata.

Minimum output:

- 4-8 recommended merchant frames;
- recommendation reason per frame;
- visible shape / style tags;
- ability to select up to 4 for try-on / compare.

The first implementation may use a deterministic ranking layer over AI-enriched frame tags. It does not require a new recommendation model if existing face analysis and rules can produce a credible ranking.

### Step 4 — Try-On

Reuse the existing glasses try-on pipeline.

Requirements:

- generate per selected merchant frame;
- show queued / processing / completed / failed states;
- failed generations can retry;
- merchant demo usage is not deducted from consumer credits;
- retain merchant attribution on every task.

### Step 5 — Compare

Reuse Frame Compare interaction patterns where possible.

Requirements:

- compare up to 4 selected merchant frames;
- show same portrait across all results;
- maintain product metadata under each result;
- allow removal / replacement without losing completed results;
- expose `View product` and interest action after comparison.

### Step 6 — Intent

Minimum intent actions:

- favorite / interested;
- product click.

Inquiry form is recommended but can be the last task in Demo D0 if schedule pressure exists.

If included, inquiry fields should be minimal:

- email;
- optional name;
- optional note.

No appointment scheduling is required in the Sales Demo.

---

## 8. Merchant Insight Demo

The insight view is intentionally small. It is not a merchant BI product.

### Required metrics

| Metric | Definition |
| --- | --- |
| Sessions | Merchant Store sessions created. |
| Photos uploaded | Sessions reaching photo upload. |
| Recommendations | Sessions receiving a shortlist. |
| Try-ons | Successful merchant-attributed try-on renders. |
| Compare starts | Sessions entering comparison. |
| Product clicks | Clicks to merchant product URLs. |
| Favorites / interests | Explicit shopper interest actions. |
| Inquiries | Submitted leads if enabled. |

### Required frame view

Show top frames ranked by at least:

- recommendation impressions;
- try-ons;
- favorites / interests;
- product clicks.

### Required recent-session view

Show only non-sensitive intent context:

- timestamp;
- anonymous session ID or short label;
- frames recommended;
- frames tried;
- frames compared;
- favorite / product click / inquiry status.

Do not display raw shopper face photos in merchant insights by default.

---

## 9. Data Model for Demo

Use or evaluate these entities. Naming may follow current Prisma conventions.

### `Merchant`

Minimum fields:

```text
id
slug
name
logoUrl
websiteUrl
contactEmail
accentColor?
status
createdAt
updatedAt
```

### `MerchantFrame`

Minimum fields:

```text
id
merchantId
sku?
name
imageUrl
productUrl?
price?
currency?
shape
material?
color?
widthClass?
styleTags[]
status
createdAt
updatedAt
```

### `MerchantSession`

Minimum fields:

```text
id
merchantId
anonymousVisitorId?
photoAssetId?
status
createdAt
lastActiveAt
```

### Merchant-attributed generation

Prefer extending the existing try-on task model with optional attribution rather than duplicating generation infrastructure:

```text
merchantId?
merchantSessionId?
merchantFrameId?
```

### `MerchantIntent`

Minimum fields:

```text
id
merchantId
merchantSessionId
merchantFrameId?
type: FAVORITE | PRODUCT_CLICK | INQUIRY
email?
name?
note?
createdAt
```

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

Each merchant shopper event should carry when available:

```text
merchant_id
merchant_session_id
merchant_frame_id
source
device_type
locale
```

Do not send raw image URLs or sensitive face-analysis payloads into general analytics events.

---

## 11. Catalog Source for Sales Demo

The Sales Demo does not require self-service integration.

Approved D0 path:

1. seed catalog from public merchant product data or manually prepared CSV;
2. normalize product metadata;
3. AI / rules enrich frame tags;
4. manually review the 12-20 demo frames;
5. load into the demo merchant.

This intentionally permits assisted onboarding.

The merchant should experience the result, not the internal manual preparation.

---

## 12. Reuse Requirements

Engineering should reuse existing VisuTry capabilities before creating new parallel systems:

- existing authentication only where a merchant/admin view requires it;
- existing face-analysis / glasses-advisor signals;
- existing virtual glasses try-on generation;
- existing Frame Compare generation and result states;
- existing image storage / retention mechanisms where compatible;
- existing analytics conventions;
- existing UI components and design system.

Do not fork the core generation pipeline for Store.

Store should add merchant attribution, catalog intelligence, and merchant-specific workflow around the existing engine.

---

## 13. Privacy and Claims

Required principles:

- shopper must see privacy / retention information before upload;
- merchant does not receive raw face photos by default;
- merchant insights focus on frame interest and conversion signals;
- no medical diagnosis;
- no prescription claims;
- no guaranteed physical fit or PD accuracy;
- describe try-on as visual decision support.

---

## 14. Explicit Non-Goals for Sales Demo

Do not build for D0:

- Shopify app installation;
- WooCommerce plugin;
- EHR/PMS connectors;
- inventory quantity sync;
- merchant billing;
- team / role management;
- enterprise SSO;
- advanced cohort analytics;
- full customization / white-label theme builder;
- public API;
- real-time 3D AR;
- automatic full-site crawler as a dependency.

---

## 15. Engineering Acceptance Criteria

The Sales Demo is complete when all are true:

1. D0-0 in the Store engineering foundation spec is complete.
2. A merchant-specific demo URL can be opened without developer intervention.
3. The demo contains 12-20 merchant frames with product metadata.
4. A shopper can upload one photo.
5. The system produces a personalized shortlist from merchant frames.
6. A shopper can select frames from the shortlist and generate try-on results.
7. A shopper can compare up to 4 merchant frames side by side.
8. A shopper can favorite / express interest in a frame.
9. A shopper can click through to a merchant product URL.
10. Merchant attribution persists across recommendation, try-on, compare, and intent events.
11. Merchant insight view shows sessions, try-ons, compares, intent signals, and top frames.
12. Merchant insight does not expose raw shopper face images by default.
13. No consumer credit prompt appears inside the merchant shopper workflow.
14. The demo can be run end-to-end during a 10-minute sales call on desktop and mobile web.
15. Gate A1 is complete before the URL is shared for independent non-team shopper use.

---

## 16. Commercial Acceptance Criteria

Engineering completion alone is not success.

After the demo is usable, Growth / Product should run outreach with the following first target:

| Metric | Target |
| --- | ---: |
| Qualified merchants contacted | 50+ |
| Replies | 10+ |
| Demo calls | 5-10 |
| Merchants requesting their own sample Store | 3+ |
| Paid / deposit-backed pilot | 1+ initially; target 3 within validation cycle |

A strong signal is a merchant asking to put its own frames into the demo or asking what is required to launch it for real shoppers.

---

## 17. Open Issues That Do Not Block D0

These are intentionally deferred and must not block Sales Demo engineering:

- exact merchant monthly pricing tier;
- Shopify public app packaging;
- full catalog sync strategy;
- widget vs hosted-link long-term default;
- transaction / affiliate revenue model;
- enterprise contracts;
- EHR/PMS integrations.

---

## 18. Change Log

| Date | Change |
| --- | --- |
| 2026-08-05 | Created engineering-ready Store Sales Demo spec and made AI-assisted merchant-catalog recommendation a required demo capability. |
| 2026-08-05 | Linked the mandatory engineering foundation, standardized `merchant_page_viewed`, and added D0-0 / external-traffic acceptance requirements. |
