# Frame Compare Spec

**Status:** Draft  
**Owner:** Product  
**Created:** 2026-07-08  
**Last updated:** 2026-07-08  
**Related plan:** `docs/product/product-plan.md`

---

## 1. Problem

Eyewear shoppers rarely decide from one frame. They compare multiple candidate frames before choosing.

VisuTry already has try-on and comparison concepts, but Frame Compare should become a first-class decision-support feature rather than a hidden or secondary experience.

---

## 2. Goal

Make Frame Compare a clear product capability that lets users compare multiple frames side by side and decide which frame direction is most suitable.

The feature should support both consumer conversion and future professional / merchant workflows.

---

## 3. Non-goals

This spec does not cover:

- real-time 3D AR;
- medical fit guarantees;
- PD measurement;
- full merchant catalog management;
- full VisuTry Store dashboard;
- social ranking or public voting.

---

## 4. User Flow

### Consumer flow

1. User uploads or selects a face photo.
2. User selects or uploads multiple candidate frames.
3. VisuTry generates try-on outputs for selected frames.
4. User views the results side by side.
5. User can save, download, share, retry, or continue with more credits.

### Advisor / future professional flow

1. Advisor opens a client/session.
2. Advisor selects recommended frames.
3. VisuTry generates a comparison board.
4. Advisor adds notes or chooses a recommended winner.
5. Advisor shares a report link.

---

## 5. Functional Requirements

### Selection

- Support selecting up to 4 frames for one comparison session in the first version.
- Frames may come from preset frames, uploaded frame images, or later merchant catalog items.
- The UI should make the selected count visible, e.g. `2 / 4 selected`.
- User should be able to replace or remove a selected frame before generation.

### Generation

- Each selected frame creates one try-on task or one batched generation job, depending on implementation.
- Failed generations should be clearly marked without hiding successful results.
- Failed generations should not consume credits if the current billing policy supports that.

### Result display

- Show results in a clean comparison layout.
- Desktop: side-by-side grid, ideally 2-4 columns.
- Mobile: stacked cards or swipeable cards.
- Each result should show frame label, source, and result status.

### Actions

- Save result.
- Share result or comparison link.
- Download result where allowed.
- Retry failed result.
- Add another frame if under the limit.
- Continue to Credits Pack when generation quota is insufficient.

---

## 6. Data and Events

Minimum events:

| Event | Trigger |
| --- | --- |
| `frame_compare_started` | User opens or starts compare flow. |
| `frame_compare_frame_selected` | User selects a frame. |
| `frame_compare_generation_started` | User starts generation. |
| `frame_compare_generation_completed` | All or some tasks complete. |
| `frame_compare_generation_failed` | One or more tasks fail. |
| `frame_compare_result_saved` | User saves a result. |
| `frame_compare_result_shared` | User shares a result or board. |
| `frame_compare_pricing_clicked` | User clicks pricing / credits CTA from compare flow. |

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
- entry source.

---

## 7. Credit / Payment Behavior

Rules to confirm before implementation:

1. One generated try-on result should normally consume one credit.
2. A 4-frame comparison may consume up to 4 credits.
3. Failed generation should not consume credits or should be automatically refunded.
4. User should see the credit cost before starting generation.
5. If credits are insufficient, show Credits Pack CTA before generation.
6. Free trial behavior should be explicit and not hidden.

---

## 8. UX Notes

- Frame Compare should appear as a visible product capability, not only inside history or carousel.
- It can be presented on homepage as a third product block after Free / Try-On and AI Glasses Advisor.
- The copy should frame Compare as decision support: `Compare your top frames side by side`.
- Avoid overclaiming fit accuracy.
- Show privacy and image-retention hints where upload happens.

---

## 9. Edge Cases

- User selects fewer than 2 frames.
- User selects more than the allowed limit.
- One generation fails while others succeed.
- User lacks enough credits.
- Uploaded frame image quality is poor.
- Face photo is invalid or no face is detected.
- User is anonymous and tries to save long-term history.
- Mobile result grid becomes too cramped.

---

## 10. Acceptance Criteria

The first version is acceptable when:

1. User can select 2-4 frames and start comparison.
2. User understands credit cost before generation.
3. Results are displayed clearly on desktop and mobile.
4. Failed items are handled without losing successful results.
5. Compare flow is tracked with the minimum events above.
6. Credits Pack CTA appears when credits are insufficient or after high-intent comparison moments.
7. Compare is discoverable from the main product experience.

---

## 11. Open Questions

1. Should Frame Compare be a standalone route, homepage section, or integrated flow only?
2. Should anonymous users be allowed to compare before login?
3. Should comparison boards have public share URLs?
4. Should users be able to rank or mark a winner?
5. Should the first version use preset/upload only, or include early catalog support?

---

## 12. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created draft Frame Compare spec. |
