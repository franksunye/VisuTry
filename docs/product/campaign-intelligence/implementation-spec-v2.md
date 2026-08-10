# VisuTry Campaign Intelligence Implementation Spec v2

Status: Implementation Proposal

## 1. Objective

Upgrade analytics from UI interaction tracking into a business event contract that supports:

- 2C funnel optimization
- Store / Campaign Engine analytics
- Merchant reporting
- Future SDK tracking
- AI-agent commerce attribution

The application should emit business events. GA4 is only one consumer.

---

## 2. Analytics Architecture

Current:

```
Feature Component
    -> analytics.ts
        -> GA4
        -> dataLayer
```

Target:

```
Feature Component
    -> trackEvent(canonical_event)
        -> schema validation
        -> shared context injection
        -> GA4
        -> first-party analytics pipeline
```

---

## 3. Required Shared Context

Every business event should automatically attach:

```ts
{
  analytics_schema_version: '2',
  session_id,
  landing_page,
  acquisition_source,
  acquisition_medium,
  locale,
  surface,
  entry_point,
  campaign_id?,
  merchant_id?,
  store_id?
}
```

Do not require feature code to manually add these fields.

---

## 4. Canonical Event Groups

### Acquisition

```
campaign_landed
campaign_engaged
```

### Face Understanding

```
face_analysis_started
face_analysis_photo_uploaded
face_analysis_completed
face_analysis_failed
```

### Recommendation

```
recommendation_started
recommendation_viewed
recommended_frame_selected
```

### Try-On

```
tryon_started
tryon_completed
tryon_failed
tryon_shared
tryon_saved
```

### Compare

```
comparison_created
comparison_completed
frame_favorited
frame_unfavorited
```

### Commerce Intent

```
purchase_intent_clicked
store_visit_requested
lead_created
commerce_outcome_recorded
```

---

## 5. Migration Rules

Legacy events should not be deleted immediately.

Migration sequence:

1. Add canonical events.
2. Dual-write old and new events for validation.
3. Compare GA4 counts.
4. Migrate dashboards.
5. Remove legacy events.

---

## 6. Priority Implementation Order

### Phase 1

Face funnel:

```
face_analysis_started
face_analysis_photo_uploaded
face_analysis_completed
face_analysis_failed
```

### Phase 2

Try-on funnel:

```
tryon_started
tryon_completed
tryon_failed
```

### Phase 3

Preference funnel:

```
recommendation_viewed
comparison_created
frame_favorited
```

### Phase 4

Campaign / Store:

```
campaign_landed
merchant_id
store_id
lead_created
```

---

## 7. Engineering Requirements

1. No direct GA calls inside feature components.
2. Event names must be centrally typed.
3. Parameters must use normalized enums.
4. Never send:
   - raw images
   - email
   - names
   - biometric payloads
5. Keep product details in first-party storage when cardinality is high.

---

## 8. Acceptance Criteria

The system should answer:

- Which campaign generated shoppers?
- Which campaigns generate high-intent users?
- Which frames receive preference signals?
- Which merchant/store experiences convert?
- Which AI/search/social sources create commerce intent?

without changing the event model in the future.
