# VisuTry Current Analytics Event Audit

Status: Baseline Audit  
Owner: Product + Engineering  
Repository: `franksunye/VisuTry` / `main`  
Audit date: 2026-08-10

## 1. Purpose

This document inventories the current VisuTry analytics implementation and evaluates it against the Campaign Intelligence event model defined in `event-taxonomy.md`.

The objective is not to rename events mechanically. It is to identify the exact business meaning of current events, preserve useful historical analytics, and prepare a safe migration from feature-oriented 2C tracking toward a shared event contract that can support future Store / Campaign Engine merchant reporting.

## 2. Scope reviewed

Primary analytics implementation:

- `src/lib/analytics.ts`

Core journey call sites reviewed:

- `src/components/face-analysis/FaceAnalysisInterface.tsx`
- `src/components/try-on/TryOnInterface.tsx`
- `src/components/compare/FrameCompareInterface.tsx`

Recent conversion/paywall work was also reviewed from the repository history because it emits analytics through `analytics.trackCustomEvent(...)` rather than dedicated typed methods.

This is a baseline audit of the current main-branch implementation, not a claim that every historical or experimental event in the repository has already been exhausted.

---

## 3. Current analytics architecture

### 3.1 Centralized event sender already exists

`src/lib/analytics.ts` provides a centralized `sendEvent(...)` implementation and an `analytics` interface. This is a strong foundation and should be evolved rather than replaced.

Current behavior:

```text
Feature code
   -> analytics.trackXxx(...)
   -> sendEvent(eventName, parameters)
   -> window.gtag('event', ...)
   -> window.dataLayer.push(...)
```

The sender also enriches events with session/acquisition context.

### 3.2 Existing automatic context

Current events can automatically receive:

```text
landing_page
page_path
landing_locale
browser_language
acquisition_source
acquisition_medium
source_page
query_cluster
content_cluster
product_path
```

The implementation preserves first-touch acquisition source/medium separately from internal continuation context. This is important and should be retained.

### 3.3 Important gaps for Campaign Intelligence

The shared context does not yet provide the complete future B2B contract:

```text
campaign_id
campaign_name
campaign_content
merchant_id
store_id
entry_point
surface
analytics_schema_version
```

UTM attribution currently prioritizes `utm_source` and `utm_medium`; campaign identity/content should be added deliberately rather than inferred later from reports.

AI-assistant referrals are not yet normalized into a first-class `ai_assistant` medium. Without normalization, ChatGPT / Perplexity / Gemini / Claude traffic can be fragmented into generic referral hostnames.

---

## 4. Key audit findings

1. **The tracking transport is already centralized.** The migration can be implemented inside the existing analytics layer without scattering new direct GA calls throughout components.
2. **The event vocabulary is feature-oriented.** Current names contain implementation concepts such as `face_shape_detector`, `frame_compare`, `cta_click`, and mixed verb forms such as `start`, `complete`, `click`.
3. **Some current events combine multiple business outcomes.** The clearest example is `try_on_complete`, which is emitted for both success and failure and relies on `success: true|false` to distinguish the outcome.
4. **A terminal state is not always a successful state.** `frame_compare_complete` fires when the batch becomes terminal; partial failures are possible and `success` currently means at least one frame completed.
5. **Free Face Shape Detector is a separate acquisition product, not merely a UI variant of paid/full Face Analysis.** Collapsing its events directly into `face_analysis_*` would destroy an important top-of-funnel distinction.
6. **`trackCustomEvent` creates an escape hatch around the typed event registry.** It is useful during iteration, but future canonical Campaign Intelligence events should be typed/validated so event names do not drift.
7. **Consumer monetization events and merchant campaign events should share attribution but not be forced into one naming layer.** GA4 standard ecommerce events such as `begin_checkout` and `purchase` should remain standard.
8. **The existing acquisition-context implementation is strategically valuable.** It should be extended with campaign/merchant context, not replaced.

---

## 5. Current event inventory

### 5.1 Identity / lifecycle

| Current event | Current meaning | Campaign Intelligence disposition |
|---|---|---|
| `login_success` | Successful login; includes new/returning and premium state | Keep as product analytics; not a merchant campaign KPI |
| `first_try_on` | First try-on after signup | Keep as lifecycle metric; do not make it a canonical merchant event |

### 5.2 Virtual Try-On

| Current event | Confirmed trigger semantics | Current parameters | Recommended disposition |
|---|---|---|---|
| `try_on_start` | Fires after local validation and immediately before `/api/try-on/submit` | `user_type`, `remaining_quota`, optional glasses fields, `try_on_type`, `product_path` | Migrate to `tryon_started` |
| `try_on_complete` | Fires on both successful completion and failed completion paths | `user_type`, processing time, `success`, optional `try_on_type`, `product_path` | **Split by outcome:** `success=true` -> `tryon_completed`; `success=false` -> `tryon_failed` |

Important semantic note: `try_on_complete` must not be renamed 1:1 to `tryon_completed`, because that would incorrectly count failures as successful campaign outcomes.

