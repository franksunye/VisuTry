# Campaign Intelligence Implementation Progress

## Phase 1 - Analytics Foundation

Status: Complete

## Phase 2 - Detector + Store + GA4 Dashboard Spec

Status: Complete

## Phase 3 - Style Explorer + Paywall + Recommendation Continuations

Status: Complete

## Ops / Follow-ups

| Item | Status |
|---|---|
| Engineering event layer (Phases 1–3) | Complete |
| Taxonomy hardening (B2B vs shopper, campaign_id, cardinality) | Complete — see `taxonomy-hardening.md` |
| Face Analysis `photo_source=detector_handoff` | Complete |
| GA4 console custom dimensions + key events | **Deferred** (see `ga4-console-checklist.md`) |
| GA4 DebugView smoke | Deferred with console access |
| `frame_favorited` product instrumentation | Not started (needs explicit favorite UX) |
| First-party analytics sink / Store Dashboard warehouse | Future |

## Notes

- Cursor browser cannot use the operator’s already-logged-in Chrome session.
- GA4 Admin changes are paused until console access is available without password recovery friction.
- `/store` marketing LP now emits `b2b_*` events only — never shopper `campaign_landed`.
- `campaign_id` is never manufactured from `utm_campaign` (`campaign_name` is used instead).
