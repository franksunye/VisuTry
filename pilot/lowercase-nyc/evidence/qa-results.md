# Lowercase NYC QA Results

Status: completed for reference-data rollout on 2026-08-11. Admin UI content was verified through the production workspace query; browser routes remain Auth0-gated without an authenticated Admin session.

## Package validation

- [x] Delivery Kit importer parse passes: 20 rows; Store 20; Find Your Frame 10; Sunglasses Edit 10.
- [x] All selected external IDs map to the 20 catalog rows.
- [x] All 40 product/image URLs return HTTP success.
- [x] Production importer created merchant `cmsor0lvi00006wi81kr12rkw` with 20 CSV-owned active frames.

## Shopper QA

- [x] Store desktop and mobile: HTTP 200; 20 frames; correct headline and Reference / Simulation label.
- [x] Find Your Frame desktop and mobile: HTTP 200; 10 frames; correct headline and Reference / Simulation label.
- [x] Sunglasses Edit desktop and mobile: HTTP 200; 10 frames; correct headline and Reference / Simulation label.
- [x] Deterministic mocked mobile flow: session acquisition preserved `experienceSlug=find-your-frame`; recommendation and select-frame IDs stayed in the campaign subset; no AI provider called.
- [x] Production API exposes the correct Experience IDs, frame counts, reference marker and product destinations.

## Admin QA

- [x] Production workspace query: Merchant Catalog 20; Store 20; Find Your Frame 10; Sunglasses Edit 10.
- [x] Production workspace query returns all metric groups and `Legacy / Unassigned`.
- [x] Browser Admin routes correctly redirect to Auth0 sign-in.
- [ ] Authenticated Admin visual screenshot — not run because no Admin session was available.

## No-cost boundary

Routine smoke is HTTP/browser/API only. No real AI generation is part of this record.

Expected analytics state is zero reference events immediately after publish; no synthetic traffic was generated.