### 5.3 Frame Compare

| Current event | Confirmed trigger semantics | Current parameters | Recommended disposition |
|---|---|---|---|
| `frame_compare_start` | Fires after credit/selection validation when a compare batch is actually submitted | `frame_count`, `remaining_credits`, `product_path` | Migrate to `comparison_created` for v1, with a documented definition that creation means the batch has been launched |
| `frame_compare_complete` | Fires when the active batch reaches a terminal state; partial failures are possible | `frame_count`, `completed_count`, `failed_count`, `processing_time_ms`, `success` | Migrate to `comparison_completed`, preserving counts and a normalized completion status |

Current `success` means `completed_count > 0`, not “all requested frames succeeded.” The canonical event must preserve this distinction.

Recommended additional parameter:

```text
completion_status = full | partial | failed
```

### 5.4 Full Face Analysis / Advisor flow

| Current event | Confirmed semantics | Recommended disposition |
|---|---|---|
| `face_analysis_start` | User has a photo/quota and starts the actual analysis request | `face_analysis_started` |
| `face_analysis_upload` | A user photo is supplied to the Face Analysis flow, including restored detector handoff | `face_analysis_photo_uploaded` |
| `face_analysis_complete` | A completed analysis result is available; includes face shape/confidence | `face_analysis_completed` |
| `face_analysis_failed` | Analysis request cannot produce a usable completion | Keep canonical name; normalize failure taxonomy |
| `face_analysis_photo_handoff_restored` | Detector image handoff successfully restored inside Face Analysis | Operational journey-transition event; keep first-party, not a primary merchant KPI |
| `face_analysis_unlock_click` | User indicates intent to unlock the report | Consumer monetization / purchase-intent signal; map through monetization contract rather than claiming report completion |
| `face_analysis_unlock_success` | Face Analysis page returns through unlock-success path and refreshes task | Retain with stricter verified-outcome semantics; do not treat query marker alone as canonical commerce success |
| `face_analysis_frame_search` | User searches frames from analysis result; contains style/query | Recommendation interaction; free-text `query` should not be sent to GA4 without a cardinality/privacy decision |
| `try_on_from_face_analysis` | User continues from Face Analysis toward try-on/top-picks generation | Journey continuation; do not equate click/continuation with `tryon_started` until generation actually begins |
| `face_analysis_top_picks_start` | Top-picks generation activation | Candidate for recommendation/try-on stage mapping based on final product definition |
| `face_analysis_top_picks_complete` | Top-picks generation reaches terminal result | Candidate for `recommendation_viewed` only when recommendations are actually presented to the shopper |
| `face_analysis_top_picks_pricing_click` | User hits pricing/paywall from top-picks flow | Consumer monetization event |
| `face_analysis_explore_more_styles_click` | User asks to explore more styles from a result | Journey continuation / recommendation engagement |

### 5.5 Free Face Shape Detector

| Current event | Current meaning | Recommended disposition |
|---|---|---|
| `face_shape_detector_upload` | Photo supplied to on-device detector | Rename to detector-specific canonical event, not full Face Analysis upload |
| `face_shape_detector_start` | On-device face-shape detection starts | Rename to detector-specific canonical event |
| `face_shape_detector_complete` | On-device face-shape result produced | Rename to detector-specific canonical event |
| `face_shape_detector_failed` | On-device detector failure | Rename to detector-specific canonical event |
| `face_shape_detector_cta_click` | User clicks a continuation CTA; destination may be Face Analysis, Glasses Advisor, Virtual Try-On, Frame Compare, or Face Shape Guide | **Do not map directly to `face_analysis_started`.** Use a generic continuation event with destination, then fire the destination's start event only when that flow really starts |
| `face_shape_detector_photo_handoff` | Attempts to carry the detector image into another flow | Operational transition event; useful for UX diagnostics but not a merchant campaign KPI |

Recommended canonical detector events:

```text
face_shape_photo_uploaded
face_shape_detection_started
face_shape_detection_completed
face_shape_detection_failed
```

Recommended cross-flow event:

```text
journey_continued
```

with:

```text
from_stage = face_shape_detection
destination = face_analysis | glasses_advisor | virtual_try_on | frame_compare | face_shape_guide
```

This preserves the actual shopper journey instead of pretending a CTA click is already a downstream activation.

### 5.6 Consumer pricing / checkout

| Current event | Disposition |
|---|---|
| `quota_exhausted_cta` | Keep as consumer monetization trigger |
| `view_pricing` | Keep as consumer monetization funnel |
| `click_purchase_button` | Keep/migrate to a normalized purchase-intent layer where useful |
| `click_upgrade_button` | Keep as consumer monetization funnel |
| `view_payment_history` | Product/account analytics only |
| `begin_checkout` | **Keep GA4 standard ecommerce semantic name** |
| `purchase` | **Keep GA4 standard ecommerce semantic name** |
| `checkout_cancelled` | Keep operationally; not a GA4 standard purchase outcome |

