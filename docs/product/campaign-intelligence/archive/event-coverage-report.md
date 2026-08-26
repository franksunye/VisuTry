# Campaign Intelligence Event Coverage Report

Status: Updated after Phase 1–3 engineering cutover  
Date: 2026-08-11  
Scope: `src/app/**`, `src/components/**`, `src/lib/**`

## Summary

| Area | Call sites | Migration status |
|---|---|---|
| P0 Face Analysis | `FaceAnalysisInterface` via `analytics.trackFaceAnalysis*` | **Done** — canonical names; handoff uses `photo_source=detector_handoff` |
| P0 Try-On | `TryOnInterface` via `analytics.trackTryOn*` | **Done** — `tryon_started` / `tryon_completed` / `tryon_failed` |
| P0 Compare | `FrameCompareInterface` via `analytics.trackFrameCompare*` | **Done** — `comparison_created` / `comparison_completed` |
| Face Shape Detector | `FreeFaceShapeDetector*` via `trackFaceShapeDetector*` | **Done** — detection events + `journey_continued` |
| Store / B2B | Store landing + lead form | **Done** — `campaign_landed` / intent / `lead_created` |
| Style Explorer | core funnel via typed APIs | **Done** — recommendation / try-on events |
| Paywall | `ConversionPaywallBoundary` | **Done** — `paywall_viewed` / intent / `begin_checkout` / return verified |
| Face Analysis continuations | top picks / unlock / blog | **Done** — journey / recommendation / intent remaps |
| Ecommerce (GA4 standard) | Pricing / PaymentConversionTracker | Keep `begin_checkout` / `purchase` |
| Style Explorer micro-interactions | chips / download / restore custom events | Still feature-level `trackCustomEvent` via v2 |
| Direct `gtag` / `dataLayer` | GA bootstrap only | Infrastructure only |
| GA4 Admin console | custom dimensions / key events | **Deferred** — `ga4-console-checklist.md` |

**Architecture:**

```text
Component
  → analytics.ts (stable public API)
    → analytics-v2.ts (Campaign Event Layer)
      → GA4 + dataLayer
```

Note: Compare maps to `comparison_created` (canonical registry / taxonomy), not `comparison_started`.

---

## Coverage matrix

