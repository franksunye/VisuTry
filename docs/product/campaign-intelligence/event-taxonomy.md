# VisuTry Product Analytics Event Taxonomy

**Status:** Active bounded semantic reference  
**Owner:** Product / Engineering / Growth  
**Last updated:** 2026-09-04  
**Runtime authority:** `src/lib/analytics-events.ts`  
**Cross-cutting authority:** `docs/project/observability-and-analytics-contract.md`

## 1. Purpose

This document explains the durable semantics of the current web product analytics event registry. It is intentionally smaller than the previous Campaign Intelligence v2 migration document.

**The TypeScript registry is authoritative for exact implemented event names and typed context.** This document must not invent planned events merely to complete a funnel or dashboard.

GA4/dataLayer consumes these events for aggregate product/acquisition analysis. Merchant Store/Campaign durable business truth is separately owned by PostgreSQL `MerchantSession`, `MerchantEvent`, and `MerchantIntent`.

## 2. Journey boundaries

### Standalone Consumer

```text
Acquisition
→ Face Shape / Face Analysis / Recommendation
→ Try-On
→ Compare
→ continuation / paid outcome
```

### Merchant Store/Campaign shopper

```text
Source
→ Store/Campaign
→ Product exploration
→ Recommendation / Try-On / Compare
→ Product Click / Inquiry / other supported Intent
```

The durable commerce path is **not** this GA4 taxonomy; it is the MerchantSession/Event/Intent model.

### VisuTry B2B acquisition / merchant activation

```text
Merchant prospect
→ B2B landing / sales intent
→ lead / onboarding
→ workspace / catalog / Store publish
→ billing / first commerce activity
```

Do not mix merchant prospects/operators with Store/Campaign shoppers.

## 3. Current registry groups

The following groups reflect `src/lib/analytics-events.ts` as of 2026-09-04. If code changes, code wins until this reference is updated.

### Shopper / Consumer decision events

```text
campaign_landed
campaign_engaged

face_analysis_started
face_analysis_photo_uploaded
face_analysis_completed
face_analysis_failed

face_shape_detection_started
face_shape_detection_completed
face_shape_detection_failed
face_shape_photo_uploaded

tryon_started
tryon_completed
tryon_failed
tryon_shared

recommendation_started
recommendation_viewed
comparison_created
comparison_completed
frame_favorited

purchase_intent_clicked
paywall_viewed
store_visit_requested
lead_created
journey_continued
```

These events describe aggregate product behavior where the runtime actually emits them. Their presence in the registry does not prove every surface currently emits every event.

### VisuTry B2B acquisition

```text
b2b_landing_viewed
b2b_sales_intent_clicked
b2b_lead_form_started
b2b_lead_created
```

These describe merchant prospects evaluating VisuTry. Never count them as Store/Campaign shopper conversion.

### Human merchant onboarding / activation

```text
merchant_onboarding_started
merchant_workspace_created
merchant_workspace_entered
merchant_catalog_workspace_entered
merchant_catalog_import_started
merchant_catalog_source_inspected
merchant_catalog_import_approved
merchant_catalog_import_completed
merchant_catalog_correction_saved
merchant_store_created
merchant_store_published
merchant_first_store_published
merchant_commercial_offer_viewed
merchant_checkout_started
merchant_checkout_returned
merchant_billing_activated
merchant_first_ai_commerce_session
merchant_first_intent
merchant_pilot_expired
merchant_subscription_cancelled
```

These support merchant funnel/UX analysis. Durable merchant/account/catalog/billing state remains in PostgreSQL.

## 4. Naming and semantic rules

Use stable business outcomes rather than UI implementation names.

Prefer:

```text
tryon_completed
comparison_completed
merchant_store_published
```

Avoid creating events such as:

```text
blue_button_clicked
modal_opened_v3
campaign_foo_frame_bar_clicked
```

Rules:

