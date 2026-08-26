# VisuTry Campaign Intelligence Event Taxonomy v2.0 RC

**Status:** Active source of truth; event contract frozen pending GA4 validation
**Owner:** Product / Engineering / Growth
**Last updated:** 2026-08-26

## 1. Purpose

VisuTry should treat every meaningful shopper interaction as a measurable interaction between a shopper and a commerce/campaign experience.

The immediate implementation surface is GA4, but this taxonomy is intentionally **not GA4-specific**. It is the shared behavioral data contract for:

- Consumer funnel analytics
- Store / Campaign analytics
- Merchant reporting
- Source and campaign attribution
- Shopper intent signals
- Future SDK event reporting
- Future AI-agent-originated commerce attribution

The strategic goal is to make the current 2C product produce structured behavioral and intent data that can directly support VisuTry's 2B Store / Campaign Engine.

> GA4 is the first event consumer. The taxonomy is the product data model.

### 1.1 VisuTry Consumer as the Reference Campaign

The current VisuTry 2C product should be treated as the **reference campaign** for the future Campaign Engine.

In the current stage:

```text
Brand = VisuTry
Campaign = VisuTry-owned acquisition / conversion experiences
Shopper = VisuTry consumer user
```

The consumer journey already exercises the same decision model that future merchant and brand campaigns will use:

```text
Traffic
  -> Face Understanding
  -> Recommendation
  -> Try-On
  -> Compare / Preference
  -> Purchase Intent
  -> Commerce Outcome
```

The purpose of the 2C product is therefore dual:

1. acquire and monetize consumer demand; and
2. continuously validate the shopper interaction model, event semantics, funnel definitions, attribution logic, and intent signals that will later power 2B campaigns.

When VisuTry expands to a merchant or eyewear brand, the underlying model does not change. The context changes:

```text
Today
Brand = VisuTry
Campaign = VisuTry reference campaign

Future
Brand = Merchant / Eyewear Brand
Campaign = Brand-specific campaign
```

The same canonical events should continue to describe shopper behavior:

```text
campaign_landed
  -> campaign_engaged
  -> face_analysis_completed
  -> recommendation_viewed
  -> tryon_completed
  -> comparison_completed
  -> purchase_intent_clicked
  -> lead_created / commerce outcome
```

This creates one unified model from 2C to 2B:

> **VisuTry Consumer is the reference campaign; Campaign Engine generalizes the same shopper intelligence model for every brand.**

The implication is important: the current consumer dataset is not a separate analytics universe. It is the first real-world dataset used to validate and improve the future Campaign Intelligence model.

### 1.2 Keep VisuTry B2B Acquisition Separate

The VisuTry `/store` marketing page is **not** part of the shopper campaign model above. Visitors there are merchant prospects evaluating VisuTry itself.

Therefore:

```text
VisuTry B2B acquisition
  -> b2b_landing_viewed
  -> b2b_sales_intent_clicked
  -> b2b_lead_form_started
  -> b2b_lead_created
```

must remain separate from:

```text
Merchant / Brand shopper campaign
  -> campaign_landed
  -> campaign_engaged
  -> shopper decision events
  -> purchase_intent_clicked
  -> lead_created
```

Do not mix the two funnels in Brand Dashboard or Campaign Engine metrics.

---

## 2. Design Principles

### 2.1 Business meaning over UI implementation

Event names should describe what the shopper did, not which component or button triggered it.

Prefer:

```text
face_analysis_started
tryon_completed
comparison_created
purchase_intent_clicked
```

Avoid:

```text
face_shape_detector_cta_click
upload_button_click
compare_btn_click
```

### 2.2 Stable names, extensible parameters

Do not create a new event name for every page, CTA, campaign, or frame type. Keep event names stable and express context through parameters.

### 2.3 Campaign-ready by default

Every business event should be attributable, where available, to:

- campaign
- acquisition source
- entry point
- product/frame
- merchant/store
- shopper session

### 2.4 Intent is progressive

The event model should support a measurable progression:

```text
Acquisition
  -> Discovery
  -> Recommendation
  -> Try-On
  -> Compare / Preference
  -> Purchase Intent
  -> Lead / Commerce Outcome
```

Not every shopper will traverse the full path. The taxonomy must still allow each stage to be analyzed independently.

### 2.5 Do not encode sensitive user data in analytics events

Do not send raw photos, email addresses, full names, or other directly identifying information to GA4 event parameters.

### 2.6 Keep stable identifiers separate from marketing labels

`campaign_id` is a stable internal VisuTry identifier and must only come from an explicit internal campaign context such as `?campaign_id=`.

`utm_campaign` is an external marketing label and maps to `campaign_name`.

Never manufacture `campaign_id` from `utm_campaign`.

### 2.7 Keep GA4 cardinality controlled

GA4 should contain dimensions that support aggregation and decision-making, not raw operational payloads.

Prefer normalized values and aggregates such as:

```text
recommendation_count
frame_category
style_intent
occasion
cta_location
intent_type
failure_reason
```

Avoid raw lists, arbitrary URLs, unrestricted free text, or raw error strings as primary analytics dimensions.

---

## 3. Naming Convention

Use:

```text
<object>_<action>
```

Examples:

```text
campaign_landed
face_analysis_started
recommendation_viewed
tryon_completed
frame_favorited
purchase_intent_clicked
lead_created
```

Rules:

- lowercase only
- snake_case
- past tense for completed outcomes where natural (`completed`, `created`, `viewed`)
- avoid UI words such as `button`, `modal`, `cta` unless the event specifically represents a generic UI interaction
- avoid embedding page names, merchant names, campaign IDs, frame IDs, or locale in the event name

---

## 4. Core Journey Model

### Stage A — Acquisition / Campaign Entry

#### `campaign_landed`

A shopper lands on a campaign-aware VisuTry experience.

Use when a shopper campaign context is available. This is distinct from GA4's automatic `page_view` and from VisuTry's own B2B `/store` acquisition funnel.

Recommended parameters:

```text
campaign_id
campaign_name
campaign_source
campaign_medium
campaign_content
landing_page
entry_point
merchant_id
store_id
```

#### `campaign_engaged`

A shopper reaches the first meaningful engagement threshold for a campaign experience.

Recommended trigger rule for v2: fire once per campaign session when any of the following occurs:

- a primary campaign action is taken, or
- the shopper starts face analysis / recommendation / try-on, or
- another explicitly defined meaningful interaction occurs.

Do not use scrolling alone as the canonical business definition unless the product team explicitly chooses it.

Recommended parameters:

```text
campaign_id
campaign_name
entry_point
merchant_id
store_id
engagement_type
```

---

### Stage B — Face / Shopper Understanding

#### `face_shape_detection_started`

The shopper starts the lightweight/on-device face-shape detector.

Recommended parameters:

```text
campaign_id
entry_point
analysis_mode
merchant_id
store_id
```

#### `face_shape_photo_uploaded`

A photo has been successfully supplied to the lightweight face-shape detector.

Recommended parameters:

```text
campaign_id
entry_point
analysis_mode
photo_source
merchant_id
store_id
```

#### `face_shape_detection_completed`

The lightweight detector produces a usable face-shape result.

Recommended parameters:

```text
campaign_id
entry_point
face_shape
analysis_mode
merchant_id
store_id
```

#### `face_shape_detection_failed`

The lightweight detector cannot produce a usable result.

Recommended parameters:

```text
campaign_id
entry_point
failure_reason
analysis_mode
merchant_id
store_id
```

#### `journey_continued`

The shopper explicitly chooses to continue from one journey stage to another.

For example, a CTA from the free detector to Face Analysis emits `journey_continued`; it must **not** be counted as `face_analysis_started` until the Face Analysis flow actually begins.

Recommended parameters:

```text
campaign_id
source_journey
destination
face_shape
entry_point
merchant_id
store_id
```

#### `face_analysis_started`

