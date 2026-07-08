# Frame Compare Spec

**Status:** Implemented core version — needs enhancement tracking  
**Owner:** Product  
**Created:** 2026-07-08  
**Last updated:** 2026-07-08  
**Related plan:** `docs/product/product-plan.md`  
**Implemented route:** `/[locale]/try-on/glasses/compare`  
**Primary implementation:** `src/components/compare/FrameCompareInterface.tsx`

---

## 1. Problem

Eyewear shoppers rarely decide from one frame. They compare multiple candidate frames before choosing.

Frame Compare should be a first-class decision-support feature, not a hidden or secondary experience.

---

## 2. Goal

Make Frame Compare a clear product capability that lets users compare multiple frames side by side and decide which frame direction is most suitable.

The feature should support both consumer conversion and future professional / merchant workflows.

---

## 3. Current Implementation Summary

The core Frame Compare experience is already implemented.

Current production shape:

- Public landing page exists for anonymous users.
- Authenticated users can access the compare interface.
- Users upload one face photo.
- Users select up to 4 built-in preset glasses frames.
- Selection is constrained by available credits.
- A compare batch is initialized before frame dispatch.
- Each selected frame is submitted as an individual try-on task.
- Frame dispatch is staggered to reduce processing contention.
- In-progress tasks are polled.
- Results render in a side-by-side grid.
- Failed frames are shown independently from successful frames.
- Failed frames can be retried when enough credits are available.
- Completed generated images are saved to Dashboard History.

Key implementation files:

| Area | File |
| --- | --- |
| Page route | `src/app/[locale]/(main)/try-on/glasses/compare/page.tsx` |
| UI | `src/components/compare/FrameCompareInterface.tsx` |
| Batch init API | `src/app/api/try-on/glasses/compare/route.ts` |
| Frame dispatch API | `src/app/api/try-on/glasses/compare/frame/route.ts` |
| Server helper | `src/lib/compare-tryon-server.ts` |
| Preset data | `src/config/glasses-presets.ts` |

---

## 4. Non-goals

This spec does not cover:

- real-time 3D AR;
- medical fit guarantees;
- PD measurement;
- full merchant catalog management;
- full VisuTry Store dashboard;
- social ranking or public voting.

---

## 5. User Flow

### Current consumer flow

1. Anonymous user visits `/try-on/glasses/compare` and sees the public landing page.
2. User signs in to start comparing.
3. User uploads one front-facing photo.
4. User selects up to 4 preset glasses frames, constrained by available credits.
5. User starts comparison.
6. System initializes a compare batch.
7. System dispatches one generation task per selected frame.
8. User sees queued, processing, completed, or failed states per frame.
9. User reviews generated looks side by side.
10. User can retry failed frames or compare again.
11. Completed generated images are available in Dashboard History.

### Future advisor / professional flow

1. Advisor opens a client/session.
2. Advisor selects recommended frames from preset, uploaded, or merchant/catalog frames.
3. VisuTry generates a comparison board.
4. Advisor adds notes or chooses a recommended winner.
5. Advisor shares a report link.

---

## 6. Functional Requirements

### Implemented

- Support selecting up to 4 frames for one comparison session.
- Use preset glasses frames as candidate frames.
- Show selected count and credit-constrained availability.
- Prevent starting a comparison when credits are insufficient.
- Initialize a batch before per-frame generation.
- Create one try-on task per selected frame.
- Show queued / processing / completed / failed status per result.
- Poll processing tasks.
- Show completed results in a side-by-side comparison grid.
- Allow retrying failed frames when credits are available.
- Allow starting a new comparison.
- Save generated outputs into normal result history.

### Not yet implemented / enhancement candidates

- Upload custom frame images directly inside Compare.
- Mix preset frames and uploaded frames in one comparison.
- Use merchant catalog frames.
- Save a comparison board as a single shareable object.
- Share the full comparison board through a public URL.
- Mark a preferred frame / winner.
- Add advisor notes.
- Add explicit comparison analytics events.
- Add stronger post-completion Credits Pack conversion CTA.

