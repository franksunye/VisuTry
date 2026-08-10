# GA4 Campaign Dashboard Specification

Status: Spec for post–Phase 2 configuration  
Owner: Product + Growth  
Last updated: 2026-08-10

Related:

- `event-taxonomy.md`
- `event-migration.md`
- `migration-complete-report.md`
- `phase2-completion-report.md`

## Purpose

Define the GA4 reporting surface that turns VisuTry Campaign Intelligence events into client-facing Brand / Store analytics.

GA4 remains an **event consumer**. The product data model is the canonical event registry in `src/lib/analytics-events.ts`.

---

## Campaign Overview

Primary scorecard for a campaign / merchant / store.

| Metric | Definition | Primary event(s) |
|---|---|---|
| Campaign Visitors | Unique users with campaign/store context who land | `campaign_landed` |
| Engaged Users | Users who take a meaningful first action | `campaign_engaged` or first of analysis/try-on/compare start |
| Face Analysis Started | Users who begin full analysis | `face_analysis_started` |
| Face Shape Detection Completed | Free detector completions | `face_shape_detection_completed` |
| Try-On Started | Generation request launched | `tryon_started` |
| Try-On Completed | Successful usable render only | `tryon_completed` |
| Compare Created | Compare batch launched | `comparison_created` |
| Compare Completed | Compare batch terminal | `comparison_completed` |
| Purchase Intent | Commerce / CTA intent | `purchase_intent_clicked` |
| Leads | B2B / store lead submissions | `lead_created` |

Suggested overview cards for sales demos:

```text
Visitors → Engaged → Analysis → Try-On Completed → Intent → Leads
```

Do **not** count `tryon_failed` or detector CTA clicks as conversion outcomes.

---

## User Interest

Audience and preference cuts for merchant storytelling.

| Interest signal | Parameter / event | Notes |
|---|---|---|
| Face shape | `face_shape` on detection / analysis / journey events | Normalize enum values |
| Frame category | `frame_category` (when present) | Add as events gain frame context |
| Style preference | style / occasion params from recommendation flows | Phase 3+ |
| Favorite frame | `frame_favorited` | Not fully migrated yet |

Recommended explorations:

1. Face shape distribution among `face_shape_detection_completed` and `face_analysis_completed`
2. Destination mix on `journey_continued` (`destination`)
3. Intent mix on `lead_created` (`lead_type` / `user_intent`)

---

## Funnel

### Campaign funnel (canonical)

```text
Landing          campaign_landed
   ↓
Engagement       campaign_engaged
   ↓
Analysis         face_shape_detection_started / face_analysis_started
   ↓
Try-On           tryon_started → tryon_completed
   ↓
Preference       comparison_created → comparison_completed / frame_favorited
   ↓
Intent           purchase_intent_clicked
   ↓
Lead             lead_created
```

### Consumer organic variant

When no explicit campaign exists, the same funnel still works with:

- `entry_point = consumer | blog`
- acquisition source/medium as traffic dimensions

### Important semantic rules

| Do | Don't |
|---|---|
| Count `journey_continued` as progression intent | Treat it as `face_analysis_started` |
| Split try-on success vs failure | Use mixed legacy `try_on_complete` |
| Use `completion_status` on compare | Treat any partial as full success |

---

## Dimensions

Configure these as GA4 custom dimensions (event-scoped unless noted):

| Dimension | Event parameter | Why |
|---|---|---|
| Campaign ID | `campaign_id` | Brand / campaign reporting |
| Merchant ID | `merchant_id` | Store / B2B segmentation |
| Store ID | `store_id` | Multi-location merchants |
| Surface | `surface` | web / mobile_web / pwa / merchant_store / sdk |
| Entry point | `entry_point` | consumer / campaign / store / blog / sdk |
| Frame category | `frame_category` | Interest / assortment insight |
| Face shape | `face_shape` | Preference insight |
| Intent type | `intent_type` | CTA / commerce intent |
| Lead type | `lead_type` | sample / demo / catalog / partnership |
| Landing surface | `landing_surface` | store marketing vs in-store surfaces |
| Source journey | `source_journey` | continuation provenance |
| Destination | `destination` | where shoppers continue |
| Schema version | `analytics_schema_version` | cutover filter (`2`) |

Also keep existing acquisition dimensions:

```text
landing_page
acquisition_source
acquisition_medium
landing_locale
browser_language
```

---

## Conversion Events

Mark only high-value outcomes as GA4 key / conversion events:

| Conversion | Event | Rationale |
|---|---|---|
| Successful try-on | `tryon_completed` | Core product outcome |
| Compare finished | `comparison_completed` | Preference depth |
| Purchase intent | `purchase_intent_clicked` | Commerce signal |
| Lead | `lead_created` | B2B / store sales signal |

Optional secondary conversions (campaign-dependent):

```text
face_analysis_completed
face_shape_detection_completed
```

Do **not** mark as conversions:

```text
*_started
*_failed
journey_continued
face_shape_detector_photo_handoff
operational / debug events
```

Preserve GA4 ecommerce standards separately:

```text
begin_checkout
purchase
```

---

## Suggested GA4 Explorations

1. **Campaign Overview** — free-form + scorecard filtered by `campaign_id` and `analytics_schema_version=2`
2. **Source Quality** — `acquisition_source/medium` × `tryon_completed` rate
3. **Detector → Analysis bridge** — `face_shape_detection_completed` → `journey_continued` → `face_analysis_started`
4. **Store Pipeline** — `campaign_landed` → `purchase_intent_clicked` → `lead_created`
5. **Failure diagnostics** (internal) — `tryon_failed` / `face_analysis_failed` / `face_shape_detection_failed`

---

## Sales demo mapping

| Client-facing phrase | GA4 backing |
|---|---|
| Campaign visitors | `campaign_landed` users |
| People who engaged | `campaign_engaged` / started analysis or try-on |
| Completed face analysis | `face_analysis_completed` + detector completed |
| Real try-ons | `tryon_completed` |
| Compared frames | `comparison_completed` |
| Asked for demo / sample | `lead_created` |

Never show raw event dumps to customers; show derived rates and funnel charts.