The shopper begins the full face-analysis flow.

Recommended parameters:

```text
campaign_id
entry_point
merchant_id
store_id
```

#### `face_analysis_photo_uploaded`

A photo has been successfully supplied to the full face-analysis flow.

Recommended parameters:

```text
campaign_id
entry_point
photo_source
merchant_id
store_id
```

`photo_source` examples:

```text
upload
camera
template
detector_handoff
```

#### `face_analysis_completed`

A usable face-analysis result is produced.

Recommended parameters:

```text
campaign_id
entry_point
face_shape
confidence_band
merchant_id
store_id
```

Do not send raw biometric geometry or image data to GA4.

#### `face_analysis_failed`

The analysis cannot produce a usable result.

Recommended parameters:

```text
campaign_id
entry_point
failure_reason
merchant_id
store_id
```

Normalized `failure_reason` values:

```text
no_face
multiple_faces
invalid_image
quality_too_low
processing_error
network_error
quota
timeout
unknown
```

This event is operationally important because failures directly affect campaign engagement and downstream conversion.

---

### Stage C — Recommendation

#### `recommendation_started`

The shopper starts a personalized frame recommendation flow.

Recommended parameters:

```text
campaign_id
entry_point
face_shape
merchant_id
store_id
catalog_scope_id
```

#### `recommendation_viewed`

A recommendation result is successfully shown to the shopper.

Recommended parameters:

```text
campaign_id
face_shape
recommendation_count
catalog_scope_id
merchant_id
store_id
```

Optional product-level detail should be sent only if cardinality is controlled. Prefer storing detailed recommendation lists in the application analytics/data warehouse rather than GA4.

#### `recommended_frame_selected`

The shopper selects a frame from a recommendation result.

Recommended parameters:

```text
campaign_id
frame_id
product_id
frame_shape
frame_style
brand
merchant_id
store_id
selection_rank
```

---

### Stage D — Virtual Try-On

#### `tryon_started`

The shopper starts a virtual try-on for a specific frame/product.

Recommended parameters:

```text
campaign_id
frame_id
product_id
brand
frame_shape
frame_style
entry_point
merchant_id
store_id
```

#### `tryon_completed`

A usable try-on result is produced and shown.

Recommended parameters:

```text
campaign_id
frame_id
product_id
brand
frame_shape
frame_style
merchant_id
store_id
render_mode
```

#### `tryon_failed`

A try-on cannot be completed.

Recommended parameters:

```text
campaign_id
frame_id
product_id
merchant_id
store_id
failure_reason
render_mode
```

#### `tryon_shared`

A shopper initiates sharing of a try-on result.

Recommended parameters:

```text
campaign_id
frame_id
product_id
share_channel
merchant_id
store_id
```

#### `tryon_saved`

A shopper saves/downloads a try-on result where that capability exists.

Recommended parameters:

```text
campaign_id
frame_id
product_id
merchant_id
store_id
```

---

### Stage E — Compare / Preference

#### `comparison_created`

The shopper creates or enters a meaningful multi-frame comparison state.

Recommended parameters:

```text
campaign_id
comparison_size
merchant_id
store_id
```

Do not place a long list of frame IDs into GA4. Store detailed comparison composition in first-party product analytics if required.

#### `comparison_completed`

The shopper reaches the completion/decision point of a comparison flow.

Recommended parameters:

```text
campaign_id
comparison_size
completion_status
selected_frame_id
selected_product_id
merchant_id
store_id
```

`completion_status` should distinguish:

```text
full
partial
failed
```

#### `frame_favorited`

The shopper explicitly marks a frame as preferred/favorite.

Recommended parameters:

```text
campaign_id
frame_id
product_id
brand
frame_shape
frame_style
merchant_id
store_id
```

#### `frame_unfavorited`

The shopper removes a favorite/preference signal.

Use the same product/frame parameters as `frame_favorited`.

---

### Stage F — Purchase / Lead Intent

#### `purchase_intent_clicked`

The shopper clicks a commerce-oriented action that indicates movement toward purchase.

