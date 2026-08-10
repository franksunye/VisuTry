# Campaign Intelligence Migration Summary

Date: 2026-08-10  
Scope: Engineering cutover for Campaign Event Layer + P0 funnels

## What changed

| File | Change |
|---|---|
| `src/lib/analytics-events.ts` | Expanded canonical registry + shared context types |
| `src/lib/analytics-v2.ts` | Campaign Event Layer: context persistence, surface/entry_point, single GA4/dataLayer transport |
| `src/lib/analytics.ts` | Legacy APIs preserved; transport via v2; P0 events renamed |
| `docs/product/campaign-intelligence/event-coverage-report.md` | Full call-site coverage matrix |
| `docs/product/campaign-intelligence/implementation-progress.md` | Progress updated |
| `tests/unit/lib/analytics-campaign-migration.test.ts` | P0 rename + context + no dual-write coverage |

## Pipeline

```text
Component
  → analytics.ts (unchanged public method names)
    → analytics-v2.trackCampaignEvent
      → GA4 gtag('event')
      → dataLayer.push
```

## P0 event mapping (production single-write)

| Legacy GA4 name | Canonical name |
|---|---|
| `face_analysis_start` | `face_analysis_started` |
| `face_analysis_upload` | `face_analysis_photo_uploaded` |
| `face_analysis_complete` | `face_analysis_completed` |
| `face_analysis_failed` | `face_analysis_failed` |
| `try_on_start` | `tryon_started` |
| `try_on_complete` (`success=true`) | `tryon_completed` |
| `try_on_complete` (`success=false`) | `tryon_failed` |
| `frame_compare_start` | `comparison_created` |
| `frame_compare_complete` | `comparison_completed` |

Compare uses `comparison_created` (taxonomy/registry), not `comparison_started`.

## Automatic context on every event

- `analytics_schema_version = "2"`
- `campaign_id` / `merchant_id` / `store_id` when present (URL or session)
- `surface` / `entry_point`
- Existing: `landing_page`, `acquisition_source`, `acquisition_medium`, `landing_locale`, `browser_language`

## Compatibility guarantees

- All existing `analytics.track*` method signatures remain.
- Components were not rewritten for P0.
- GA4 standard ecommerce events (`begin_checkout`, `purchase`) unchanged.
- No dual-write of legacy + canonical P0 names (avoids double conversions).

## Verification

- TypeScript: `tsc --noEmit` passed
- Unit tests: analytics attribution + campaign migration passed
- User flows: unchanged (analytics-only internal routing)

## Follow-ups

1. Update GA4 explorations/filters for renamed P0 events (`analytics_schema_version=2`)
2. DebugView spot-check Face Analysis / Try-On / Compare
3. Migrate detector / store / style-explorer custom events per coverage report
