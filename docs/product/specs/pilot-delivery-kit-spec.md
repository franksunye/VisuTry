# VisuTry Pilot Delivery Kit Specification

**Status:** v2 execution contract — Merchant + Experience delivery  
**Owner:** Product / Engineering / Growth  
**Created:** 2026-08-11  
**Updated:** 2026-08-11  
**Related plan:** `docs/product/plans/pilot-delivery-factory-plan.md`  
**Architecture baseline:** `docs/product/specs/merchant-experience-architecture.md`

---

## 1. Purpose

Define the minimum reusable configuration, data, QA and evidence contract required to:

1. launch a new VisuTry merchant reference Experience in 1–2 days without merchant-specific product forks; and
2. launch an additional Campaign for an existing merchant from the reviewed catalog in 1–2 hands-on hours without product code changes.

This remains an assisted-operations specification. It is not a self-service merchant onboarding or generalized Campaign Builder product.

---

## 2. Delivery package structure

Recommended operational package per merchant:

```text
pilot/<merchant-slug>/
├── merchant.json
├── catalog.csv
├── enrichment-review.csv
├── experiences/
│   ├── store.json
│   ├── <campaign-slug-a>.json
│   └── <campaign-slug-b>.json
├── qa-checklist.md
├── delivery-log.md
└── evidence/
```

A simple Store-only merchant may contain only one Experience config.

The repository does not have to store third-party copyrighted source images if the application can reference approved source URLs or controlled imported assets. Do not commit secrets or private shopper data.

---

## 3. Merchant configuration contract

Merchant configuration owns merchant identity, brand / theme defaults, catalog mode, locale and reference/live provenance.

Minimum configuration:

```json
{
  "merchantSlug": "example",
  "displayName": "Example Eyewear",
  "pilotType": "REFERENCE",
  "referenceData": true,
  "catalogMode": "CURATED",
  "defaultLocale": "en",
  "theme": {
    "logoUrl": null,
    "brandName": "Example Eyewear",
    "accentToken": "neutral"
  },
  "measurement": {
    "referenceTraffic": true,
    "defaultSource": "visutry-reference-pilot"
  }
}
```

Rules:

- `merchantSlug` must be stable and URL-safe.
- `pilotType=REFERENCE` identifies non-customer pilot simulations.
- Reference traffic must never be aggregated into future live merchant KPIs without an explicit filter.
- Theme configuration must remain within supported tokens; do not add merchant-only component forks.
- Merchant configuration must not contain duplicated Campaign-specific catalog rows or page composition.
- v1/v2 uses the shared Store capability set for recommendation, Try-On, Compare, and Intent; do not introduce separate merchant- or Campaign-specific generation stacks.

---

## 4. Experience configuration contract

Experience configuration owns the specific shopper journey context.

Minimum conceptual configuration:

```json
{
  "experienceSlug": "summer-sunglasses",
  "type": "CAMPAIGN",
  "name": "Summer Sunglasses",
  "status": "ACTIVE",
  "headline": "Find your summer frames",
  "description": null,
  "heroAsset": null,
  "catalogSelection": ["merchant-frame-id-1", "merchant-frame-id-2"],
  "primaryCta": {
    "type": "PRODUCT_OR_COLLECTION",
    "label": "Shop this frame"
  },
  "secondaryCta": null,
  "offer": null,
  "startAt": null,
  "endAt": null,
  "measurement": {
    "referenceTraffic": true,
    "defaultCampaign": "summer-sunglasses"
  }
}
```

Allowed `type` values for the current architecture:

```text
STORE
CAMPAIGN
```

Rules:

- Experience belongs to exactly one Merchant.
- Experience selects existing MerchantFrame identities; it does not own duplicated product truth.
- `STORE` may be evergreen, broad and persistent.
- `CAMPAIGN` may use a selected catalog subset, specific message / creative, offer, CTA, dates and source context.
- A merchant may have Store only, Campaign only, Store + Campaigns, or multiple Campaigns.
- Store is not a required parent for Campaign.
- Do not expose arbitrary component composition or drag-and-drop page building in this phase.

