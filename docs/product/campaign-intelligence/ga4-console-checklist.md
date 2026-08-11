# GA4 Console Checklist (Partially implemented)

Status: **Partially implemented** — Chrome access is available; remaining items are blocked until GA4 observes the new canonical event parameters/events
Property: `G-6J4ZXNNL4F`  
Spec source: `ga4-dashboard-spec.md`  
Last updated: 2026-08-11

Execution record (2026-08-11):

- Created the event-scoped `Face shape` dimension mapped to `face_shape`.
- Existing dimensions (`destination`, `purchase_context`, and the blog/continuation dimensions) were retained.
- The GA4 parameter picker does not yet expose `campaign_id`, `merchant_id`, `store_id`, `surface`, `entry_point`, `frame_category`, `intent_type`, `lead_type`, `landing_surface`, `source_journey`, or `analytics_schema_version`; these cannot be safely registered until GA4 has received those parameters.
- The canonical key events (`tryon_completed`, `comparison_completed`, `purchase_intent_clicked`, `lead_created`) are not yet present in the property. Existing legacy key events were left enabled to avoid a conversion-reporting gap.
- Production smoke reached the Store CTA with `?campaign_id=cmp_debug`; photo-upload smoke was blocked by Chrome file-upload permission, so DebugView confirmation remains pending.

For the remaining items below, wait until the corresponding canonical events/parameters have been observed in GA4, then execute the steps in Chrome. Do not change product code for this checklist.

---

## A. Custom dimensions (event-scoped)

Admin → Property → Data display → Custom definitions → Create custom dimension

| Dimension name | Event parameter | Scope |
|---|---|---|
| Campaign ID | `campaign_id` | Event |
| Campaign name | `campaign_name` | Event |
| Merchant ID | `merchant_id` | Event |
| Store ID | `store_id` | Event |
| Surface | `surface` | Event |
| Entry point | `entry_point` | Event |
| Frame category | `frame_category` | Event |
| Face shape | `face_shape` | Event |
| Intent type | `intent_type` | Event |
| Lead type | `lead_type` | Event |
| Landing surface | `landing_surface` | Event |
| Source journey | `source_journey` | Event |
| Destination | `destination` | Event |
| Schema version | `analytics_schema_version` | Event |

Notes:

- Existing locale dimensions (`landing_locale`, `browser_language`) should already exist; do not duplicate.
- New dimensions only apply to data collected **after** creation.

---

## B. Mark key / conversion events

Admin → Property → Data display → Events

Turn ON as key events / conversions:

| Event | Why |
|---|---|
| `tryon_completed` | Core shopper product outcome |
| `comparison_completed` | Preference depth |
| `purchase_intent_clicked` | Shopper commerce intent (merchant campaign) |
| `lead_created` | Shopper / campaign lead |
| `b2b_lead_created` | VisuTry Store B2B sales lead (separate funnel) |

Keep (if already conversions):

| Event | Why |
|---|---|
| `begin_checkout` | GA4 ecommerce |
| `purchase` | Verified purchase only |

Optional secondary (campaign-dependent):

| Event |
|---|
| `face_analysis_completed` |
| `face_shape_detection_completed` |
| `b2b_landing_viewed` |

Important: do **not** treat `/store` marketing traffic as `campaign_landed`. B2B acquisition uses `b2b_*` events.

---

## C. Do NOT mark as conversions

```text
*_started
*_failed
journey_continued
paywall_viewed
checkout_return_verified
face_shape_detector_photo_handoff
face_analysis_photo_handoff_restored
conversion_context_restored
original_action_resumed
```

---

## D. Quick DebugView smoke (after deploy)

1. Open site with `?campaign_id=cmp_debug`
2. Run Face Shape Detector → continue to Face Analysis
3. Start a Try-On
4. Open Store landing and submit lead form (or CTA)
5. Confirm in DebugView:
   - `analytics_schema_version = 2`
   - canonical event names (not legacy `try_on_*` / `face_analysis_start`)
   - no dual `checkout_started` + `begin_checkout`

---

## E. Suggested first exploration

Free-form exploration filtered by `analytics_schema_version = 2`:

```text
campaign_landed
 → campaign_engaged
 → face_analysis_started / face_shape_detection_completed
 → tryon_completed
 → purchase_intent_clicked
 → lead_created
```

Break down by `acquisition_source` and `entry_point`.
