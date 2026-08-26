# VisuTry Event Migration Plan v1.0

Status: Implementation Plan  
Owner: Product + Engineering  
Last updated: 2026-08-10

Related documents:

- `event-taxonomy.md`
- `current-event-audit.md`

## 1. Objective

Migrate VisuTry analytics from the current feature/UI-oriented vocabulary to a stable business-event contract that can serve both:

- current Consumer / GA4 funnel analysis, and
- future Store / Campaign Engine merchant reporting.

The migration must preserve semantic correctness and historical interpretability. It must not turn clicks into completions, failures into successes, or top-of-funnel detector actions into full Face Analysis outcomes.

---

## 2. Migration principles

### 2.1 Semantic migration, not string replacement

Every legacy event must be mapped by its actual trigger semantics.

Bad:

```text
face_shape_detector_cta_click -> face_analysis_started
```

because the CTA may lead to several destinations and the destination flow may never actually start.

Correct pattern:

```text
face_shape_detector_cta_click
    -> journey_continued

and later, when the destination truly begins:
    -> face_analysis_started / tryon_started / comparison_created / ...
```

### 2.2 Preserve GA4 standard ecommerce events

Do not rename GA4-standard ecommerce events simply to match the internal taxonomy.

Keep:

```text
begin_checkout
purchase
```

The Campaign Intelligence layer can attach campaign/merchant context to those events and derive business outcomes from them.

### 2.3 Version the schema

All canonical events should include:

```text
analytics_schema_version = 2
```

This creates an explicit cutover boundary because historical GA4 data cannot be renamed retroactively.

### 2.4 Prefer one canonical emission after cutover

A short validation period may dual-write selected legacy and canonical events if required, but long-running dual-write should be avoided because it increases event volume and creates double-counting risk.

Recommended approach:

```text
Development / staging:
legacy + canonical validation where needed

Production cutover:
canonical event becomes source of truth
legacy event retained only where an existing dashboard has a documented temporary dependency
```

### 2.5 Centralize migration logic

Canonical events must be emitted through `src/lib/analytics.ts` or a successor centralized analytics module. Do not add direct `gtag(...)` calls in feature components.

---

## 3. Canonical shared context v2

Extend the existing automatic attribution context with the following normalized fields when available:

```ts
type CampaignAnalyticsContext = {
  analytics_schema_version: 2

  // Existing acquisition context
  landing_page?: string
  page_path?: string
  acquisition_source?: string
  acquisition_medium?: string
  landing_locale?: string
  browser_language?: string
  source_page?: string
  query_cluster?: string
  content_cluster?: string
  product_path?: string

  // New campaign/business context
  campaign_id?: string
  campaign_name?: string
  campaign_content?: string
  entry_point?: 'consumer' | 'campaign' | 'store' | 'blog' | 'sdk' | 'unknown'
  merchant_id?: string
  store_id?: string
  surface?: 'web' | 'mobile_web' | 'pwa' | 'sdk' | 'merchant_store'
}
```

Rules:

- Do not manufacture `campaign_id`, `merchant_id`, or `store_id` when they do not exist.
- Preserve first-touch acquisition separately from internal journey continuation.
- `utm_campaign` may populate external campaign naming/context, but future B2B campaigns should use a stable VisuTry internal `campaign_id`.
- Do not send PII, image data, raw biometric geometry, or unrestricted free text in the common context.

---

## 4. Legacy-to-canonical migration matrix

### 4.1 Virtual Try-On

| Legacy event | Condition | Canonical event | Required migration notes |
|---|---|---|---|
| `try_on_start` | Request is actually launched | `tryon_started` | Preserve `try_on_type`; add campaign/product/frame context when available |
| `try_on_complete` | `success === true` | `tryon_completed` | Successful usable render only |
| `try_on_complete` | `success === false` | `tryon_failed` | Carry normalized `failure_reason` where available; current implementation may need failure reason added to method signature |
| `first_try_on` | First-ever try-on after signup | Keep legacy lifecycle event | Not a replacement for `tryon_started`/`tryon_completed` |