---

## 5. Catalog CSV contract

Required columns:

```text
external_id
name
brand
product_url
image_url
product_type
status
```

Strongly recommended:

```text
variant
color
price
currency
shape
material
lens_width_mm
bridge_width_mm
temple_length_mm
frame_width_mm
width_class
style_tags
collection_tags
source_notes
```

### Merchant/source facts

The following must come from public merchant data or other verified source data and must not be invented:

- name;
- brand;
- product URL;
- image URL;
- price / currency;
- color / variant;
- dimensions;
- material;
- availability / status;
- collection membership where explicit.

### AI / operator enrichment

The following may be enriched by AI or operator review:

- normalized shape;
- width class inferred from verified dimensions;
- style tags;
- occasion tags;
- visual weight;
- recommendation descriptors.

Every enriched value must be distinguishable from source facts in the import/review process.

---

## 6. Catalog acceptance criteria

A frame is delivery-ready when:

1. product identity is stable;
2. canonical public product URL resolves;
3. primary image clearly shows the frame and is suitable for the existing Try-On pipeline;
4. critical source facts are not fabricated;
5. duplicate variants are intentionally handled;
6. recommendation metadata has been reviewed;
7. frame belongs to the correct merchant tenant;
8. status is explicitly active/inactive.

Reject or defer frames with:

- unusable lifestyle-only imagery where the frame cannot be isolated reliably;
- broken product destination;
- ambiguous duplicate product identity;
- missing permission / legal clearance where imported assets would be republished publicly;
- facts that require guessing to make the product usable.

---

## 7. Curated catalog and Experience selection policy

For reference work, prefer a representative curated Merchant catalog over full-site ingestion.

Recommended Merchant catalog sizes:

- small niche brand: 6–12 core styles;
- DTC / premium brand: 12–24 frames;
- large brand: 16–30 representative frames;
- multi-brand retailer: 20–30 frames across 5–8 brands.

Selection should maximize diversity across:

- shape;
- apparent visual weight;
- color;
- use case;
- collection / brand where relevant;
- likely shopper recommendation outcomes.

An Experience may select a subset from this reviewed Merchant catalog.

Examples:

```text
Merchant catalog: 24 frames
Store Experience: 20 frames
Campaign A: 8 frames
Campaign B: 10 frames
```

Do not duplicate product rows to create Campaign subsets.

Do not import 100+ products merely to make the reference look large.

---

## 8. Recommendation review contract

Before publish, operator reviews:

- every active frame has a normalized shape where reasonably determinable;
- width metadata agrees with source dimensions where available;
- recommendation reasons do not make medical or guaranteed-fit claims;
- recommendation language is practical and merchant-specific;
- no recommendation points to an inactive / unavailable frame;
- the shortlist contains meaningful diversity rather than near-duplicate variants;
- recommendation only considers frames included in the current Experience catalog scope.

For niche fit brands, source sizing data should take precedence over visual inference.

---

## 9. Conversion action contract

The journey should not terminate at Try-On or Save Selection.

Shared sequence:

```text
Entry
→ Recommendation
→ Frame Selection
→ Try-On
→ Compare / Shortlist
→ Intent Capture
→ Merchant Action
```

Supported merchant action patterns may include:

- product click;
- collection click;
- external merchant website;
- inquiry;
- appointment / booking;
- coupon / offer claim;
- send / save shortlist;
- visit-store destination where configured.

`Favorite` / `Shortlist` is an intent signal. It is not automatically the final conversion action.

Email capture should preferably appear after useful shopper value is delivered, such as saving / sending a shortlist or claiming an offer, rather than as an early blocking requirement.

---

## 10. Reference traffic and synthetic data contract

Every simulated interaction used for sales evidence must be distinguishable from live traffic.

Required marker concept:

```text
reference_data = true
```

