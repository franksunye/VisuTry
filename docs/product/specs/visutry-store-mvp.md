# VisuTry Store MVP Spec

**Status:** D0 implemented / controlled validation; M1 approved scope and gated
**Owner:** Product / Engineering  
**Created:** 2026-07-08  
**Last updated:** 2026-08-06  
**Related plan:** `docs/product/product-plan.md`  
**Related sales demo:** `docs/product/specs/visutry-store-sales-demo.md`  
**Related implementation plan:** `docs/product/plans/visutry-store-implementation-plan.md`  
**Required engineering foundation:** `docs/product/specs/visutry-store-engineering-foundation.md`
**Related landing page:** `docs/product/specs/visutry-store-landing-page.md`  
**Related roadmap:** `docs/strategy/2026-05-25-b2b-commerce-commercialization-roadmap.md`
**Production verification:** `docs/ops/store-d0-production-verification-2026-08-05.md`

---

## 1. Product Decision

VisuTry Store is the merchant-facing commerce layer of VisuTry.

It should not be built as a generic virtual try-on plugin or a generic merchant website builder. Its core value proposition is:

> Help eyewear merchants turn qualified traffic into personalized frame discovery, try-on, comparison, measurable purchase intent, and ultimately more revenue.

The hosted merchant Storefront is the first delivery surface because it is the fastest surface to demo, sell, operate, and validate.

The broader product direction is:

> **Storefront is the delivery surface. AI Commerce / Campaign Engine is the business.**

The Store product is built on the existing VisuTry consumer intelligence and generation capabilities:

```text
Traffic / Audience
      ↓
Merchant Catalog
      ↓
AI Frame Intelligence
      ↓
Face / Shopper Understanding
      ↓
Personalized Recommendation
      ↓
Virtual Try-On
      ↓
Frame Compare
      ↓
Product / Inquiry Intent
      ↓
Conversion Insight
      ↓
Merchant Commerce System
```

Consumer remains the acquisition and proof layer. Store is the primary recurring-revenue engine to validate.

Store must be designed to accept both:

- **human traffic** — Search, Social, Ads, Email, QR, Direct, Referral;
- **AI-agent traffic** — ChatGPT, Claude, Perplexity, Gemini, and future shopping/search agents.

Agent-readiness is a product/data-contract direction now; a broad public agent API is not an M1 requirement.

---

## 2. Goal

Build the smallest reusable merchant product that can support the first 3-5 real merchant pilots and validate willingness to pay in the approximate USD 99-199/month range.

The first productized version is a hosted merchant Store, not a public app-store integration.

The implementation is split into:

- **D0 — Sales Demo:** working demo and sample Store used in merchant outreach;
- **M1 — Pilot MVP:** reusable merchant product for real traffic and first paid pilots.

M1 should preserve a future path toward:

```text
Merchant
→ Campaign / Audience / Intent
→ Catalog subset
→ AI decision experience
→ Conversion metrics
```

The first pilot does not require a generalized campaign-builder UI or a dedicated `Campaign` entity if one Store-wide experience is sufficient. Campaign concepts should be introduced only where they improve attribution or are required by real merchant use.

Detailed sequencing is defined in `docs/product/plans/visutry-store-implementation-plan.md`.

Current state as of 2026-08-05:

- D0 is implemented and production-verified for controlled, team-operated demonstrations.
- Merchant validation is active; own-frame sample requests and pilot commitments are the next evidence target.
- Gate A1 remains closed, so independent non-team shopper traffic is not approved.
- M1 engineering has not started and remains subject to Gate B or an explicit Product decision.

---

## 3. Commercial Validation Thesis

The commercial question is:

> Will an eyewear merchant pay VisuTry to route real traffic through a personalized decision experience and receive measurable recommendation, try-on, compare, product-intent, and conversion signals?

Success is not defined by merchants saying that virtual try-on is interesting.

The stronger validation signals are:

- merchant asks to load its own frames;
- merchant agrees to launch with real shopper traffic;
- merchant identifies one or more acquisition sources/campaigns it wants to send through VisuTry;
- merchant asks to connect product clicks, inquiries, add-to-cart, or revenue to the VisuTry journey;
- merchant is willing to pay or place a pilot deposit;
- merchant continues after observing real shopper behavior.