Recent contextual-paywall work also emits custom events such as:

```text
paywall_view
credits_purchase_click
checkout_started
checkout_cancelled
checkout_completed
conversion_context_restored
original_action_resumed
```

These should be consolidated with the typed analytics layer. In particular, avoid maintaining both `begin_checkout` and a different custom `checkout_started` definition unless the two are intentionally distinct and documented.

### 5.7 Content acquisition

| Current event | Meaning | Recommended disposition |
|---|---|---|
| `blog_funnel_click` | User continues from SEO/blog content into a product flow | Map to `journey_continued` with `entry_point=blog`, `source_page`, `destination`, and `cta_location`; preserve content attribution parameters |

---

## 6. Canonical gaps discovered by the audit

The initial `event-taxonomy.md` baseline needs two corrections before code migration begins.

### 6.1 Free detector must remain distinguishable

The free detector can be a complete acquisition experience by itself. Therefore it needs its own canonical stage:

```text
face_shape_photo_uploaded
face_shape_detection_started
face_shape_detection_completed
face_shape_detection_failed
```

These events may later feed a broader “Shopper Understanding” metric, but the raw semantic contract should remain distinct from the full Face Analysis / Advisor flow.

### 6.2 Add an explicit continuation event

A cross-feature CTA should not falsely increment a destination-start metric.

Add:

```text
journey_continued
```

Recommended parameters:

```text
from_stage
from_product_path
destination
source_page
campaign_id
merchant_id
store_id
```

The destination then fires its own canonical start event after its true trigger condition is reached.

---

## 7. Attribution audit

### Current strengths

- First-touch landing page is stored for the browser session.
- Source/medium are frozen instead of being overwritten by internal navigation.
- Internal continuation context is stored separately through growth context.
- Every event can inherit the same context automatically.

### Required extension

Add normalized shared fields:

```text
analytics_schema_version
campaign_id
campaign_name
campaign_content
entry_point
merchant_id
store_id
surface
```

Capture where appropriate:

```text
utm_campaign -> campaign_name or external_campaign_name
utm_content  -> campaign_content
```

Do not use a human-readable UTM campaign name as the only future merchant `campaign_id`. B2B Campaign Engine should eventually supply a stable internal campaign identifier.

### AI-assistant normalization

Normalize known AI referrers instead of leaving them as generic referrals:

```text
chatgpt      -> source=chatgpt, medium=ai_assistant
perplexity   -> source=perplexity, medium=ai_assistant
gemini       -> source=gemini, medium=ai_assistant
claude       -> source=claude, medium=ai_assistant
```

Unknown AI/agent sources can fall back to:

```text
source=other_ai
medium=ai_assistant
```

Only normalize when the source can be determined reliably.

---

## 8. Data quality risks to address before migration

### 8.1 Mixed outcome events

Split current outcome flags into semantic event names where the business outcome differs materially.

Highest priority:

```text
try_on_complete(success=true|false)
```

### 8.2 Duplicate checkout vocabularies

Typed GA4 ecommerce events and custom paywall events currently overlap conceptually. Establish one definition for:

```text
checkout intent
checkout session created
payment verified
purchase recorded
original action resumed
```

### 8.3 High-cardinality / free-text parameters

Do not use GA4 as a warehouse for arbitrary search strings or long arrays. In particular, review `face_analysis_frame_search.query` before retaining it in GA4.

### 8.4 Operational events vs merchant-facing events

Events such as photo handoff storage/restoration are valuable for debugging conversion friction but should not appear as top-level merchant KPIs. Keep the raw signal while classifying it as operational.

### 8.5 Historical continuity

GA4 historical event names cannot be retroactively renamed. The migration must have a documented cutover/version strategy rather than pretending history is homogeneous.

---

## 9. Priority implementation order

### P0 — Fix semantic correctness

1. Split successful and failed Try-On outcomes.
2. Preserve full/partial/failed Compare terminal states.
3. Separate detector events from full Face Analysis events.
4. Stop mapping continuation clicks to downstream-start outcomes.

### P1 — Add future campaign context

1. `analytics_schema_version`
2. campaign identity/context
3. merchant/store context
4. entry point/surface
5. normalized AI-assistant acquisition

### P2 — Consolidate consumer monetization analytics

Unify custom paywall/checkout events with standard GA4 ecommerce events without breaking native GA4 purchase reporting.

### P3 — Recommendation / preference / commerce intent

Implement canonical recommendation, favorite, product-click, lead, and commerce-outcome events as the corresponding product capabilities become available.

---

## 10. Audit conclusion

VisuTry does **not** need a new analytics stack before moving toward Campaign Intelligence. The current centralized `analytics.ts` and acquisition-context model are strong enough to become the foundation.

The required change is primarily a **semantic contract upgrade**:

```text
feature event names
        ->
shopper business actions
        ->
stable campaign attribution
        ->
merchant-facing intelligence
```

The next implementation artifact is `event-migration.md`, which defines the exact legacy-to-canonical migration and cutover rules.