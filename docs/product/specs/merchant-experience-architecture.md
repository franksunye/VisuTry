# VisuTry Merchant Experience Architecture

**Status:** v1 architecture baseline  
**Owner:** Product / Engineering / Growth  
**Created:** 2026-08-11  
**Related plan:** `docs/product/plans/pilot-delivery-factory-plan.md`  
**Related delivery spec:** `docs/product/specs/pilot-delivery-kit-spec.md`  
**Related implementation plan:** `docs/product/plans/visutry-store-implementation-plan.md`

---

## 1. Decision

VisuTry Store is upgraded from a Store-centric delivery model to a unified **Merchant → Catalog + Experiences** model.

The architecture must support both of these as first-class cases:

1. a merchant that only wants one persistent hosted Store with 8–50 frames; and
2. a merchant that runs multiple intent-, audience-, collection-, source-, or promotion-specific Campaigns from the same catalog.

The core rule is:

> **Store and Campaign are delivery modes of one shared commerce experience runtime, not separate product stacks.**

Externally, the product may continue to use the terms **Store** and **Campaign** because they are easier for merchants to understand. Internally, the shared domain concept is **Experience**.

---

## 2. Why this change is required now

The first reference Store / Delivery Factory work has already proven the basic merchant onboarding path:

```text
Merchant config
+ reviewed catalog
+ shared recommendation
+ Try-On
+ Compare
+ intent tracking
+ hosted route
```

The next sales-readiness problem is no longer only:

> Can VisuTry launch another merchant Store without bespoke engineering?

It is now also:

> Can the same merchant launch a second or third differentiated shopper journey from the same catalog without product code changes?

Before sales outreach, VisuTry must be able to answer clearly that:

- a merchant can have one simple persistent Store;
- a merchant can run multiple Campaigns;
- each Campaign can have a different catalog subset, message, offer, CTA, source context, and performance view;
- Store and Campaign reuse the same recommendation, Try-On, Compare, privacy, usage, attribution, and intent foundations.

This is a domain-model upgrade, not a full Campaign Builder project.

---

## 3. Domain model

```text
Merchant
│
├── Brand / Theme
│
├── Catalog
│   ├── MerchantFrame 1
│   ├── MerchantFrame 2
│   └── ...
│
└── Experiences
    ├── Store Experience
    ├── Campaign Experience A
    ├── Campaign Experience B
    └── Campaign Experience C
```

Recommended conceptual entities:

```text
Merchant
MerchantFrame
Experience
ExperienceFrameSelection
MerchantSession / ExperienceSession context
MerchantIntent
StoreEvent / CommerceEvent
```

The existing Store foundation should be extended rather than replaced wherever practical.

---

## 4. Ownership boundaries

### 4.1 Merchant owns identity and catalog

Merchant-level data answers:

> Who is this merchant and what does it sell?

Examples:

```text
merchant_id
merchant_slug
display_name
brand / theme
locale
merchant status
pilot / live provenance
```

Catalog belongs to the Merchant, not to a Campaign.

A `MerchantFrame` keeps stable merchant-scoped product identity across all experiences.

### 4.2 Experience owns shopper journey context

Experience-level data answers:

> What specific shopper journey is being delivered now?

Minimum conceptual fields:

```text
experience_id
merchant_id
type                STORE | CAMPAIGN
slug
name
status              DRAFT | ACTIVE | ENDED | ARCHIVED
headline?
description?
hero_asset?
catalog_scope
primary_cta
secondary_cta?
offer?
start_at?
end_at?
reference_data
```

Additional Campaign-only configuration may later include:

```text
audience
intent
source / channel context
promotion / coupon
collection context
campaign creative
```

Do not move merchant identity, product truth, or duplicated catalog rows into Experience configuration.

---

## 5. Store is a first-class Experience

A merchant that only wants a 20-frame Store remains fully supported.

Example:

```text
Merchant: Example Optical

Catalog:
  20 active frames

Experience:
  type: STORE
  slug: default
  persistent: true
  catalog_scope: selected 20 frames
  start_at: null
  end_at: null
  primary_cta: merchant product / catalog destination
```

The public URL may remain:

```text
/{locale}/store/{merchant-slug}
```

The merchant does not need to understand or configure Campaign concepts.

A Store must therefore never become a mandatory parent object for Campaigns.

---

## 6. Campaign is a sibling Experience, not a child of Store

Do **not** model the product as:

```text
Merchant → Store → Campaign
```

That incorrectly requires every Campaign customer to first own or configure a Store.

Use:

```text
Merchant
├── Store Experience (optional)
└── Campaign Experiences (0..n)
```

This supports all of the following without special cases:

- Store only;
- one Campaign only;
- Store + one Campaign;
- Store + many Campaigns;
- many Campaigns with no persistent Store surface.