The first merchant conversation should therefore validate not only product comprehension but also:

- where traffic originates;
- which conversion KPI matters;
- whether merchant traffic can be routed through a hosted campaign/Store experience;
- whether AI-assistant / agent referrals are relevant to the merchant today or expected to become relevant.

---

## 4. Target Users

Primary early buyers:

- Shopify-native DTC eyewear brands;
- independent optical stores with online sales or pre-shop interest;
- small-to-mid eyewear ecommerce merchants;
- social-first eyewear sellers with an existing catalog;
- boutique ecommerce agencies serving eyewear merchants.

Preferred early merchant characteristics:

- 20-500 frame SKUs;
- usable product images already exist;
- owner / ecommerce / growth decision-maker is reachable;
- can test with a representative 8-50 frame subset;
- has identifiable traffic sources or campaigns that can be used in a pilot;
- does not require EHR/PMS or medical-grade fit claims to start.

Avoid as first customers:

- enterprise retailers requiring long procurement cycles;
- prescription-first clinical workflows;
- merchants requiring real-time inventory sync before testing;
- merchants demanding full custom white-label deployment;
- buyers requiring real-time 3D AR as a prerequisite.

---

## 5. Explicit Non-Goals

D0 and M1 do not include unless a pilot cannot proceed without them:

- public Shopify app listing;
- WooCommerce plugin;
- EHR/PMS integration;
- inventory quantity synchronization;
- medical-grade PD measurement;
- prescription or insurance workflows;
- full white-label theme builder;
- enterprise SSO;
- team RBAC;
- public API as the primary product;
- public agent API / autonomous checkout;
- generalized campaign builder / marketing automation suite;
- real-time 3D AR;
- advanced multi-touch attribution / BI;
- transaction take-rate implementation;
- large-scale automated catalog crawling.

These are later platform concerns, not first-pilot requirements.

---

## 6. MVP Product Shape

### 6.1 Merchant profile

Minimum merchant profile:

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

Merchant is a separate business entity from a consumer user account.

M1 should support merchant dashboard authentication using the existing account/auth foundation where practical.

### 6.2 Frame catalog

Start with a representative subset, not full inventory sync.

Minimum frame fields:

| Field | Required | Purpose |
| --- | --- | --- |
| `id` | Yes | Internal frame identifier. |
| `merchantId` | Yes | Catalog ownership. |
| `sku` | Preferred | Merchant reference and machine-readable product identity. |
| `name` | Yes | Shopper-facing display name. |
| `imageUrl` | Yes | Product / try-on source image. |
| `productUrl` | Preferred | Canonical product page / purchase destination. |
| `price` | Optional | Shopper and agent-readable commerce context. |
| `currency` | Optional | Price display. |
| `shape` | Yes after enrichment | Recommendation input. |
| `material` | Preferred | Recommendation / filtering input. |
| `color` | Preferred | Style input. |
| `widthClass` | Preferred | Narrow / medium / wide directional input. |
| `styleTags` | Preferred | Classic, minimal, bold, professional, etc. |
| `status` | Yes | Active / inactive. |

Where merchant source data provides them, M1 may also preserve brand, variant, availability, or collection metadata. Do not invent commerce facts that the merchant has not provided or that VisuTry cannot verify.

### 6.3 Catalog onboarding

Approved M1 priority:

1. CSV import;
2. manual/admin add and correction;
3. AI/rules enrichment of frame metadata;
4. review before activation;
5. URL-assisted import if it materially reduces pilot onboarding;
6. Shopify sync later, after repeated demand.

The first repeatable CSV format must support:

```text
name
sku
image_url
product_url
price
currency
```

VisuTry enriches:

```text
shape
material
color
width_class
style_tags
```

Do not require merchants to manually classify every frame before receiving value.

Catalog output should be useful to both the human shopper workflow and future machine-readable/agent discovery. This means product/frame identity and destination URLs should remain stable and explicit even if no public agent API exists.