Implementation requirement:

Replace the current mixed-outcome method with separate typed methods:

```ts
trackTryOnStarted(...)
trackTryOnCompleted(...)
trackTryOnFailed(...)
```

Do not retain a canonical method called `trackTryOnComplete(..., success)`.

---

### 4.2 Frame Compare

| Legacy event | Condition | Canonical event | Required migration notes |
|---|---|---|---|
| `frame_compare_start` | Valid compare batch is launched | `comparison_created` | v1 definition: comparison becomes a real business object/process when generation begins |
| `frame_compare_complete` | Batch reaches terminal state | `comparison_completed` | Preserve requested/completed/failed counts and add `completion_status` |

Compute:

```text
completion_status = full
  when completed_count == frame_count

completion_status = partial
  when completed_count > 0 && failed_count > 0

completion_status = failed
  when completed_count == 0
```

Do not interpret existing `success: completed_count > 0` as a full-success metric.

Future preference events such as `frame_favorited` are additive and are not inferred from compare completion.

---

### 4.3 Full Face Analysis

| Legacy event | Canonical event | Notes |
|---|---|---|
| `face_analysis_start` | `face_analysis_started` | Trigger already reflects actual analysis activation |
| `face_analysis_upload` | `face_analysis_photo_uploaded` | Includes standard upload and restored detector handoff; add `photo_source` |
| `face_analysis_complete` | `face_analysis_completed` | Preserve normalized `face_shape`; prefer confidence band for GA4 if exact confidence is not analytically necessary |
| `face_analysis_failed` | `face_analysis_failed` | Normalize `failure_reason`; avoid arbitrary raw error strings as primary reporting dimension |
| `face_analysis_photo_handoff_restored` | Keep as operational transition event | Not a top-level merchant KPI |

Recommended `photo_source` values:

```text
upload
camera
template
detector_handoff
```

Recommended `failure_reason` values:

```text
no_face
multiple_faces
invalid_image
quality_too_low
processing_error
network_error
unknown
```

Operational error details may remain in logs; GA4 should receive the normalized reason.

---

### 4.4 Free Face Shape Detector

The detector remains a separate canonical acquisition stage.

| Legacy event | Canonical event | Notes |
|---|---|---|
| `face_shape_detector_upload` | `face_shape_photo_uploaded` | `analysis_mode=on_device_detector` optional |
| `face_shape_detector_start` | `face_shape_detection_started` | Actual detector execution starts |
| `face_shape_detector_complete` | `face_shape_detection_completed` | Preserve face shape and normalized quality band if useful |
| `face_shape_detector_failed` | `face_shape_detection_failed` | Normalize failure reason |
| `face_shape_detector_cta_click` | `journey_continued` | Preserve `destination`; **do not** fire downstream start at click time |
| `face_shape_detector_photo_handoff` | Keep as operational transition event | Useful for diagnosing handoff reliability |

Example:

```ts
trackEvent('journey_continued', {
  from_stage: 'face_shape_detection',
  destination: 'face_analysis',
  face_shape: 'oval',
})
```

Then, only after the user actually starts analysis:

```ts
trackEvent('face_analysis_started', {...})
```

---

### 4.5 Face Analysis continuation / recommendation

These events require semantic consolidation rather than blind renaming.

| Legacy event | v2 disposition | Rule |
|---|---|---|
| `face_analysis_frame_search` | Recommendation interaction / first-party detail | Do not send unrestricted search `query` to GA4 without explicit decision |
| `try_on_from_face_analysis` | `journey_continued` initially | It represents continuation intent; `tryon_started` should fire only when actual generation starts |
| `face_analysis_top_picks_start` | Candidate `recommendation_started` | Use if the product definition is “start personalized recommendations”; otherwise keep feature event until semantics are finalized |
| `face_analysis_top_picks_complete` | Candidate `recommendation_viewed` | Only emit when a recommendation result is actually rendered/available to shopper |
| `face_analysis_explore_more_styles_click` | `journey_continued` or recommendation-engagement event | Preserve source/destination semantics |

