# GA4 Console Checklist (Deferred)

Status: **Deferred** — blocked on GA4 console access from Cursor browser (no shared Chrome login; password recovery pending)  
Property: `G-6J4ZXNNL4F`  
Spec source: `ga4-dashboard-spec.md`  
Last updated: 2026-08-11

When console access is available (Chrome already logged in, or Cursor browser login via phone/passkey), execute the steps below. Do not change product code for this checklist.

---

## A. Custom dimensions (event-scoped)

Admin → Property → Data display → Custom definitions → Create custom dimension

| Dimension name | Event parameter | Scope |
|---|---|---|
| Campaign ID | `campaign_id` | Event |
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
| `tryon_completed` | Core product outcome |
| `comparison_completed` | Preference depth |
| `purchase_intent_clicked` | Commerce intent |
| `lead_created` | B2B / store lead |

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