### 6.4 Hosted shopper Store

Merchant-specific hosted route must support:

1. merchant branding and context;
2. privacy / retention notice;
3. shopper photo upload;
4. face understanding / recommendation;
5. merchant-only personalized shortlist;
6. select up to 4 frames;
7. virtual try-on;
8. side-by-side comparison;
9. favorite / interest;
10. product click;
11. optional lightweight inquiry.

The shopper flow is anonymous-first. Store MUST NOT require a VisuTry consumer login before the first useful recommendation/try-on flow.

Identity may be requested later only where it creates merchant/customer value, such as inquiry, save-for-later, cross-device continuation, appointment, checkout, or merchant-owned customer account integration.

No consumer Credits Pack prompt should appear inside a merchant-paid Store session.

### 6.5 AI-assisted recommendation

Recommendation is required in Store D0 and M1. It is a core differentiator, not an optional future enhancement.

Recommendation should reuse existing face-analysis / Glasses Advisor signals plus MerchantFrame metadata.

Minimum behavior:

- return 4-8 merchant frames;
- rank merchant frames, not generic presets;
- include a short human-readable reason per frame;
- tolerate incomplete metadata;
- allow merchant-selected frames to remain available even if not top-ranked.

The first version can use deterministic rules plus current AI-generated / enriched tags. It does not require a new training pipeline.

### 6.6 Virtual Try-On

Reuse the existing VisuTry generation pipeline.

Requirements:

- merchant frame images feed the same generation path;
- each task retains `merchantId`, `merchantSessionId`, and `merchantFrameId` when applicable;
- failures remain retryable;
- partial success is supported;
- Store usage is isolated from consumer credits.

### 6.7 Frame Compare

Reuse existing Frame Compare orchestration and result-state patterns.

Store-specific behavior:

- compare up to 4 merchant frames;
- keep product metadata attached to each result;
- allow shopper to remove or replace finalists;
- expose product and interest actions from compare results;
- record comparison and intent attribution.

### 6.8 Shopper intent

Minimum actions:

- `FAVORITE` / `INTEREST`;
- `PRODUCT_CLICK`.

M1 should also support lightweight `INQUIRY` unless pilot merchants do not need lead capture.

Inquiry minimum fields:

- email;
- optional name;
- optional note.

Appointment scheduling is out of scope for M1.

### 6.9 Merchant dashboard

M1 dashboard should remain intentionally small.

Required views:

- Overview;
- Frames;
- Shopper activity / intent;
- Usage.

Required metrics:

- Store sessions;
- photo uploads;
- recommendation completions;
- successful try-ons;
- failed try-ons;
- compare starts;
- favorites / interests;
- product clicks;
- inquiries;
- top frames;
- usage quota / render consumption.

When pilot volume supports it, the dashboard should also break the funnel down by acquisition source / campaign class, including AI-assistant / agent referral as a distinct source class where reliably identifiable.

Do not expose raw shopper face images by default.

### 6.10 Campaign-ready attribution baseline

M1 should preserve enough acquisition context to evolve from one hosted Store into a Campaign Engine without requiring a rewrite.

Minimum context where available:

```text
source
medium?
campaign?
referrer?
landing_url?
ai_agent_source?
locale
device_type
```

Rules:

1. A Store session should retain acquisition context from entry through recommendation, try-on, compare, and intent.
2. UTM or equivalent campaign parameters may be accepted for attribution but MUST NOT be trusted as authorization.
3. Known AI-assistant / agent referrals should be classified separately from generic referral traffic when detection is reliable.
4. Attribution must not include raw face images or sensitive analysis payloads.
5. M1 does not require multi-touch attribution; first-touch/session-level attribution is sufficient.
6. The data model should not require a dedicated `Campaign` record until merchant workflows need reusable campaign configuration.

### 6.11 Agent-ready commerce baseline

Store should be designed around four capabilities:

1. **Discoverable** — intended-public Store, merchant, campaign, and product/frame surfaces have stable crawlable URLs where appropriate.
2. **Understandable** — merchant/frame facts use consistent human-readable text and machine-readable metadata where appropriate.
3. **Actionable later** — recommendation, try-on, compare, and product-destination capabilities remain behind stable application/service contracts so future agent interfaces can reuse them.
4. **Measurable** — agent-originated sessions and downstream intent can be attributed.