Recommended Campaign route semantics may use a dedicated stable route such as:

```text
/{locale}/c/{merchant-slug}/{campaign-slug}
```

The exact public route can evolve, but it must map to the same shared shopper runtime.

---

## 7. Store vs Campaign behavior

| Dimension | Store | Campaign |
| --- | --- | --- |
| Primary purpose | Persistent merchant shopping surface | Intent / audience / collection / promotion-specific journey |
| Lifetime | Evergreen | Often time-bound, but may be long-lived |
| Catalog | Broad or curated | Usually a selected subset |
| Message | General merchant proposition | Campaign-specific headline / creative |
| Offer | Optional | Common / configurable |
| Source context | General | Important |
| CTA | General product / catalog / inquiry | Campaign-specific destination / coupon / inquiry / booking |
| Analytics | Overall merchant / Store performance | Campaign-specific performance |
| Runtime | Shared | Shared |

The difference is configuration and reporting context, not a separate recommendation or Try-On implementation.

---

## 8. Catalog selection contract

Catalog belongs to Merchant.

Experience selects from the Merchant catalog.

Correct:

```text
Merchant Catalog
├── Frame A
├── Frame B
├── Frame C
└── Frame D

Store        → A, B, C, D
Campaign 1   → A, C
Campaign 2   → B, C, D
```

Incorrect:

```text
Campaign 1 owns duplicate Frame A
Campaign 2 owns duplicate Frame A
Store owns another duplicate Frame A
```

This preserves:

- stable product identity;
- cross-campaign frame analytics;
- consistent product URLs and source facts;
- recommendation history;
- cleaner future inventory / commerce integration.

---

## 9. Session and attribution upgrade

The current MerchantSession / Store-event path should evolve so each shopper session can be associated with an Experience.

Conceptual context:

```text
merchant_id
experience_id
experience_type
source
medium?
campaign?
acquisition_surface?
referrer?
landing_url?
ai_agent_source?
reference_data
locale
device_type
```

For VisuTry-owned distribution, `source=visutry`, `medium=internal`, and a
whitelisted lowercase `acquisition_surface` (`home`, `discover`,
`face-analysis`, `face-shape`, `try-on`, `compare`, `style-explorer`, `seo`,
`dashboard`, or `other`) form the first-touch acquisition contract. This is
traffic context only; Merchant and Experience identity remains resolved
server-side from the public route. `acquisition_surface` is nullable so
historical sessions remain valid, and it is independent from `reference_data`.

All downstream events should retain the same context:

```text
recommendation
frame_selected
try_on_started
try_on_completed
compare_viewed
favorite_added
shortlist_saved
email_captured
coupon_claimed
product_clicked
inquiry_created
appointment_clicked
checkout / revenue later when available
```

Attribution must survive the full journey.

Reference / synthetic sessions must remain separable from future live merchant traffic.

---

## 10. Conversion action layer

The shopper journey should not end at Try-On or Save Selection.

Shared journey:

```text
Traffic
→ Experience Landing
→ Upload / Shopper Understanding
→ Recommendation
→ Frame Selection
→ Try-On
→ Compare / Shortlist
→ Intent Capture
→ Merchant Action
```

Merchant Action is configured by Experience and may include:

- Shop This Frame;
- View Product;
- View Collection;
- Get Offer / Coupon;
- Send My Shortlist;
- Ask About These Frames;
- Book Appointment;
- Visit Store;
- merchant-defined external destination within supported safe configuration.

`Favorite` / `Shortlist` is an intent signal, not necessarily the final conversion action.

Email capture should preferably appear as continuation value after useful shopper progress rather than as an early blocking form.

---

## 11. Admin information architecture

Recommended merchant-facing structure:

```text
Overview
Experiences
  ├── Store
  ├── Campaign A
  ├── Campaign B
  └── Campaign C
Catalog
Shoppers / Intent
Analytics
Settings
```

The UI may label `Experiences` as **Campaigns** plus a separate **Hosted Store** entry if that is clearer commercially. The internal domain model does not need to leak into the UI.

### Merchant Overview

Default scope:

```text
All Experiences
+ time range
```

Core metrics:

- Visitors / Sessions;
- Engaged Shoppers;
- Recommendation Rate;
- Try-On Rate;
- Compare Rate;
- Favorite / Shortlist Rate;
- Product Click Rate;
- Inquiry / Lead Rate;
- High-Intent Shoppers;
- Top Frames;
- source / channel mix;
- AI-agent traffic where reliably classified.

### Campaign / Experience list

At minimum support:

```text
name
status
type
start/end where applicable
visitors
try-ons
favorites / shortlist
product clicks
high-intent shoppers
conversion / intent rate
```

Support time filters and meaningful metric sorting before sales outreach if the demo depends on comparative campaign performance.

