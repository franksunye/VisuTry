# Credits Pack Conversion Spec

**Status:** Partially implemented — payment and quota foundation complete; conversion UX and events need completion  
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

## 3. Current Implementation Summary

The payment and quota foundation is already implemented.

Implemented foundation:

- `CREDITS_PACK` exists in centralized pricing config.
- Stripe price ID is configured through `STRIPE_CREDITS_PACK_PRICE_ID`.
- Credits Pack uses Stripe Checkout payment mode, not subscription mode.
- Checkout session creation accepts `CREDITS_PACK` and promo credit-pack variants.
- Stripe webhook creates a completed payment record.
- Stripe webhook increments `creditsPurchased` after successful Credits Pack payment.
- Quota calculation includes purchased credits.
- Try-on quota deduction happens after successful generation completion.
- Failed / incomplete tasks should not consume quota through the normal success-only deduction path.
- Try-on quota-exhausted UI can route users to pricing.
- Frame Compare already constrains frame selection by available credits and routes users to pricing when credits are insufficient.

Key implementation files:

| Area | File |
| --- | --- |
| Pricing config | `src/config/pricing.ts` |
| Checkout API | `src/app/api/payment/create-session/route.ts` |
| Stripe helper | `src/lib/stripe.ts` |
| Stripe webhook | `src/app/api/payment/webhook/route.ts` |
| Quota logic | `src/lib/quota.ts` |
| Try-on submit / poll | `src/app/api/try-on/submit/route.ts`, `src/app/api/try-on/poll/route.ts` |
| Try-on UI quota CTA | `src/components/try-on/TryOnInterface.tsx` |
| Compare credits UI | `src/components/compare/FrameCompareInterface.tsx` |

---

## 4. Non-goals

This spec does not cover:

- B2B merchant pricing;
- subscription redesign;
- annual plan packaging;
- refund policy outside failed generation handling;
- Stripe implementation details beyond product behavior requirements.

---

## 5. User Flow

### Implemented insufficient credits flow

1. User attempts to use Try-On or Compare without enough credits / quota.
2. System blocks generation or selection.
3. User sees quota or credits guidance.
4. User is routed to pricing / plans.
5. User can purchase Credits Pack through Stripe Checkout.
6. Stripe webhook updates credits after successful payment.

### Desired high-intent post-result flow

1. User completes a try-on or comparison.
2. User sees the result and a clear next action.
3. If user wants to continue generating more results, Credits Pack is presented as the low-friction paid option.
4. User clicks Credits Pack CTA.
5. User starts checkout.
6. User completes payment.
7. Credits balance updates.
8. User returns to continue try-on or compare.

This post-result flow still needs UX and event completion.

---

## 6. Functional Requirements

### Already implemented or mostly implemented

- Central Credits Pack pricing and quota configuration.
- Stripe checkout session creation for Credits Pack.
- Webhook-based credits update after payment.
- Quota calculation with purchased credits.
- Success-only quota deduction for completed try-on tasks.
- Insufficient-quota CTA from Try-On.
- Credit-limited selection and pricing link from Frame Compare.

### Still needed

#### Placement

Credits Pack CTA should appear in high-intent contexts:

- after a successful try-on result;
- after a successful Frame Compare result;
- when user tries to generate but lacks credits;
- in dashboard usage / quota area;
- in pricing page;
- optionally after Glasses Advisor if the next step is paid try-on.

Current status:

- Insufficient-quota placement exists.
- Compare credit-limited placement exists.
- Post-result Credits Pack CTA still needs stronger productization.

#### Messaging

Messaging should emphasize:

- one-time purchase;
- no subscription required;
- continue comparing frames;
- clear number of included credits or successful try-ons;
- free Detector does not consume credits.

Suggested copy direction:

> Continue trying and comparing frames with a one-time credits pack. No subscription required.

#### Credit behavior