or an equivalent durable attribute at session/event level.

Reference traffic rules:

- must not be presented as real merchant shopper activity;
- may be used to demonstrate dashboards and funnel mechanics;
- should use realistic but synthetic shopper behavior;
- must not contain private real-person face data in merchant analytics;
- must be filterable from future live pilot analytics;
- must retain Merchant + Experience identity so Campaign performance demos do not mix synthetic sessions incorrectly.

If the current schema lacks a durable reference marker, use an explicit source/campaign convention temporarily and record this as a product gap. Do not silently rely on memory or analyst interpretation.

---

## 11. Route contract

### Store

Preferred semantic pattern:

```text
/{locale}/store/{merchant-slug}
```

A current Store route may remain unchanged and map internally to a `STORE` Experience.

### Campaign

Recommended semantic pattern:

```text
/{locale}/c/{merchant-slug}/{campaign-slug}
```

or another documented stable campaign route using the same runtime.

All Experience routes must:

- resolve directly or through an intentional documented redirect;
- identify the merchant correctly;
- identify the Experience correctly;
- load only the Experience-selected Merchant frames;
- preserve source / campaign parameters;
- support mobile and desktop;
- never expose Consumer credit purchase prompts;
- display the privacy boundary before shopper photo upload.

Do not introduce a separate app/router stack for Campaigns.

---

## 12. Session / attribution contract

Every shopper session should retain:

```text
merchant_id
experience_id
experience_type
source
medium?
campaign?
referrer?
landing_url?
ai_agent_source?
reference_data
locale
device_type
```

The same context must survive:

```text
recommendation
frame selection
Try-On
Compare
favorite / shortlist
email / coupon where applicable
product click
inquiry
appointment / external conversion action
```

UTM / campaign context is attribution, never authorization.

Raw face images and sensitive face-analysis payloads are not attribution data and must not be exposed in merchant analytics.

---

## 13. QA checklist

### Pre-publish static checks

- merchant config valid;
- Experience config valid;
- Experience belongs to correct merchant;
- all selected frame IDs exist in that merchant catalog;
- catalog row count within intended range;
- zero duplicate merchant/external identity conflicts;
- product URLs sampled and valid;
- primary image URLs sampled and valid;
- all active frames reviewed;
- reference marker configured.

### Shopper critical flow

Run at least once on desktop and one mobile viewport:

```text
Entry
→ Privacy accept
→ Session created
→ Photo upload
→ Recommendation
→ Select 1–4 frames
→ Try-On
→ Compare where >=2 successful results
→ Favorite / Shortlist
→ Merchant Action where configured
```

Acceptance:

- no application error;
- no tenant leakage;
- no cross-Experience catalog leakage;
- no consumer Credits prompt;
- source / campaign continuity retained;
- failed render handled without corrupting other results;
- canonical product destination remains attached;
- mobile controls remain usable without horizontal layout breakage.

### Merchant / insight checks

- merchant identity correct;
- Experience identity correct;
- reference activity appears;
- source / campaign visible where supported;
- Merchant Overview aggregation is coherent;
- Experience / Campaign Performance isolation is coherent;
- Try-On / Compare / favorite / click / inquiry counts are coherent;
- raw shopper face photo is not visible by default;
- reference/synthetic nature is identifiable.

---

## 14. Smoke requirement

At minimum, every published reference Experience route must be included in either:

1. a parameterized Experience smoke test; or
2. an operator-run smoke checklist until the number of references justifies automation.

Do not make routine smoke trigger AI generation.

Routine smoke should verify:

- route HTTP success;
- expected merchant identity;
- expected Experience identity;
- non-empty scoped catalog / shopper shell;
- no application/server error marker;
- intentional redirects only.

AI-dependent flow validation remains a separate controlled test because it has cost and external-provider flakiness.

---

## 15. Delivery log contract

For every new Merchant record:

