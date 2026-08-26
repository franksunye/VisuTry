# Store/Campaign try-on UX — 2026-08-26

## Issue summary

The workspace exposed selection persistence as “Save selection”, which made the path to try-on unclear. Recommendations also appeared immediately after upload without a visible explanation of what the photo analysis contributed.

## Implemented fix

- Reframed the workspace as Upload photo → Choose frames → Start Try-On.
- Replaced the try-on-enabled save-first CTA with “Try on selected frames”; the selection is persisted internally, the CTA becomes “Continue to Try-On”, and the next step is brought into view.
- Added a compact “Your fit profile” layer between upload and recommendations using existing on-device geometry outputs.
- Added three shopper-readable signals, a short “Why these frames” explanation, per-card “Why it fits” copy, and a sparse 20-point blue fit map.
- Added safe fallback states when geometry or landmark data is unavailable; no dense mesh or raw measurements are shown.

## Before / after

Before: select frames → Save selection → discover the next step below the fold.

After: select frames → Try on selected frames → Continue to Try-On / Start Try-On.

## Evidence

- Desktop: Store/Campaign Playwright flow at 1365×768; CTA progression, Fit Profile fallback, try-on dispatch, compare, and product click pass.
- Mobile: workspace Playwright flow at 390×844; mobile CTA is visible after the frame list, continuation changes state, and document width does not exceed the viewport.

## Remaining P1 / P2

- P1: none identified in this scoped pass.
- P2: add localized copy for the new Fit Profile and progression strings instead of the English fallback used by non-English routes.