- Show current credit balance where relevant.
- Show expected credit cost before generation.
- Failed generations should not consume credits or should be refunded automatically.
- If multiple frames are generated in Compare, show total required credits.
- Avoid mixing consumer credits with future merchant quota language.

#### Return behavior

After payment completion, user should return to the most relevant context:

- previous try-on flow;
- previous compare flow;
- dashboard if no prior context exists.

Return-context behavior needs review.

---

## 7. Data and Events

### Current state

General purchase, checkout, pricing, and quota-exhausted analytics utilities exist, but this spec's dedicated Credits Pack conversion event names still need implementation or mapping.

### Desired minimum events

| Event | Trigger | Status |
| --- | --- | --- |
| `credits_cta_viewed` | Credits Pack CTA is shown. | Needs implementation / mapping. |
| `credits_cta_clicked` | User clicks Credits Pack CTA. | Needs implementation / mapping. |
| `pricing_viewed` | User views pricing page. | Existing event likely covers pricing view, verify naming. |
| `checkout_started` | Stripe checkout starts. | Existing begin checkout event likely covers this, verify naming. |
| `payment_completed` | Payment succeeds. | Webhook exists; client-side / analytics mapping needs review. |
| `credits_balance_updated` | Credits balance changes. | Backend update exists; analytics event needs review. |
| `paid_tryon_started` | User starts generation after payment. | Needs implementation / mapping. |
| `paid_tryon_completed` | Paid generation completes. | Needs implementation / mapping. |
| `credit_refunded_generation_failed` | Failed generation is refunded or not charged. | Needs explicit documentation / event only if refund path exists. |

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

## 8. UX Notes

- Do not make subscription the dominant casual-user offer.
- Make the one-time nature explicit.
- Explain credits in the product context, not as abstract billing units.
- Keep the CTA close to user intent: after result, before blocked generation, or during comparison.
- Do not interrupt the free Detector's first useful result with payment.
- Avoid generic `View Plans` where a more specific `Get Credits` or `Continue Comparing with Credits` CTA would better match user intent.

---

## 9. Edge Cases

- Stripe payment succeeds but webhook is delayed.
- User closes checkout and returns later.
- User purchases credits from a different device.
- User has enough credits for one result but not a 4-frame comparison.
- Generation fails after credits were deducted.
- User is anonymous and needs login before purchase.
- User already has subscription or premium entitlement.
- Compare batch partially completes and some frames fail.

---

## 10. Acceptance Criteria

### Foundation status

The payment / quota foundation is considered implemented because:

1. Credits Pack exists in product pricing config.
2. Credits Pack can create Stripe Checkout sessions.
3. Credits Pack payment completion updates purchased credits.
4. Try-on generation consumes quota after successful completion.
5. Try-On and Compare have at least basic insufficient-credit routing.

### Remaining acceptance criteria for conversion completion

1. Credits Pack CTA appears in at least one post-result high-intent moment.
2. CTA copy explicitly positions Credits Pack as one-time, no-subscription continuation.
3. Compare completion has a clear `continue comparing / get credits` path.
4. Dedicated Credits Pack CTA events are implemented or formally mapped to existing analytics events.
5. User return path after checkout is reviewed and documented.
6. Failed generation credit behavior is documented in user-facing and internal terms.
7. Funnel from CTA view to paid usage is measurable.

---

## 11. Open Questions

1. Should anonymous users be allowed to start checkout, or should login be required first?
2. What is the current exact Credits Pack size and price to expose in UI?
3. Should Credits Pack be offered before or after first free try-on?
4. Should subscription plans remain visible on pricing page, or be secondary?
5. Should Compare have a bundled discount or simply consume one credit per successful generation?
6. Should post-payment return preserve a compare batch context?

---

## 12. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created draft Credits Pack conversion spec. |
| 2026-07-08 | Updated status to partially implemented after code review of pricing, Stripe, quota, Try-On, and Frame Compare flows. |