### Experience Performance

Each Campaign should have its own performance view:

```text
Traffic
→ Engagement
→ Decision
→ Intent
→ Commerce
```

Example stages:

```text
Visitors
→ Photo Upload
→ Recommendation
→ Frame Select
→ Try-On
→ Compare
→ Favorite / Shortlist
→ Email / Coupon
→ Product Click / Inquiry
→ Checkout / Revenue later
```

---

## 12. Delivery Factory implications

The Reference Pilot portfolio should now prove both merchant onboarding and repeated Experience creation.

Target portfolio:

> **5 Reference Brands / Merchants × 2–3 Experiences each = 10–15 Reference Experiences.**

Expected mix:

- approximately 5 persistent Store / brand experiences;
- approximately 5–10 intent-, collection-, fit-, fashion-, or campaign-specific experiences.

The exact count may vary by brand if a second Campaign adds no meaningful learning value.

Two factory north-star tests now apply:

### New Merchant Delivery

> A sixth normal eyewear merchant with 8–50 usable frames can be launched in <= 1 working day without product code changes.

### New Campaign Delivery

> An existing merchant can launch a new Campaign from its reviewed catalog in <= 1–2 hands-on hours without product code changes.

A Campaign should normally require only:

```text
select catalog subset
+ campaign copy / creative
+ optional offer
+ CTA configuration
+ attribution / dates
+ QA
+ publish
```

---

## 13. Reference portfolio working proposal

The existing five merchant archetypes remain useful, but each should test more than one shopper context.

| Brand | Persistent / broad experience | Campaign examples |
| --- | --- | --- |
| ello sunglasses | Petite-fit Store | Find Your Petite Fit; Summer Sunglasses / Best Frames for Small Faces |
| Lowercase NYC | Premium optical + sun Store | Optical Essentials; Sunglasses Collection |
| AKILA | Brand / style Store | Statement Frames; New Collection / Collaboration-led Campaign |
| Article One | Active eyewear Store | Find Your Fit; Beyond-VTO Decision Journey |
| Framed EWE | Multi-brand optical Store | Sunglasses Edit; Multi-brand Optical Selection |

These are reference hypotheses, not partnership claims or final campaign names.

The portfolio should maximize learning diversity, not merely reach an arbitrary campaign count.

---

## 14. Scope boundary for this upgrade

Build now:

- first-class Experience concept;
- `STORE | CAMPAIGN` type distinction;
- merchant-owned catalog + experience catalog selection;
- experience-aware session / attribution context;
- experience-level presentation / CTA configuration needed for reference demos;
- campaign list / performance information architecture;
- compatibility with existing Store route and workflow;
- Delivery Factory ability to produce multiple Experiences per merchant.

Do **not** build now unless required to unblock the reference portfolio:

- drag-and-drop landing-page builder;
- arbitrary page composition;
- generalized marketing automation;
- email campaign delivery system;
- CRM;
- public self-service Campaign Builder;
- Shopify OAuth / app-store integration;
- autonomous AI-agent checkout;
- duplicated recommendation or Try-On stack;
- merchant-specific component forks.

The design target is a **configuration-driven commerce experience system**, not a generic website builder.

---

## 15. Compatibility requirements

The architecture upgrade is acceptable only if:

1. the existing hosted Store experience can continue working;
2. a Store-only merchant remains simple to configure and explain;
3. existing MerchantFrame identity is preserved;
4. existing recommendation / Try-On / Compare logic is reused;
5. existing privacy and Consumer / Store isolation are preserved;
6. existing Store events can be migrated or extended without losing merchant attribution;
7. no Campaign-specific fork is introduced into the core generation pipeline;
8. reference data remains clearly distinguishable from live merchant data.

---

## 16. Acceptance criteria

This architecture is proven when all are true:

- one merchant can have at least two Experiences without duplicate catalog rows;
- one Experience can behave as a persistent 8–50 frame Store;
- one Experience can behave as a Campaign with a catalog subset and campaign-specific copy / CTA;
- shopper sessions and events are attributable to the correct Experience;
- Merchant Overview can aggregate across Experiences;
- Campaign Performance can isolate one Experience;
- a second Campaign for an existing merchant requires no product code change;
- the reference portfolio can be expanded to 10–15 Experiences without merchant-specific forks.

---

## 17. Product language

Use these externally where useful:

- **Hosted Store** — persistent merchant shopping experience.
- **Campaign** — targeted shopper journey for a particular audience, intent, collection, source, or promotion.
- **Campaign Engine** — the merchant product that creates and measures these targeted experiences.

Use this internally for architecture:

- **Experience** — shared domain/runtime abstraction for Store and Campaign.

Strategic summary:

> **Storefront remains an entry product. Campaign Engine expands merchant value. Both run on one shared Merchant Experience architecture.**