M1 baseline should include where applicable:

- stable canonical merchant Store URL;
- stable product destination URLs;
- explicit merchant name and product/frame identity;
- structured product/frame metadata using appropriate web standards where the surface is public;
- price/currency/availability only when merchant-provided and current;
- descriptive frame attributes useful for matching shopper intent;
- source/referrer classification for AI-assistant traffic;
- no sensitive shopper data in public metadata.

M1 explicitly does **not** require:

- a public agent tool protocol;
- agent-specific recommendation logic;
- agent access to shopper photos;
- autonomous purchase execution.

Agent traffic must reuse the same Store intelligence and conversion core as human traffic.

---

## 7. Data Model

Use or evaluate the following entities. Exact names may follow current Prisma conventions.

### `Merchant`

Business identity and settings.

### `MerchantFrame`

Merchant-owned catalog record plus recommendation metadata.

### `MerchantSession`

Anonymous or identified shopper session scoped to a merchant.

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

Acquisition/campaign attribution may live on the session or in a normalized event/attribution record depending on implementation. It must remain merchant-scoped and privacy-safe.

### Merchant-attributed Try-On

Prefer extending the existing generation task model with optional attribution:

```text
merchantId?
merchantSessionId?
merchantFrameId?
```

Do not create a second generation task system unless technically necessary.

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

Intent should remain attributable back to the Store session and therefore to its acquisition/campaign context.

### `MerchantUsage`

May be materialized or calculated initially. Must allow merchant-level successful render and session tracking.

### Future `MerchantCampaign`

A first-class Campaign entity is optional and deferred until real merchant workflow requires multiple persistent campaign configurations.

If introduced later, it should represent business configuration such as:

```text
merchantId
name
slug?
audience_or_intent?
catalog_subset?
landing_copy_or_theme?
status
startAt?
endAt?
```

Do not create campaign-specific generation, session, or analytics stacks. Campaign must reuse the existing MerchantSession / Store event / Try-On core.

---

## 8. Event Model

Required Store shopper events:

| Event | Trigger |
| --- | --- |
| `merchant_page_viewed` | Merchant Store opened. |
| `merchant_photo_uploaded` | Shopper uploads photo. |
| `merchant_recommendation_started` | Recommendation begins. |
| `merchant_recommendation_completed` | Merchant shortlist returned. |
| `merchant_frame_selected` | Shopper selects frame. |
| `merchant_tryon_started` | Try-on begins. |
| `merchant_tryon_completed` | Try-on succeeds. |
| `merchant_tryon_failed` | Try-on fails. |
| `merchant_compare_started` | Shopper opens compare. |
| `merchant_favorite_saved` | Shopper expresses frame interest. |
| `merchant_product_clicked` | Shopper opens merchant product URL. |
| `merchant_inquiry_submitted` | Shopper submits lead. |

Required attribution where applicable:

```text
merchant_id
merchant_session_id
merchant_frame_id
source
medium?
campaign?
referrer?
ai_agent_source?
locale
device_type
```

Do not place raw image URLs or sensitive face-analysis payloads in general analytics events.

Landing-page marketing events remain defined in `docs/product/specs/visutry-store-landing-page.md`.

---

## 9. Merchant Usage and Packaging

Consumer credits are not the merchant billing concept.

Merchant usage should track:

- successful renders;
- failed renders;
- shopper sessions;
- active frames.

First pilots may be billed manually using Stripe invoice / payment link if that accelerates learning.

Working commercial hypothesis:

| Stage | Working offer |
| --- | --- |
| Sales demo | Free, no production traffic. |
| Sample Store | 8-20 merchant frames, assisted setup. |
| Founding pilot | Approx. USD 99/month or deposit-backed 30-day pilot. |
| Early paid Store | Approx. USD 99-199/month depending on usage / analytics. |

These are validation hypotheses, not finalized public pricing.