Before implementing the final recommendation mapping, Engineering should inspect the exact result-render lifecycle so `recommendation_viewed` does not fire merely because background generation finished while the result was never shown.

---

### 4.6 Content / SEO continuation

| Legacy event | Canonical event | Required context |
|---|---|---|
| `blog_funnel_click` | `journey_continued` | `entry_point=blog`, `source_page`, `destination`, `cta_location`, acquisition/growth context |

This allows SEO / Visual SEO / editorial pages to contribute to the same future Campaign Intelligence funnel without creating page-specific event languages.

---

### 4.7 Consumer monetization / ecommerce

#### Keep standard GA4 ecommerce events

```text
begin_checkout
purchase
```

Attach canonical shared attribution context to both.

#### Consolidate overlapping custom events

Current/observed vocabulary includes:

```text
view_pricing
click_purchase_button
click_upgrade_button
quota_exhausted_cta
paywall_view
credits_purchase_click
checkout_started
checkout_cancelled
checkout_completed
conversion_context_restored
original_action_resumed
face_analysis_unlock_click
face_analysis_unlock_success
face_analysis_top_picks_pricing_click
```

Target concepts should be explicitly separated:

```text
paywall_viewed
purchase_intent_clicked
begin_checkout             // GA4 standard: checkout really begins
purchase                   // GA4 standard: verified purchase
conversion_context_restored // operational
original_action_resumed     // operational / activation recovery
```

Do not emit both `checkout_started` and `begin_checkout` for the same semantic transition unless there is a documented reason.

Do not emit a canonical commerce-success event solely because a client-side success query parameter exists. Payment/purchase success should be based on a verified server-side outcome wherever available.

---

## 5. New canonical event registry for implementation phase 1

### Core business events

```text
face_shape_photo_uploaded
face_shape_detection_started
face_shape_detection_completed
face_shape_detection_failed

journey_continued

face_analysis_photo_uploaded
face_analysis_started
face_analysis_completed
face_analysis_failed

tryon_started
tryon_completed
tryon_failed

comparison_created
comparison_completed
```

### GA4 standard ecommerce events retained

```text
begin_checkout
purchase
```

### Phase 2+ events

```text
campaign_landed
campaign_engaged
recommendation_started
recommendation_viewed
recommended_frame_selected
frame_favorited
frame_unfavorited
purchase_intent_clicked
store_visit_requested
lead_created
commerce_outcome_recorded
```

Only implement Phase 2+ events when a real product trigger exists. Do not add synthetic placeholder events just to complete a theoretical funnel.

---

## 6. Analytics interface changes

### Current problem

The current API permits:

```ts
analytics.trackCustomEvent('arbitrary_name', arbitraryPayload)
```

This makes rapid product work easy but allows canonical event drift.

### Target architecture

Keep `trackCustomEvent` temporarily for legacy/operational analytics, but create a typed canonical registry.

Conceptual shape:

```ts
type CanonicalEventName =
  | 'face_shape_photo_uploaded'
  | 'face_shape_detection_started'
  | 'face_shape_detection_completed'
  | 'face_shape_detection_failed'
  | 'journey_continued'
  | 'face_analysis_photo_uploaded'
  | 'face_analysis_started'
  | 'face_analysis_completed'
  | 'face_analysis_failed'
  | 'tryon_started'
  | 'tryon_completed'
  | 'tryon_failed'
  | 'comparison_created'
  | 'comparison_completed'

function trackEvent<Name extends CanonicalEventName>(
  name: Name,
  properties: CanonicalEventProperties[Name],
) {
  // add shared context
  // validate/normalize values
  // send to GA4 + dataLayer + future first-party sink
}
```

Feature components should express business semantics rather than GA implementation details.

---

## 7. Campaign and merchant context propagation

### 7.1 Consumer sessions

For current 2C traffic, populate what is actually known:

```text
acquisition_source
acquisition_medium
landing_page
source_page
query_cluster
content_cluster
product_path
```

