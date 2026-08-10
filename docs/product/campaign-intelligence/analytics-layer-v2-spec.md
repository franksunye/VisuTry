# VisuTry Analytics Layer v2 Specification

Status: Proposed
Owner: Product + Engineering

## Goal

Upgrade `src/lib/analytics.ts` from a GA4 helper into a business event layer that supports:

- 2C funnel optimization
- Campaign intelligence
- Store / merchant analytics
- Future SDK event collection
- First-party behavioral data

GA4 remains a consumer of the event layer, not the source of the product data model.

## Current State

Current analytics implementation already provides:

- centralized event sending
- GA4 + dataLayer output
- acquisition context injection
- landing page tracking
- language dimensions

The migration should preserve these capabilities.

## Target Architecture

```
Feature Component
      |
      v
Canonical Event API
      |
      v
Schema Validation
      |
      +---- GA4
      |
      +---- dataLayer
      |
      +---- future first-party analytics
```

## New Core Interface

```ts
trackEvent(
  eventName,
  properties
)
```

The application should express business meaning:

```ts
trackEvent('tryon_completed', {
  frame_id,
  product_id,
  campaign_id,
})
```

and should not directly call GA-specific names.

## Required Event Context

Every business event should automatically receive:

```text
analytics_schema_version
landing_page
page_path
acquisition_source
acquisition_medium
locale
surface
entry_point
campaign_id
merchant_id
store_id
```

Only populate values that exist.

## Event Registry

Create a canonical registry:

```ts
const BUSINESS_EVENTS = {
  FACE_ANALYSIS_STARTED: 'face_analysis_started',
  FACE_ANALYSIS_COMPLETED: 'face_analysis_completed',
  TRYON_STARTED: 'tryon_started',
  TRYON_COMPLETED: 'tryon_completed',
  TRYON_FAILED: 'tryon_failed',
  COMPARISON_CREATED: 'comparison_created',
  FRAME_FAVORITED: 'frame_favorited',
}
```

## Migration Rules

Do not blindly rename events.

Examples:

Current:

```
try_on_complete
```

Problem:

- contains success and failure
- implementation naming

Target:

```
tryon_completed
tryon_failed
```

Current:

```
face_analysis_complete
```

Target:

```
face_analysis_completed
```

Current:

```
frame_compare_complete
```

Target:

```
comparison_completed
```

with:

```
completion_status:
  full
  partial
  failed
```

## Backward Compatibility

During migration:

1. Keep existing public analytics methods.
2. Internally route them through canonical events.
3. Optionally dual-write legacy events during validation.
4. Remove legacy names after GA4 dashboards migrate.

## Implementation Order

### Phase 1

Create:

- canonical event registry
- generic trackEvent()
- schema version injection

### Phase 2

Migrate:

- face analysis
- face shape detector

### Phase 3

Migrate:

- try-on
- compare

### Phase 4

Add:

- campaign context
- merchant context
- store context

## Validation Checklist

- no duplicate firing
- completion events represent real outcomes
- campaign attribution survives full funnel
- mobile and desktop generate equivalent events
- no PII or raw image data sent to GA4
