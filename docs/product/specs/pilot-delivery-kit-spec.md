# VisuTry Pilot Delivery Kit Specification

**Status:** v1 execution contract  
**Owner:** Product / Engineering / Growth  
**Created:** 2026-08-11  
**Related plan:** `docs/product/plans/pilot-delivery-factory-plan.md`

---

## 1. Purpose

Define the minimum reusable configuration, data, QA and evidence contract required to launch a new VisuTry merchant reference pilot in 1–2 days without merchant-specific product forks.

This is an assisted-operations specification. It is not a self-service merchant onboarding product.

---

## 2. Pilot package structure

Recommended operational package per merchant:

```text
pilot/<merchant-slug>/
├── merchant.json
├── catalog.csv
├── enrichment-review.csv
├── qa-checklist.md
├── delivery-log.md
└── evidence/
```

The repository does not have to store third-party copyrighted source images if the application can reference approved source URLs or controlled imported assets. Do not commit secrets or private shopper data.

---

## 3. Merchant configuration contract

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
  "commerce": {
    "primaryIntent": "PRODUCT_CLICK",
    "inquiryEnabled": true
  },
  "experience": {
    "recommendationEnabled": true,
    "tryOnEnabled": true,
    "compareEnabled": true,
    "maxCompareFrames": 4
  },
  "measurement": {
    "referenceTraffic": true,
    "defaultSource": "visutry-reference-pilot",
    "defaultCampaign": "reference-pilot"
  }
}
```

Rules:

- `merchantSlug` must be stable and URL-safe.
- `pilotType=REFERENCE` identifies non-customer pilot simulations.
- Reference traffic must never be aggregated into future live merchant KPIs without an explicit filter.
- Theme configuration must remain within supported tokens; do not add merchant-only component forks.
- A pilot may disable inquiry if the merchant's public workflow has no appropriate inquiry destination.

---

## 4. Catalog CSV contract

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

Field rules:

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

## 5. Catalog acceptance criteria

A frame is pilot-ready when:

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

## 6. Curated catalog policy

For reference pilots, prefer a representative curated catalog over full-site ingestion.

Recommended sizes:

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

Do not import 100+ products merely to make the pilot look large.

---

## 7. Recommendation review contract

Before publish, operator reviews:

- every active frame has a normalized shape where reasonably determinable;
- width metadata agrees with source dimensions where available;
- recommendation reasons do not make medical or guaranteed-fit claims;
- recommendation language is practical and merchant-specific;
- no recommendation points to an inactive / unavailable frame;
- the shortlist contains meaningful diversity rather than near-duplicate variants.

For niche fit brands, source sizing data should take precedence over visual inference.

---

## 8. Reference traffic and synthetic data contract

Every simulated pilot interaction used for sales evidence must be distinguishable from live traffic.

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
- must be filterable from future live pilot analytics.

If the current schema lacks a durable reference marker, use an explicit source/campaign convention temporarily and record this as a product gap. Do not silently rely on memory or analyst interpretation.

---

## 9. Pilot route contract

Each pilot needs one stable hosted entry surface.

Preferred semantic pattern:

```text
/{locale}/store/{merchant-slug}
```

or the existing canonical Store route convention if different.

The route must:

- resolve directly or through an intentional documented redirect;
- identify the merchant correctly;
- load only merchant-scoped frames;
- preserve source / campaign parameters;
- support mobile and desktop;
- never expose Consumer credit purchase prompts;
- display the privacy boundary before shopper photo upload.

Do not introduce a separate app/router stack for reference pilots.

---

## 10. QA checklist

### Pre-publish static checks

- merchant config valid;
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
→ Favorite / Product Click / Inquiry where enabled
```

Acceptance:

- no application error;
- no tenant leakage;
- no consumer Credits prompt;
- source/campaign continuity retained;
- failed render handled without corrupting other results;
- canonical product destination remains attached;
- mobile controls remain usable without horizontal layout breakage.

