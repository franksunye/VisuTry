# VisuTry Campaign Intelligence Event Taxonomy v1.0

Status: Draft / Implementation Baseline  
Owner: Product + Engineering  
Last updated: 2026-08-10

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

The strategic goal is to make the current 2C product produce structured behavioral and intent data that can later support VisuTry's 2B Store / Campaign Engine.

> GA4 is the first event consumer. The taxonomy is the product data model.

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

Use when a campaign context is available. This is distinct from GA4's automatic `page_view`.

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

Recommended trigger rule for v1: fire once per campaign session when any of the following occurs:

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

#### `face_analysis_started`

The shopper begins the face-analysis flow.

This replaces implementation-oriented events such as `face_shape_detector_cta_click` as the canonical business event.

Recommended parameters:

```text
campaign_id
entry_point
merchant_id
store_id
```

#### `face_analysis_photo_uploaded`

A photo has been successfully supplied to the face-analysis flow.

This replaces implementation-oriented events such as `face_shape_detector_photo_upload` as the canonical business event.

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

Initial `failure_reason` values may include:

```text
no_face
multiple_faces
invalid_image
processing_error
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
selected_frame_id
selected_product_id
merchant_id
store_id
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

A qualified merchant-facing lead is created.

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
| `campaign_id` | Stable internal VisuTry campaign identifier |
| `campaign_name` | Human-readable campaign name |
| `campaign_source` | Acquisition source, e.g. google, meta, chatgpt, email |
| `campaign_medium` | Acquisition medium, e.g. organic, paid_social, referral, ai_assistant |
| `campaign_content` | Creative/content variant when available |
| `entry_point` | Where the interaction started: consumer, store, campaign, sdk, etc. |
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

### High-cardinality rule

GA4 should not become the primary storage layer for highly detailed product/session payloads.

Use GA4 for aggregated behavioral analysis and campaign attribution. Store detailed objects such as:

- complete recommendation lists
- comparison frame arrays
- full shopper preference profiles
- raw inference payloads
- raw image analysis output

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

Initial migration baseline:

| Current / implementation-oriented event | Canonical event |
|---|---|
| `face_shape_detector_cta_click` | `face_analysis_started` |
| `face_shape_detector_photo_upload` | `face_analysis_photo_uploaded` |
| existing try-on CTA/click event | `tryon_started` |
| existing try-on success/complete event | `tryon_completed` |
| existing compare CTA/entry event | `comparison_created` or a more precise compare event based on actual semantics |

Important: do not blindly rename an existing event until Engineering verifies the exact trigger semantics. A click event and a completed business outcome are not equivalent.

During migration, dual-write old and new events for a short validation period if historical dashboard continuity matters.

---

## 8. Recommended GA4 Key Events

Do not mark every event as a GA4 key event.

Initial candidates:

```text
face_analysis_completed
recommendation_viewed
tryon_completed
comparison_completed
purchase_intent_clicked
lead_created
```

Final key-event configuration should be driven by the specific funnel/campaign report being optimized.

---

## 9. Campaign Funnel Definitions

### Activation Funnel

```text
campaign_landed
  -> campaign_engaged
  -> face_analysis_started / recommendation_started / tryon_started
```

### Decision Funnel

```text
face_analysis_completed
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

These funnels should later map directly to Store / Campaign Engine merchant reporting.

---

## 10. Merchant / Campaign Metrics Derived from Events

The taxonomy should support the following B2B metrics without inventing a separate merchant-only event language:

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

Recommended logical interface:

```ts
trackEvent(name, properties)
```

The implementation layer should be responsible for:

- validating allowed event names
- attaching shared attribution context
- attaching campaign / merchant context
- normalizing enum values
- forwarding events to GA4
- supporting future first-party analytics sinks
- preventing PII/raw-photo payloads from being sent

The application code should express business intent, for example:

```ts
trackEvent('tryon_completed', {
  campaign_id,
  merchant_id,
  frame_id,
  product_id,
  entry_point: 'campaign',
})
```

rather than embedding GA4 implementation details into the feature.

---

## 13. Rollout Plan

### Phase 1 — Inventory

Audit all current GA4/custom events and record:

- event name
- trigger location
- exact trigger semantics
- current parameters
- current GA4 reports/dependencies

### Phase 2 — Canonical mapping

Map each current event to:

- canonical event
- deprecated event
- keep as GA automatic event
- remove

### Phase 3 — Implement core journey

Priority order:

1. face analysis
2. recommendation
3. try-on
4. compare
5. purchase/lead intent
6. campaign attribution

### Phase 4 — Validate

Validate in GA4 DebugView and first-party logs:

- no duplicate firing
- no missing completion events
- campaign context survives through the journey
- merchant/product/frame context is correct
- mobile and desktop behavior is consistent

### Phase 5 — Deprecate legacy names

After data validation and dashboard migration, stop emitting superseded implementation-oriented events.

---

## 14. Open Decisions

The following must be resolved during implementation rather than guessed in analytics code:

1. Exact semantic difference between `comparison_created` and `comparison_completed` in the current Compare UX.
2. Which current try-on events represent start vs generation request vs successful visible result.
3. Whether a campaign is always explicit (`campaign_id`) or whether consumer organic sessions can be represented by an implicit internal campaign/context model.
4. Definition of `high-intent shopper` as a derived metric rather than a manually fired event.
5. Which detailed frame/recommendation payloads belong in first-party analytics rather than GA4.
6. Which events should become GA4 key events after baseline funnel data is available.

---

## 15. Strategic Context

VisuTry's consumer journey is not only a 2C conversion funnel. It is the data-producing layer for the Store / Campaign Engine.

The same underlying interaction model should eventually support:

```text
Human + AI-Agent Traffic
        -> Campaign / Store Experience
        -> Face Understanding
        -> Recommendation
        -> Try-On
        -> Compare / Preference
        -> Purchase Intent
        -> Merchant Outcome
```

This is why the event taxonomy should be treated as a shared product contract, not as a one-off GA4 cleanup task.