After merchant willingness-to-pay and attribution are proven, pricing may expand toward:

- higher merchant tiers;
- campaign or active-audience tiers;
- engaged-shopper / successful-render usage;
- premium conversion analytics;
- attributed transaction / affiliate / performance-linked revenue where evidence supports it.

Do not build complex merchant billing before pilot packaging is validated.

---

## 10. Privacy, Trust, and Claims

Required principles:

- shopper sees privacy / retention notice before photo upload;
- merchant does not receive raw shopper face images by default;
- merchant dashboard focuses on frame interest and conversion signals;
- shopper does not need a VisuTry consumer account for the anonymous Store journey;
- public/agent-readable surfaces contain merchant/product facts, not shopper biometric or sensitive analysis data;
- no medical diagnosis claims;
- no prescription claims;
- no guaranteed physical fit claims;
- no unvalidated PD accuracy claims;
- virtual try-on is visual decision support.

Store retention policy should use the existing storage/retention foundation where compatible, but merchant-specific policy must be explicit before M1 production traffic.

---

## 11. Reuse Requirements

Store must reuse existing VisuTry foundations wherever practical:

- photo validation;
- face-analysis signals;
- Glasses Advisor concepts;
- virtual glasses Try-On;
- Frame Compare;
- generation queue / task handling;
- image storage;
- authentication where merchant/admin identity requires it;
- analytics conventions;
- design system.

Store adds:

- merchant identity;
- merchant catalog;
- frame intelligence metadata;
- merchant ranking adapter;
- merchant session;
- merchant intent;
- merchant usage;
- merchant insights;
- source/campaign attribution;
- public merchant/product metadata suitable for search and agent discovery where appropriate.

Avoid parallel Store-specific generation infrastructure or agent-specific duplicate intelligence stacks.

---

## 12. M1 Functional Requirements

### Merchant provisioning

- create merchant without code changes;
- assign slug;
- upload logo / merchant metadata;
- set Store status;
- configure basic usage limit.

### Catalog

- import 8-50 frames through CSV or admin tool;
- edit frame metadata;
- deactivate frame;
- enrich tags;
- review enrichment before activation;
- preserve canonical product destination URLs and reliable commerce facts.

### Shopper workflow

- merchant Store opens mobile-first;
- shopper can enter anonymously;
- shopper uploads photo;
- shopper receives merchant-frame shortlist;
- shopper selects frames;
- shopper generates try-ons;
- shopper compares finalists;
- shopper favorites / clicks product / submits inquiry.

### Attribution

- Store session records available first-touch source / campaign context;
- recommendation, try-on, compare, and intent remain attributable to the session;
- known AI-assistant / agent source can be separated where reliably detected;
- campaign/referral parameters do not grant authorization.

### Merchant dashboard

- authenticated merchant can view own Store only;
- overview metrics;
- frames view;
- shopper intent activity;
- usage view;
- source/campaign funnel breakdown when volume supports it;
- no raw shopper photos by default.

### Agent-ready public surface

- public Store URL has stable merchant identity and descriptive content;
- public frame/product facts are explicit and machine-understandable where appropriate;
- canonical product destinations are preserved;
- no shopper-sensitive data is exposed for discoverability;
- no public agent action API is required for M1.

### Operations

- Store generation failures visible to internal operations;
- retry supported;
- merchant usage measurable;
- pilot can be enabled / disabled;
- catalog changes do not require deployment.

---

## 13. Acceptance Criteria

M1 is ready for a real paid pilot when all are true:

1. The mandatory Store engineering foundation remains compliant.
2. A merchant can be provisioned without application code changes.
3. 8-50 merchant frames can be onboarded through CSV or admin tooling.
4. AI-enriched frame metadata can be reviewed before going live.
5. Shopper Store works on mobile and desktop.
6. Shopper can enter the core Store journey without a mandatory VisuTry consumer login.
7. Shopper receives personalized recommendations from merchant frames.
8. Shopper can generate try-ons for selected merchant frames.
9. Shopper can compare up to 4 merchant frames.
10. Product click / favorite / inquiry is attributed to merchant + frame + session.
11. Session-level traffic source / campaign context is preserved where available.
12. Known AI-assistant / agent referral can be classified where technically reliable.
13. Merchant can authenticate and see its own basic dashboard.
14. Merchant usage is isolated from consumer credits.
15. Failed generation is observable and retryable.
16. Privacy notice and retention behavior are implemented.
17. Merchant does not see raw shopper face images by default.
18. Public merchant/product metadata does not expose shopper-sensitive data.
19. At least one pilot merchant completes end-to-end acceptance testing using its own catalog.
20. The workflow can be operated for 3-5 pilots without normal shopper usage requiring developer intervention.