### Merchant / insight checks

- merchant identity correct;
- reference activity appears;
- source / campaign visible where supported;
- Try-On / Compare / favorite / click / inquiry counts are coherent;
- raw shopper face photo is not visible by default;
- reference/synthetic nature is identifiable.

---

## 11. Smoke requirement

At minimum, every published reference pilot route must be included in either:

1. a parameterized pilot smoke test; or
2. an operator-run smoke checklist until the number of pilots justifies automation.

Do not make routine smoke trigger AI generation.

Routine smoke should verify:

- route HTTP success;
- expected merchant identity;
- non-empty catalog / shopper shell;
- no application/server error marker;
- intentional redirects only.

AI-dependent flow validation remains a separate controlled test because it has cost and external-provider flakiness.

---

## 12. Delivery log contract

For every pilot record:

```text
research_minutes
catalog_capture_minutes
catalog_cleanup_minutes
enrichment_review_minutes
configuration_minutes
qa_minutes
fix_minutes
total_hands_on_minutes
code_changes_count
manual_exceptions
reusable_product_gaps
```

A manual step becomes an automation candidate when:

- it appears in >=3 pilots; and
- it consumes meaningful time or creates repeatable defects.

Do not automate one-off friction prematurely.

---

## 13. Evidence pack specification

Each pilot produces the same compact sales artifact set.

### Required screenshots

1. Branded pilot entry.
2. Recommendation shortlist with reasons.
3. One successful Try-On result.
4. Compare board with 2–4 frames where feasible.
5. Merchant insight view with clearly marked reference activity.

### Required metadata

```text
merchant archetype
catalog size
pilot use case
key differentiator demonstrated
implementation time
reference/simulation disclosure
```

### Sales usage rule

Sales may say:

> “This is a VisuTry reference pilot built from the brand's public catalog to show how the commerce workflow would work.”

Sales must not say:

> “This brand is already a VisuTry customer/pilot”

unless a real relationship exists.

---

## 14. Pilot-specific configuration expectations

### ello

- focus on petite-fit dimensions and shape diversity;
- preserve verified size measurements;
- recommendation reasons should emphasize proportion/size guidance without guaranteed-fit claims;
- 6 core styles are sufficient for the first reference pilot.

### Lowercase

- select representative optical + sun frames;
- premium visual treatment must use shared theme primitives;
- preserve product-size dimensions and variant distinctions;
- do not fork components to copy the merchant website exactly.

### AKILA

- emphasize style / collection tags;
- test campaign/collection entry context;
- preserve limited-run / collaboration facts only when explicitly public;
- validate visually distinctive Compare results.

### Article One

- deliberately document existing VTO as the benchmark;
- demo must emphasize recommendation, Compare, source continuity and intent capture rather than claiming novelty in Try-On itself;
- use verified performance/fit facts carefully.

### Framed EWE

- preserve both retailer and underlying brand identity;
- each product click must return to the correct retailer product destination;
- recommendation should not collapse different brands into a single product namespace;
- inquiry belongs to the retailer, not the underlying brand, unless configured otherwise.

---

## 15. Engineering escalation rule

During the five-pilot sprint, a code change is justified only when one of these is true:

1. a normal merchant cannot be represented by current shared configuration;
2. catalog identity / tenant isolation is unsafe;
3. critical shopper flow is broken;
4. measurement / reference-data separation is unreliable;
5. the same manual problem appears repeatedly and materially affects delivery time.

Visual preference, one-off merchant copy, and isolated catalog cleanup are not sufficient reasons to fork the platform.

---

## 16. Acceptance target for the factory

The Pilot Delivery Kit is validated when:

- five reference pilots are complete;
- all five use the same Store / Commerce core;
- merchant-specific code forks = 0;
- a clean sixth merchant can be onboarded in <=1 working day;
- recurring manual pain is measured rather than guessed;
- sales has a standardized evidence pack for each merchant archetype.