Examples:

- View product
- Buy now
- Shop this frame
- Continue to merchant

Recommended parameters:

```text
campaign_id
intent_type
frame_id
product_id
brand
merchant_id
store_id
destination_type
```

Initial `intent_type` values:

```text
product_click
buy_now
merchant_click
checkout
```

#### `store_visit_requested`

The shopper explicitly requests or initiates an offline/store-visit path.

Recommended parameters:

```text
campaign_id
merchant_id
store_id
frame_id
product_id
request_type
```

#### `lead_created`

A qualified shopper/merchant-campaign lead is created.

Recommended parameters:

```text
campaign_id
merchant_id
store_id
lead_type
frame_id
product_id
```

Do not send lead PII to GA4.

#### `commerce_outcome_recorded`

Reserved for first-party or merchant-integrated commerce outcomes when reliable attribution exists.

Recommended parameters:

```text
campaign_id
merchant_id
store_id
outcome_type
order_id_hash
currency
value
```

Initial `outcome_type` values may include:

```text
add_to_cart
checkout_started
purchase
appointment
qualified_lead
```

For GA4 native ecommerce measurement, continue to support the standard GA4 ecommerce events where appropriate. This business event is primarily the cross-system campaign contract and should not replace GA4-required ecommerce semantics without an explicit implementation decision.

---

## 5. Common Event Parameters

The following parameters form the shared attribution context. Populate them when available; do not manufacture placeholder values.

| Parameter | Meaning |
|---|---|
| `campaign_id` | Stable internal VisuTry campaign identifier; explicit internal context only |
| `campaign_name` | External/human-readable marketing label; `utm_campaign` maps here |
| `campaign_source` | Acquisition source, e.g. google, meta, chatgpt, email |
| `campaign_medium` | Acquisition medium, e.g. organic, paid_social, referral, ai_assistant |
| `campaign_content` | Creative/content variant when available |
| `entry_point` | Where the interaction started: consumer, store, campaign, blog, sdk, b2b, etc. |
| `merchant_id` | Stable internal merchant identifier |
| `store_id` | Stable store/storefront identifier |
| `product_id` | Merchant/product identifier when available |
| `frame_id` | VisuTry frame/catalog identifier when available |
| `brand` | Product/frame brand if available |
| `frame_shape` | Normalized frame-shape taxonomy |
| `frame_style` | Normalized style taxonomy |
| `face_shape` | Normalized shopper face-shape result |
| `locale` | Product locale when useful for analysis |
| `surface` | web, mobile_web, pwa, sdk, merchant_store, etc. |
| `actor_type` | Shopper vs merchant prospect when the distinction is material |
| `journey_type` | Shopper campaign vs VisuTry B2B acquisition vs consumer organic |
| `analytics_schema_version` | Event-contract version for reporting and migration |

### High-cardinality rule

GA4 should not become the primary storage layer for highly detailed product/session payloads.

Use GA4 for aggregated behavioral analysis and campaign attribution. Store detailed objects such as:

- complete recommendation lists
- comparison frame arrays
- full shopper preference profiles
- raw inference payloads
- raw image analysis output
- unrestricted URLs
- raw error strings

in first-party application storage / analytics infrastructure.

---

## 6. GA4 Automatic Events

Keep GA4 automatic/system events as-is. Do not rename them to fit the business taxonomy.

Examples:

```text
page_view
first_visit
session_start
user_engagement
```

They answer platform-level traffic/session questions and coexist with the business event taxonomy.

---

## 7. Current-to-Canonical Event Migration

Current implemented baseline:

