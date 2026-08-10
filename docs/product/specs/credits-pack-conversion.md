# Credits Pack Conversion Spec

**Status:** Implemented core / Measuring — report unlock and Checkout observability shipped; broader merchandising deferred
**Owner:** Product  
**Created:** 2026-07-08  
**Last updated:** 2026-08-10
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

The payment, quota, Face Analysis report-unlock, and Checkout-observability foundation is implemented.

Implemented foundation:

- `CREDITS_PACK` exists in centralized pricing config.
- Stripe price ID is configured through `STRIPE_CREDITS_PACK_PRICE_ID`.
- Credits Pack uses Stripe Checkout payment mode, not subscription mode.
- Checkout session creation accepts `CREDITS_PACK` and promo credit-pack variants.
- Checkout creation writes a pending Payment row before redirect.
- Signed Stripe webhooks move the same row to completed or failed and record the terminal reason.
- Stripe webhook increments `creditsPurchased` after successful Credits Pack payment.
- Quota calculation includes purchased credits.
- Try-on quota deduction happens after successful generation completion.
- Failed / incomplete tasks should not consume quota through the normal success-only deduction path.
- Try-on quota-exhausted UI can route users to pricing.
- Frame Compare already constrains frame selection by available credits and routes users to pricing when credits are insufficient.
- Face Analysis offers a one-time USD 2.99 unlock for the current personalized report and includes non-expiring continuation credits.
- Stripe supporting copy preserves the report-unlock meaning across all supported Checkout locales.
- GA `begin_checkout` and verified `purchase` share `purchase_context`; the GA custom dimension is registered.
- Admin Orders exposes pending, completed, expired, and failed Checkout attempts.

Key implementation files:

| Area | File |
| --- | --- |
| Pricing config | `src/config/pricing.ts` |
| Checkout API | `src/app/api/payment/create-session/route.ts` |
| Stripe helper | `src/lib/stripe.ts` |
| Stripe webhook | `src/app/api/payment/webhook/route.ts` |
| Verified Purchase bridge | `src/app/api/payment/conversion/route.ts`, `src/components/analytics/PaymentConversionTracker.tsx` |
| Face Analysis unlock | `src/components/face-analysis/FaceAnalysisInterface.tsx`, `src/components/face-analysis/UnlockCreditsBanner.tsx` |
| Observation runbook | `docs/ops/consumer-checkout-observation-2026-08-10.md` |
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

### Implemented Face Analysis high-intent flow

1. User completes Face Analysis and sees a useful basic result plus a personalized full-report preview.
2. User chooses `Unlock This Report` for USD 2.99 one-time.
3. The system validates ownership of the completed, locked analysis task.
4. A pending Payment row is recorded and the user enters Stripe Checkout.
5. Stripe supporting copy explains the report unlock first and included non-expiring credits second.
6. A signed paid webhook atomically completes the Payment, adds credits, and unlocks the same report.
7. The return URL restores the same Face Analysis task and emits a verified, deduplicated GA Purchase.

Post-result merchandising in generic Try-On and Compare may still be improved later, but it is deferred during the current observation period.

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

### Deferred enhancement surface

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
- Face Analysis report-unlock placement is shipped.
- Generic Try-On / Compare post-result merchandising remains optional future work and is not a current Checkout blocker.

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

The canonical paid funnel uses existing GA4-compatible events plus server-side Payment lifecycle state. Do not create duplicate Credits-specific events when an established event and context property answer the same question.

### Desired minimum events

| Event | Trigger | Status |
| --- | --- | --- |
| `face_analysis_unlock_click` | User selects the report-unlock offer. | Implemented. |
| `view_pricing` | User views pricing. | Implemented. |
| `click_purchase_button` | User selects an offer on pricing. | Implemented. |
| `begin_checkout` | A recorded Stripe Checkout Session is ready for redirect. | Implemented with Session and purchase context. |
| `purchase` | Server-verified completed Payment is observed on return. | Implemented and deduplicated by Session ID. |
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

### Core conversion acceptance status

1. Shipped: Credits Pack appears as a Face Analysis post-result report unlock.
2. Shipped: CTA and Stripe supporting copy position it as one-time and preserve the current-report context.
3. Shipped: existing analytics events are formally mapped to the paid funnel.
4. Shipped: return path restores the same analysis task.
5. Shipped: Checkout creation, completion, expiration, and async failure are measurable server-side.
6. Shipped: GA can segment `pricing` and `face_analysis_report` through `purchase_context`.
7. Deferred: stronger generic Try-On / Compare post-result merchandising; reopen only with evidence after the observation period.

---

## 11. Open Questions

1. Should generic Try-On / Compare receive stronger post-result merchandising after the new baseline is measured?
2. Should Compare have a bundled discount, or continue consuming one credit per successful generation?
3. Is a compare-batch return context justified by observed paid demand?

---

## 12. Change Log

| Date | Change |
| --- | --- |
| 2026-07-08 | Created draft Credits Pack conversion spec. |
| 2026-07-08 | Updated status to partially implemented after code review of pricing, Stripe, quota, Try-On, and Frame Compare flows. |
| 2026-08-10 | Shipped Face Analysis report-unlock positioning, pending/terminal Checkout lifecycle persistence, server-verified GA Purchase context, admin visibility, and the observation protocol. |