```text
research_minutes
catalog_capture_minutes
catalog_cleanup_minutes
enrichment_review_minutes
merchant_configuration_minutes
qa_minutes
fix_minutes
total_hands_on_minutes
code_changes_count
manual_exceptions
reusable_product_gaps
```

For every additional Campaign record:

```text
campaign_definition_minutes
catalog_selection_minutes
copy_creative_minutes
cta_offer_configuration_minutes
qa_minutes
fix_minutes
total_campaign_hands_on_minutes
code_changes_count
manual_exceptions
reusable_product_gaps
```

A manual step becomes an automation candidate when:

- it appears in >=3 brands / Experiences; and
- it consumes meaningful time or creates repeatable defects.

Do not automate one-off friction prematurely.

---

## 16. Evidence pack specification

### Brand / Merchant evidence

1. Brand overview / archetype.
2. Reviewed catalog summary.
3. Persistent Store or broad Experience where useful.
4. Merchant Overview with clearly marked reference data.
5. Merchant setup time and exceptions.

### Campaign evidence

1. Branded Campaign entry.
2. Recommendation shortlist with reasons.
3. One successful Try-On result.
4. Compare board with 2–4 frames where feasible.
5. Merchant action / intent step.
6. Campaign Performance view with clearly marked reference activity.
7. Incremental Campaign setup time.

### Required metadata

```text
merchant archetype
merchant catalog size
experience type
experience catalog size
campaign / shopper use case
key differentiator demonstrated
implementation time
reference/simulation disclosure
```

### Sales usage rule

Sales may say:

> “This is a VisuTry reference experience built from the brand's public catalog to show how the commerce workflow would work.”

Sales must not say:

> “This brand is already a VisuTry customer/pilot”

unless a real relationship exists.

---

## 17. Reference brand expectations

### ello

- preserve petite-fit dimensions and verified sizing data;
- persistent Store may represent the broad petite-fit catalog;
- at least one Campaign should test fit / proportion intent;
- recommendation reasons should avoid guaranteed-fit claims.

### Lowercase

- select representative optical + sun frames;
- premium visual treatment must use shared theme primitives;
- use Experience subsets to test optical vs sun journeys;
- do not fork components to copy the merchant website exactly.

### AKILA

- emphasize style / collection tags;
- test Campaign / collection entry context;
- preserve limited-run / collaboration facts only when explicitly public;
- validate visually distinctive Compare results.

### Article One

- deliberately document existing VTO as the benchmark;
- reference Campaign must emphasize recommendation, Compare, source continuity and intent capture rather than claiming novelty in Try-On itself;
- use verified performance / fit facts carefully.

### Framed EWE

- preserve both retailer and underlying brand identity;
- each product click must return to the correct retailer product destination;
- Campaign subsets must not create duplicate product namespace;
- inquiry belongs to the retailer, not the underlying brand, unless configured otherwise.

---

## 18. Engineering escalation rule

During the reference portfolio sprint, a code change is justified only when one of these is true:

1. a normal merchant cannot be represented by current shared configuration;
2. a normal Store or Campaign cannot be represented by the shared Experience contract;
3. catalog identity / tenant / Experience isolation is unsafe;
4. critical shopper flow is broken;
5. measurement / reference-data separation is unreliable;
6. the same manual problem appears repeatedly and materially affects delivery time.

Visual preference, one-off merchant copy, one-off Campaign copy, and isolated catalog cleanup are not sufficient reasons to fork the platform.

---

## 19. Acceptance target for the factory

The Delivery Kit is validated when:

- five reference brands are represented;
- approximately 10–15 reference Experiences exist where each adds meaningful learning or sales value;
- all use the same Merchant / Catalog / Experience commerce core;
- merchant-specific code forks = 0;
- Campaign-specific runtime forks = 0;
- a clean sixth merchant can be onboarded in <=1 working day;
- an existing merchant can launch a new Campaign in <=1–2 hands-on hours;
- recurring manual pain is measured rather than guessed;
- Sales has standardized evidence for both Store-only and multi-Campaign merchant scenarios.