No fake merchant/campaign IDs.

### 7.2 Future Store / Campaign Engine

Campaign entry should establish an immutable/controlled context for the journey:

```text
campaign_id
campaign_name
merchant_id
store_id
entry_point=campaign|store
```

All downstream canonical events inherit it automatically.

### 7.3 AI assistant / agent traffic

Extend referrer normalization for known AI-assistant sources.

Desired normalized reporting:

```text
acquisition_source=chatgpt
acquisition_medium=ai_assistant
```

rather than:

```text
acquisition_source=chatgpt.com
acquisition_medium=referral
```

The same downstream canonical events must work identically regardless of source.

---

## 8. Cutover strategy

### Phase A — Code preparation

- add schema version/context types
- add canonical typed event methods
- do not remove legacy methods yet
- add automated tests for event name + payload semantics

### Phase B — Core flow validation

Validate the following on desktop and mobile:

```text
Free Detector
 -> continuation
 -> Face Analysis
 -> Try-On
 -> Compare
 -> Pricing / Checkout
```

Check:

- no duplicate canonical firing
- start events only fire when business action starts
- completion events only fire on real success/terminal condition
- failures are separated
- acquisition context survives internal navigation
- no PII/raw images/free-text leakage

### Phase C — Production cutover

Set:

```text
analytics_schema_version=2
```

for canonical events.

Update GA4 explorations/key-event configuration to consume v2 names.

### Phase D — Legacy retirement

Remove legacy events after:

- v2 data is validated in production
- required dashboards have migrated
- at least one complete reporting window is available

Record the final cutoff date in this document.

---

## 9. GA4 key-event migration

Recommended initial v2 key-event candidates:

```text
face_shape_detection_completed
face_analysis_completed
tryon_completed
comparison_completed
begin_checkout
purchase
```

Later, for Store / Campaign Engine:

```text
recommendation_viewed
purchase_intent_clicked
lead_created
```

Do not mark operational events such as handoff restored, paywall context restored, or failure diagnostics as key events.

---

## 10. Acceptance criteria

The migration is complete when:

1. Core journeys emit v2 canonical names with correct semantics.
2. Try-On success and failure are no longer combined under one canonical event.
3. Compare exposes `full | partial | failed` terminal state.
4. Free detector and full Face Analysis remain analytically distinguishable.
5. Cross-feature CTA clicks use `journey_continued`; they do not falsely count downstream starts.
6. `begin_checkout` and `purchase` remain GA4-standard ecommerce events.
7. Every canonical event automatically includes available acquisition/campaign context and `analytics_schema_version=2`.
8. AI-assistant traffic is normalized when reliably identifiable.
9. GA4 receives no PII, raw image data, raw biometric geometry, or uncontrolled high-cardinality payloads.
10. Existing legacy dashboards have a documented cutoff/migration path.

---

## 11. Engineering work packages

### Package 1 — Analytics core

- extend attribution/context model
- add schema version
- add typed canonical event registry
- normalize AI-assistant sources
- add unit tests

### Package 2 — Free Face Shape Detector

- migrate detector events
- add `journey_continued`
- retain handoff diagnostics as operational events

### Package 3 — Face Analysis

- migrate start/upload/complete/failure
- normalize photo source/failure reason
- review unlock success verification semantics

### Package 4 — Try-On

- replace mixed `try_on_complete(success)` with separate success/failure events
- preserve type/product context

### Package 5 — Compare

- migrate launch/terminal events
- add normalized completion status

### Package 6 — Monetization

- consolidate paywall vocabulary
- align custom checkout events with `begin_checkout` / verified `purchase`

### Package 7 — GA4 validation

- DebugView validation
- key-event update
- dashboard migration
- document production cutoff

---

## 12. Immediate next step

Engineering should now implement **Package 1 first**, then migrate the three highest-value paths in this order:

```text
1. Free Detector + Face Analysis
2. Virtual Try-On
3. Frame Compare
```

This order establishes the full acquisition-to-decision spine before merchant-specific campaign UI exists.