---

## 7. Data and Events

### Current state

The core feature is implemented, but dedicated analytics event coverage still needs review.

### Desired minimum events

| Event | Trigger | Status |
| --- | --- | --- |
| `frame_compare_started` | User opens or starts compare flow. | Needs review / likely not fully implemented. |
| `frame_compare_frame_selected` | User selects a frame. | Needs review. |
| `frame_compare_generation_started` | User starts generation. | Needs review. |
| `frame_compare_generation_completed` | All or some tasks complete. | Needs review. |
| `frame_compare_generation_failed` | One or more tasks fail. | Needs review. |
| `frame_compare_result_saved` | User saves a result or board. | Future if board object exists. |
| `frame_compare_result_shared` | User shares result or board. | Future if share board exists. |
| `frame_compare_pricing_clicked` | User clicks pricing / credits CTA from compare flow. | Needs review. |

Useful properties:

- user ID if logged in;
- anonymous session ID where applicable;
- number of selected frames;
- frame source: preset / upload / catalog;
- number of successful generations;
- number of failed generations;
- credits required;
- credits available;
- device type;
- entry source;
- batch ID.

---

## 8. Credit / Payment Behavior

Current behavior:

1. A 4-frame comparison can require up to 4 credits.
2. The compare page displays current credits.
3. Selection is constrained by available credits.
4. If credits are unavailable, the UI routes users to pricing / get credits.
5. Per-frame generation uses the existing try-on pipeline and quota deduction behavior.
6. Failed frames are handled independently and can be retried.

Behavior to confirm or improve:

1. Confirm failed generations never consume credits, or are safely handled if they do.
2. Make credit cost even clearer before starting generation.
3. Add stronger Credits Pack CTA after high-intent comparison completion.
4. Track pricing clicks from Compare separately.

---

## 9. UX Notes

- Frame Compare should remain visible as an independent product capability.
- Homepage / landing page should present Compare as a third product block after Free / Try-On and AI Glasses Advisor.
- Copy should frame Compare as decision support: `Compare your top frames side by side`.
- Avoid overclaiming fit accuracy.
- Show privacy and image-retention hints where upload happens.
- The current preset-only implementation is acceptable for the core consumer version, but future Studio / Store flows will need uploaded or catalog frames.

---

## 10. Edge Cases

- User selects fewer than 2 frames.
- User selects more than the available credit-limited count.
- User has zero credits.
- One generation fails while others succeed.
- User refreshes while a batch is in progress.
- User wants to retry failed frames but lacks credits.
- Face photo is invalid or no face is detected.
- Mobile result grid becomes too cramped.

---

## 11. Acceptance Criteria

### Core version status

The core version is considered implemented because:

1. User can upload a photo and select up to 4 preset frames.
2. User sees credit availability and credit-constrained selection.
3. User can start a comparison batch.
4. Results are displayed side by side.
5. Failed items are shown independently.
6. Failed items can be retried when enough credits are available.
7. Compare exists as a standalone route and public landing page.

### Remaining acceptance criteria for enhancement

1. Dedicated compare analytics events are implemented and documented.
2. Compare completion has a stronger high-intent Credits Pack CTA.
3. Full comparison board sharing is supported or explicitly deferred.
4. Uploaded/custom frame support is either implemented or explicitly moved to a later spec.
5. The product plan reflects Compare as implemented core, not a from-scratch build.

---

## 12. Open Questions

1. Should custom uploaded frames be added to Compare before Studio / Store MVP?
2. Should comparison boards have public share URLs?
3. Should users be able to rank or mark a winner?
4. Should comparison output become a reusable report object for Studio?
5. Should merchant catalog frames be introduced directly here or only in VisuTry Store?

---

## 13. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created draft Frame Compare spec. |
| 2026-07-08 | Updated status to implemented core version after code review of `/try-on/glasses/compare`. |