| Legacy / implementation-oriented event | Canonical event |
|---|---|
| `face_shape_detector_start` | `face_shape_detection_started` |
| `face_shape_detector_upload` | `face_shape_photo_uploaded` |
| `face_shape_detector_complete` | `face_shape_detection_completed` |
| `face_shape_detector_failed` | `face_shape_detection_failed` |
| `face_shape_detector_cta_click` | `journey_continued` |
| `face_analysis_start` | `face_analysis_started` |
| `face_analysis_upload` | `face_analysis_photo_uploaded` |
| `face_analysis_complete` | `face_analysis_completed` |
| `try_on_start` | `tryon_started` |
| `try_on_complete(success=true)` | `tryon_completed` |
| `try_on_complete(success=false)` | `tryon_failed` |
| `frame_compare_start` | `comparison_created` |
| `frame_compare_complete` | `comparison_completed` |

Important: a continuation click and a downstream business start are not equivalent. `journey_continued` records intent to move; the destination flow owns its own `*_started` event.

P0–P3 engineering migration is complete. Legacy method names may remain as facade APIs where useful, but canonical event emissions are the reporting contract.

---

## 8. Recommended GA4 Key Events

Do not mark every event as a GA4 key event.

Primary candidates:

```text
tryon_completed
comparison_completed
purchase_intent_clicked
lead_created
```

Optional secondary candidates depending on campaign objective:

```text
face_analysis_completed
face_shape_detection_completed
```

Keep GA4 ecommerce standards independently where applicable:

```text
begin_checkout
purchase
```

Do not mark operational or progression-only events such as `*_failed`, `journey_continued`, `paywall_viewed`, or handoff reliability events as key events.

Final GA4 configuration remains pending until GA4 has observed the canonical events/parameters and DebugView validation is complete.

---

## 9. Campaign Funnel Definitions

### Activation Funnel

```text
campaign_landed
  -> campaign_engaged
  -> face_shape_detection_started / face_analysis_started / recommendation_started / tryon_started
```

### Decision Funnel

```text
face_analysis_completed / face_shape_detection_completed
  -> recommendation_viewed
  -> tryon_completed
  -> comparison_created
  -> comparison_completed
```

### Commerce Intent Funnel

```text
recommendation_viewed / tryon_completed / comparison_completed
  -> frame_favorited
  -> purchase_intent_clicked
  -> lead_created / commerce_outcome_recorded
```

These funnels are shared between the VisuTry reference campaign and future merchant/brand campaigns.

### VisuTry B2B Acquisition Funnel — Separate Model

```text
b2b_landing_viewed
  -> b2b_sales_intent_clicked
  -> b2b_lead_form_started
  -> b2b_lead_created
```

This funnel measures VisuTry selling its B2B product to merchants. It must not be included in shopper Campaign Engine metrics.

---

## 10. Merchant / Campaign Metrics Derived from Events

The taxonomy should support the following B2B metrics without inventing a separate merchant-only shopper event language:

- Campaign Visitors
- Engaged Shoppers
- Face Analysis Completion Rate
- Recommendation Rate
- Try-On Start Rate
- Try-On Completion Rate
- Compare Rate
- Favorite / Preference Rate
- Product Click Rate
- Lead Rate
- High-Intent Shopper Rate
- Commerce Outcome Rate
- Source / Campaign attribution
- AI-assistant / agent-originated engagement and intent

This is the core principle behind the taxonomy:

> Consumer interaction data should compound into merchant-facing campaign intelligence.

The VisuTry reference campaign validates these metrics first. Future brand campaigns should reuse the same definitions so that performance is comparable across campaigns without changing the underlying event language.

---

## 11. AI-Agent / Assistant Attribution

VisuTry should preserve AI-originated traffic as a first-class acquisition dimension rather than collapsing it into generic referral traffic.

Recommended normalized values where detectable:

```text
campaign_medium = ai_assistant
campaign_source = chatgpt | gemini | claude | perplexity | other_ai
```

The same downstream events (`recommendation_viewed`, `tryon_completed`, `purchase_intent_clicked`, etc.) must work identically regardless of whether the shopper originated from human search/social traffic or an AI assistant/agent.

This allows future Store reporting to compare:

```text
Search Traffic -> Intent
Social Traffic -> Intent
Paid Traffic -> Intent
AI Assistant / Agent Traffic -> Intent
```

---

## 12. Implementation Requirements