- lowercase snake_case;
- event names express a stable business/product action;
- page, campaign, merchant, locale or frame context belongs in parameters, not event names;
- started and completed/failed states are distinct when the distinction matters;
- do not emit an outcome before the outcome actually occurs;
- do not create events solely to make a dashboard funnel look complete.

## 5. Current common context

The current registry supports bounded common context including, where available:

```text
analytics_schema_version
landing_page
page_path
acquisition_source
acquisition_medium
referrer_host
landing_locale / site_locale / pricing_locale / checkout_locale
browser_language / browser_languages
geo_country / geo_region
source_page
query_cluster
content_cluster
product_path
campaign_id
campaign_name
merchant_id
store_id
consumer_funnel_id
traffic_class
surface
entry_point
actor_type
journey_type
source_journey
destination
landing_surface
intent_type
lead_type
user_intent
face_shape
frame_category
failure_reason
recommendation_count
```

This list is a runtime snapshot, not a requirement to populate every field on every event.

### Identifier rule

`campaign_id` is a stable internal identifier only when real internal campaign context exists. `utm_campaign` is a marketing label and must not be promoted into a fake internal campaign ID.

### Privacy rule

Do not send raw photos, biometric geometry, email addresses, full names, tokens, payment secrets or arbitrary user profiles as analytics parameters.

### Cardinality rule

Do not use GA4 custom dimensions as a mirror of the full event payload. High-cardinality identifiers, arbitrary URLs, arrays, full recommendation lists, raw errors and unrestricted free text belong outside GA4 custom dimensions.

## 6. Surface / actor caveat

The current TypeScript registry exposes narrower enums than the project-wide governance vocabulary. For example, current `AnalyticsActorType` is limited to shopper / merchant prospect / unknown.

The broader logical roles in `docs/project/observability-and-analytics-contract.md` are reporting/governance concepts. Do not expand production enums only to make names symmetrical; expand them when a real runtime/reporting requirement exists.

## 7. Consumer Traffic Ready evidence is separate

The first-party `consumer_funnel_event` endpoint is a bounded production evidence stream used by the Traffic Ready / Agent Distribution contract. It carries server-derived test/production-candidate classification plus a controlled set of attribution and journey fields.

It does not replace GA4 as the general Consumer product-analytics surface and it does not create a durable join to MerchantSession.

## 8. Merchant commerce events are separate

Store/Campaign shopper business reporting uses the durable merchant model. Current reporting recognizes supported merchant signals such as:

```text
merchant_recommendation_completed
merchant_frame_selected
merchant_tryon_started
merchant_tryon_completed
merchant_compare_started
merchant_product_clicked
merchant_inquiry_submitted
```

and durable intents such as `PRODUCT_CLICK`, `INQUIRY`, and `FAVORITE` where implemented.

These are not required to be duplicated as GA4 events for business truth.

## 9. GA4 key-event policy

Only mark real, useful outcomes as key events. Candidate outcomes may include successful completion, verified purchase, qualified lead, or other explicit conversion outcomes actually present in production.

Never mark the following merely to inflate conversion reporting:

```text
*_started
*_failed
internal/test/debug events
continuation-only events
```

The current GA4 operator state is maintained in `ga4-console-checklist.md`.

## 10. Change process

When adding or changing an event:

1. identify the owning journey and data plane;
2. prefer an existing event + bounded parameter over a new name;
3. update and test `src/lib/analytics-events.ts` or the relevant merchant runtime contract;
4. check GA4 cardinality and Axiom schema impact independently;
5. preserve Reference/Test/Internal exclusion semantics;
6. update this document only when durable semantics change;
7. update the Observability & Analytics Contract when the change affects data-plane ownership, attribution, provenance, schema governance or source-of-truth boundaries.

## Change log

| Date | Change |
| --- | --- |
| 2026-09-04 | Replaced the stale v2 RC / “Consumer as reference campaign” migration model with a bounded reference aligned to the current registry and durable MerchantSession/Event/Intent commerce model. Removed planned-but-unimplemented event names from the active contract. |