| 文件 | 当前事件 | 当前用途 | 新事件 | 修改建议 |
|---|---|---|---|---|
| `src/lib/analytics.ts` | `try_on_start` | Virtual try-on request launched | `tryon_started` | **Done** — `trackTryOnStart` emits canonical name |
| `src/lib/analytics.ts` | `try_on_complete` | Mixed success/failure completion | `tryon_completed` / `tryon_failed` | **Done** — split by `success` inside `trackTryOnComplete` |
| `src/lib/analytics.ts` | `frame_compare_start` | Compare batch launched | `comparison_created` | **Done** |
| `src/lib/analytics.ts` | `frame_compare_complete` | Compare batch terminal | `comparison_completed` (+ `completion_status`) | **Done** |
| `src/lib/analytics.ts` | `face_analysis_start` | Full analysis activated | `face_analysis_started` | **Done** |
| `src/lib/analytics.ts` | `face_analysis_upload` | Photo accepted for analysis | `face_analysis_photo_uploaded` | **Done** — adds `photo_source=upload` |
| `src/lib/analytics.ts` | `face_analysis_complete` | Analysis succeeded | `face_analysis_completed` | **Done** |
| `src/lib/analytics.ts` | `face_analysis_failed` | Analysis failed | `face_analysis_failed` | **Done** (name already canonical) |
| `src/components/try-on/TryOnInterface.tsx` | `trackTryOnStart` / `trackTryOnComplete` | Core try-on funnel | via facade → P0 canonical | No component change; verify DebugView |
| `src/components/try-on/TryOnInterface.tsx` | `try_on_face_analysis_nudge_click` | Cross-sell nudge | keep / later `journey_continued` | Defer |
| `src/components/try-on/TryOnInterface.tsx` | `quota_exhausted_cta` | Paywall CTA | keep for now | Later map to commerce intent |
| `src/components/compare/FrameCompareInterface.tsx` | `trackFrameCompareStart/Complete` | Compare funnel | via facade → P0 canonical | No component change |
| `src/components/face-analysis/FaceAnalysisInterface.tsx` | `trackFaceAnalysis*` | Full face analysis funnel | via facade → P0 canonical | Handoff upload uses `photo_source=detector_handoff` |
| `src/components/face-analysis/FaceAnalysisInterface.tsx` | `begin_checkout` / `view_pricing` | Monetization | keep GA4 ecommerce names | Attach campaign context only |
| `src/components/face-analysis/FaceAnalysisInterface.tsx` | `face_analysis_photo_handoff_restored` | Detector → analysis handoff | keep operational | Do not treat as KPI |
| `src/components/face-analysis/FaceAnalysisInterface.tsx` | `face_analysis_unlock_success` | Report unlock | keep / later commerce outcome | Defer |
| `src/components/face-analysis/FaceAnalysisResult.tsx` | `face_analysis_top_picks_*` / `try_on_from_face_analysis` | Top picks generation | keep for dashboards | Phase 2: recommendation / tryon funnel |
| `src/components/face-analysis/FaceAnalysisResult.tsx` | `face_analysis_explore_more_styles_click` | Explore more CTA | keep | Later `journey_continued` |
| `src/components/face-analysis/FrameSearchSuggestions.tsx` | `face_analysis_frame_search` | Search suggestions | keep | Later recommendation stage |
| `src/components/face-analysis/FrameSearchSuggestions.tsx` | `face_analysis_direct_frame_try_on_click` | Direct try-on CTA | keep / later `tryon_started` trigger only when try-on begins | Defer |
| `src/components/face-analysis/UnlockCreditsBanner.tsx` | `face_analysis_unlock_click` | Unlock CTA | keep | Later `purchase_intent_clicked` |
| `src/components/face-shape/FreeFaceShapeDetector.tsx` | `face_shape_detector_*` | On-device detector funnel | `face_shape_detection_*` / `face_shape_photo_uploaded` | Next phase — registry already defined |
| `src/components/face-shape/FreeFaceShapeResult.tsx` | `face_shape_detector_cta_click` | Continuation CTA | `journey_continued` | Next phase; do **not** fire downstream start on click |
| `src/components/face-shape/FreeFaceShapeResult.tsx` | `face_shape_detector_photo_handoff` | Handoff reliability | keep operational | Defer |
| `src/components/pricing/PricingSection.tsx` | `view_pricing` | Pricing page view | keep | Context enrichment via v2 |
| `src/components/pricing/PricingCard.tsx` | `click_purchase_button` / `begin_checkout` | Purchase CTA | keep GA4 ecommerce | Context enrichment via v2 |
| `src/components/analytics/PaymentConversionTracker.tsx` | `purchase` / `checkout_cancelled` | Payment return | keep | Context enrichment via v2 |
| `src/components/payments/ConversionPaywallBoundary.tsx` | `paywall_view`, `credits_purchase_click`, `checkout_*`, restore events | Conversion paywall | keep custom | Phase: map to purchase intent / commerce |
| `src/components/dashboard/DashboardQuickActions.tsx` | `click_upgrade_button` / `view_payment_history` | Dashboard upgrades | keep | Defer |
| `src/components/dashboard/SubscriptionCard.tsx` | `click_upgrade_button` | Upgrade CTA | keep | Defer |
| `src/components/blog/FaceAnalysisFunnelCTA.tsx` | `blog_funnel_click` | Blog → product funnel | keep / later `journey_continued` | Set `entry_point=blog` when migrating |
| `src/components/analytics/GrowthFunnelLink.tsx` | `seo_funnel_click` | SEO → product funnel | keep / later `journey_continued` | Defer |
| `src/components/auth/LoginButton.tsx` | dynamic `trackCustomEvent` | Auth success variants | keep | Ensure schema/context via transport |
| `src/components/store/StoreLandingAnalytics.tsx` | `store_landing_viewed` / `store_cta_clicked` | Store marketing | `campaign_landed` / `purchase_intent_clicked` candidates | Phase 4 — also call `setCampaignAnalyticsContext` |
| `src/components/store/StoreLeadForm.tsx` | `store_lead_*` / sample/demo/pilot | B2B lead funnel | `lead_created` (+ intent subtypes) | Phase 4 |
| `src/components/style-explorer/StyleExplorerInterface.tsx` | many `style_explorer_*` | Style explorer funnel | map subset to recommendation / tryon | Phase 3+ |
| `src/components/analytics/GoogleAnalytics.tsx` | inline `gtag` bootstrap + legacy `trackEvent` helpers | GA loader / unused helpers | n/a | Keep bootstrap; prefer `analytics.ts` for business events |
| `src/components/analytics/GoogleTagManager.tsx` | `dataLayer.push` | GTM bootstrap | n/a | Infrastructure only |
| `src/lib/analytics-v2.ts` | `trackCampaignEvent` | Campaign Event Layer transport | canonical transport | **Done** — single emission path |
| `src/lib/analytics-events.ts` | `AnalyticsEvent` registry | Stable event contracts | n/a | **Done** — extend as stages migrate |
| `src/app/**` | (none for business events) | — | — | App routes use components; no direct gtag business calls |

---

## P0 cutover notes

1. **No dual-write** for P0 events: production emits only canonical names to avoid double conversion counting.
2. **Legacy method names remain** (`trackTryOnComplete`, etc.) so components do not need a call-site rewrite.
3. **GA4 ecommerce events** (`begin_checkout`, `purchase`) are intentionally unchanged.
4. **GA4 dashboards** that still filter `try_on_start` / `face_analysis_start` / `frame_compare_*` must switch to the new names (filter `analytics_schema_version=2`).

---

## Validation checklist

- [x] All analytics emissions route through `trackCampaignEvent`
- [x] `analytics_schema_version=2` on every event
- [x] Campaign / merchant / store / surface / entry_point injected when available
- [x] Acquisition + locale fields retained
- [x] Phase 2 detector + store migrated
- [x] Phase 3 style explorer + paywall migrated
- [ ] GA4 Admin custom dimensions / key events (`ga4-console-checklist.md`)
- [ ] GA4 DebugView spot-check on Face Analysis / Try-On / Compare / Store
- [ ] Update saved GA4 explorations for renamed events
