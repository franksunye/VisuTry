# Credits Pack Conversion Spec

**Status:** Draft  
**Owner:** Product  
**Created:** 2026-07-08  
**Last updated:** 2026-07-08  
**Related plan:** `docs/product/product-plan.md`

---

## 1. Problem

VisuTry's consumer usage is episodic. Most casual shoppers do not need a monthly subscription, but they may pay when they are actively choosing glasses.

Credits Pack is the clearest casual paid product, but it must appear at the right high-intent moments and be measurable end to end.

---

## 2. Goal

Make Credits Pack the primary consumer paid conversion path for users who want additional try-ons, frame comparisons, saved outputs, or higher-intent decision support.

---

## 3. Non-goals

This spec does not cover:

- B2B merchant pricing;
- subscription redesign;
- annual plan packaging;
- refund policy outside failed generation handling;
- Stripe implementation details beyond product behavior requirements.

---

## 4. User Flow

### High-intent post-result flow

1. User completes a try-on or comparison.
2. User sees the result and a clear next action.
3. If user wants to continue generating more results, Credits Pack is presented as the low-friction paid option.
4. User clicks Credits Pack CTA.
5. User starts checkout.
6. User completes payment.
7. Credits balance updates.
8. User returns to continue try-on or compare.

### Insufficient credits flow

1. User attempts to generate a result.
2. System detects insufficient credits or trial quota.
3. User sees credit requirement and available balance.
4. User is offered Credits Pack.
5. After purchase, user returns to the same task context where possible.

---

## 5. Functional Requirements

### Placement

Credits Pack CTA should appear in high-intent contexts:

- after a successful try-on result;
- after a successful Frame Compare result;
- when user tries to generate but lacks credits;
- in dashboard usage / quota area;
- in pricing page;
- optionally after Glasses Advisor if the next step is paid try-on.

### Messaging

Messaging should emphasize:

- one-time purchase;
- no subscription required;
- continue comparing frames;
- clear number of included credits or successful try-ons;
- free Detector does not consume credits.

Suggested copy direction:

> Continue trying and comparing frames with a one-time credits pack. No subscription required.

### Credit behavior

- Show current credit balance where relevant.
- Show expected credit cost before generation.
- Failed generations should not consume credits or should be refunded automatically.
- If multiple frames are generated in Compare, show total required credits.
- Avoid mixing consumer credits with future merchant quota language.

### Return behavior

After payment completion, user should return to the most relevant context:

- previous try-on flow;
- previous compare flow;
- dashboard if no prior context exists.

---

## 6. Data and Events

Minimum events:

| Event | Trigger |
| --- | --- |
| `credits_cta_viewed` | Credits Pack CTA is shown. |
| `credits_cta_clicked` | User clicks Credits Pack CTA. |
| `pricing_viewed` | User views pricing page. |
| `checkout_started` | Stripe checkout starts. |
| `payment_completed` | Payment succeeds. |
| `credits_balance_updated` | Credits balance changes. |
| `paid_tryon_started` | User starts generation after payment. |
| `paid_tryon_completed` | Paid generation completes. |
| `credit_refunded_generation_failed` | Failed generation is refunded or not charged. |

Useful properties:

- user ID;
- session ID;
- CTA location;
- previous product context: Detector / Advisor / Try-On / Compare / Dashboard / Pricing;
- credits before;
- credits after;
- product ID / Stripe price ID;
- payment amount;
- currency;
- generation count requested;
- generation count completed;
- generation count failed.

---

## 7. UX Notes

- Do not make subscription the dominant casual-user offer.
- Make the one-time nature explicit.
- Explain credits in the product context, not as abstract billing units.
- Keep the CTA close to user intent: after result, before blocked generation, or during comparison.
- Do not interrupt the free Detector's first useful result with payment.

---

## 8. Edge Cases

- Stripe payment succeeds but webhook is delayed.
- User closes checkout and returns later.
- User purchases credits from a different device.
- User has enough credits for one result but not a 4-frame comparison.
- Generation fails after credits were deducted.
- User is anonymous and needs login before purchase.
- User already has subscription or premium entitlement.

---

## 9. Acceptance Criteria

The first version is acceptable when:

1. Credits Pack CTA appears in at least one post-result high-intent moment.
2. Insufficient-credit generation path routes to Credits Pack clearly.
3. User understands free Detector does not consume credits.
4. User sees current balance and required credits where relevant.
5. Payment completion updates credits reliably.
6. Failed generation credit behavior is safe and documented.
7. Funnel from CTA view to paid usage is measurable.

---

## 10. Open Questions

1. Should anonymous users be allowed to start checkout, or should login be required first?
2. What is the current exact Credits Pack size and price to expose in UI?
3. Should Credits Pack be offered before or after first free try-on?
4. Should subscription plans remain visible on pricing page, or be secondary?
5. Should Compare have a bundled discount or simply consume one credit per successful generation?

---

## 11. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created draft Credits Pack conversion spec. |