Engineering should implement the taxonomy through a centralized analytics interface rather than scattering direct GA calls across UI components.

Current logical architecture:

```text
Feature Component
  -> analytics.ts
  -> analytics-v2.ts
  -> GA4 + dataLayer
```

The implementation layer should be responsible for:

- validating allowed event names
- attaching shared attribution context
- attaching campaign / merchant context
- normalizing enum values
- forwarding events to GA4
- supporting future first-party analytics sinks
- preventing PII/raw-photo payloads from being sent

The application code should express business intent rather than embedding GA4 implementation details into the feature.

---

## 13. Rollout / Freeze Plan

### Phase 1 — Inventory

Complete.

### Phase 2 — Canonical mapping

Complete.

### Phase 3 — Implement core journey

Complete for current Face Analysis, Face Shape Detector, Recommendation/Style Explorer, Try-On, Compare, Paywall/Intent, and Store/B2B acquisition coverage.

### Phase 4 — Validate

Pending GA4 observation and DebugView validation:

- no duplicate firing
- no missing completion events
- campaign context survives through the journey
- `campaign_id` and `campaign_name` remain semantically separate
- merchant/product/frame context is correct
- B2B acquisition is excluded from shopper campaign metrics
- mobile and desktop behavior is consistent
- cardinality remains controlled

### Phase 5 — Freeze v2.0

After GA4 custom dimensions, key events, saved explorations, and DebugView validation are complete, mark this taxonomy:

```text
Campaign Intelligence Event Model v2.0 — Frozen
```

After freeze, prefer additive parameters or explicitly reviewed new business events. Avoid renaming established canonical events without a schema-version migration.

---

## 14. Open Decisions

The remaining decisions are intentionally downstream of the core event-model implementation:

1. Final GA4 custom-dimension registration after canonical parameters appear in GA4.
2. Final GA4 key-event configuration after baseline funnel data is available.
3. Definition of `high-intent shopper` as a derived metric rather than a manually fired event.
4. Which detailed frame/recommendation payloads belong in first-party analytics rather than GA4.
5. First-party analytics/warehouse design for Merchant Dashboard and Campaign Engine.

---

## 15. Strategic Context

VisuTry's consumer journey is not only a 2C conversion funnel. It is the **reference implementation and data-producing layer** for the Store / Campaign Engine.

Today, VisuTry itself plays the role of the first brand and its owned consumer experiences play the role of the first reference campaigns. The purpose is not to pretend that every organic consumer session has a merchant `campaign_id`; rather, it is to validate the same shopper decision model under real traffic.

The shared model is:

```text
Human + AI-Agent Traffic
        -> Brand / Campaign Experience
        -> Face Understanding
        -> Recommendation
        -> Try-On
        -> Compare / Preference
        -> Purchase Intent
        -> Commerce Outcome
```

At the current stage:

```text
VisuTry Brand
  -> VisuTry reference campaign / consumer experience
  -> real shopper interactions
  -> validated funnel + intent data
```

At the future 2B stage:

```text
Brand A / Merchant A
  -> Campaign A1 / A2 / A3
  -> the same shopper interaction model
  -> brand-specific Campaign Intelligence

Brand B / Merchant B
  -> Campaign B1 / B2 / B3
  -> the same shopper interaction model
  -> brand-specific Campaign Intelligence
```

Therefore the 2C-to-2B transition is not a change of analytics model. It is a change of **brand, campaign, merchant, catalog, and distribution context around the same shopper decision model**.

This is the architectural and business reason the taxonomy should remain unified:

> **VisuTry Consumer is the reference campaign; Campaign Engine generalizes the same shopper intelligence model for every brand.**

As VisuTry's own consumer data accumulates, it improves the definition of meaningful engagement, recommendation quality, try-on behavior, preference depth, purchase intent, attribution, and funnel benchmarks. Those validated definitions become the starting point for each future merchant/brand campaign.

This is why the event taxonomy should be treated as a shared product contract and a strategic data asset, not as a one-off GA4 cleanup task.