---

## 14. Validation Metrics

Track the merchant shopper funnel:

```text
Traffic source / campaign
→ Store session
→ photo upload
→ recommendation viewed
→ frame selected
→ try-on completed
→ compare started
→ favorite / product click / inquiry
→ later: add-to-cart / checkout / revenue attribution
```

Key merchant metrics:

- sessions by acquisition source;
- upload rate;
- recommendation-to-try rate;
- compare rate;
- product click rate;
- favorite / inquiry rate;
- top-frame concentration;
- successful render cost per engaged shopper;
- high-intent shopper count;
- AI-assistant / agent-originated engagement when sample size supports it;
- merchant willingness to continue paying.

The strongest early business outcome is not try-on volume alone.

It is:

> Merchant routes real traffic through the Store, observes useful downstream purchase intent, and keeps paying.

---

## 15. Engineering Gates

### D0 Sales Demo

Implemented and production-verified for controlled demonstrations. Operate according to `visutry-store-sales-demo.md` and the D0 operator note; do not treat this as Gate A1 approval.

### M1 Pilot MVP

Proceed after the Gate B conditions in `visutry-store-implementation-plan.md` are met or Product explicitly approves operationalizing a live pilot.

M1 should include the minimum source/campaign attribution and agent-ready metadata baseline required by this spec, but should not expand into a generalized campaign platform.

### Shopify / platform integrations

Deferred until at least 3 active pilot merchants show repeated onboarding or integration demand.

### Public agent/action interfaces

Deferred until merchant or agent-channel evidence shows that machine action, not only discovery/referral, is needed.

---

## 16. Remaining Open Questions

These do not block D0 engineering and should be resolved through pilot evidence:

1. Is hosted Store link the long-term default, or primarily the first delivery surface for the Campaign Engine?
2. Which merchant KPI is most valuable: product click, add-to-cart, inquiry, appointment intent, conversion, or attributed revenue?
3. How much catalog metadata is required for recommendation quality at 50+ SKUs?
4. Should URL-assisted catalog import precede Shopify sync?
5. What monthly usage unit best fits pricing: successful renders, engaged sessions, active campaigns, or a blended tier?
6. When do merchants need multiple persistent campaign configurations rather than one Store-wide experience?
7. Which acquisition sources should be first-class in reporting: Search, Social, Paid, Email, QR, Direct, Referral, AI Assistant / Agent?
8. When does agent-readiness require a public action/API layer instead of high-quality public metadata and deep links?
9. Should transaction / affiliate / performance revenue become part of the model after SaaS and attribution are validated?

---

## 17. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created draft VisuTry Store MVP spec. |
| 2026-07-08 | Advanced to validation-ready and added validation package and engineering gates. |
| 2026-07-08 | Added Store landing page as the first validation asset. |
| 2026-08-05 | Reframed Store as AI merchant decision layer, made merchant-catalog recommendation mandatory, separated D0 Sales Demo from M1 Pilot MVP, defined assisted catalog onboarding, concrete data model, acceptance criteria, and engineering gates. |
| 2026-08-05 | Marked D0 implemented and production-verified for controlled merchant validation; kept Gate A1 closed and M1 subject to Gate B. |
| 2026-08-06 | Clarified Storefront as the first delivery surface and AI Commerce / Campaign Engine as the larger product direction; added anonymous-first shopper policy, source/campaign attribution baseline, Agent-Ready Commerce requirements, and conversion-oriented validation while keeping generalized campaign builder and public agent API out of M1 scope. |