# Consumer Checkout Observation Note — 2026-08-10

**Status:** Active observation runbook

**Owner:** Product / Growth / Engineering

**Created:** 2026-08-10

**Review trigger:** At least 14 days of data and 30–50 unique Checkout Sessions

**Related sources:** `docs/strategy/analytics/gtm.md`, `docs/product/specs/credits-pack-conversion.md`

---

## 1. Decision

The current GTM-message and consumer-checkout improvement round is closed for implementation and has entered an observation period.

Do not continue changing price, Link availability, payment-method presentation, report-unlock copy, or Checkout layout without new evidence. The immediate job is to accumulate a trustworthy commercial sample.

This is not a claim that conversion is already optimal. It means the known measurement and purchase-context gaps have been removed, and further changes would now make the next sample harder to interpret.

---

## 2. Evidence that triggered the work

GA event-count comparison reviewed on 2026-08-10:

| Event | 2026-07-31–2026-08-03 | 2026-08-04–2026-08-07 | Change |
| --- | ---: | ---: | ---: |
| Total events | 3,980 | 5,514 | +38.5% |
| Face Analysis start | 22 | 43 | +95% |
| Face Analysis complete | 19 | 32 | +68% |
| View pricing | 22 | 29 | +32% |
| Face Analysis unlock click | 2 | 4 | +100% |
| Begin Checkout | 2 | 6 | +200% |
| Purchase | 2 | 1 | -50% |

These are event counts, not a cohort of unique users. The sample was too small to diagnose a product failure, and Checkout counts could not previously be reconciled with unpaid Stripe Sessions. The correct conclusion was to improve observability before making another conversion change.

The separate AI-assistant baseline remains in `docs/strategy/analytics/gtm.md`: sessions increased, while engaged sessions, engagement rate, engagement time, and key events did not. GTM should therefore optimize qualified behavior, not raw AI referral volume.

---

## 3. What is now implemented

### Payment source of truth

- A Payment row is created as `PENDING` before redirecting to Stripe.
- The row stores Stripe Checkout Session ID, product, amount, acquisition attribution, and optional Face Analysis task ID.
- Signed Stripe webhooks transition the row to `COMPLETED` or `FAILED`.
- Failure reasons distinguish `checkout_session_expired` and `async_payment_failed`.
- Payment completion, credit fulfillment, and report unlocking are atomic and idempotent.
- The customer payment-history page excludes pending and failed Checkout attempts; admins can see them.

### Analytics

- `begin_checkout` carries `checkout_session_id`, `purchase_context`, and optional `face_analysis_task_id`.
- `purchase` is emitted only after the application verifies the completed Payment row.
- `purchase` is deduplicated by Stripe Checkout Session ID.
- GA custom dimension `Checkout purchase context` maps to `purchase_context`.
- Valid context values are `pricing` and `face_analysis_report`.
- Session and task IDs intentionally remain unregistered as GA custom dimensions because they are high-cardinality identifiers.

### Purchase meaning

- Face Analysis presents the offer as unlocking the current personalized glasses report.
- The USD 2.99 payment is explicitly one-time and the report remains unlocked.
- Non-expiring credits are retained as included continuation value for Try-On and Compare, not the primary explanation of the purchase.
- Stripe Checkout receives localized report-unlock supporting copy when the purchase starts from Face Analysis.
- Link remains enabled; Stripe continues to select eligible payment methods by device, currency, and geography.

### Release evidence

- Git commit: `63fe1c3` (`Track and clarify report checkout funnel`).
- Production migration: `20260810131500_track_checkout_lifecycle`.
- Vercel production build completed successfully on 2026-08-10.
- Payment-focused tests passed: 51/51.
- Full unit suite at release: 436/437; the one failure was the pre-existing Auth0 custom-domain assertion.

---

## 4. Canonical measurement

Use unique Stripe Checkout Sessions, not raw event counts.

| Metric | Definition |
| --- | --- |
| Checkout started | Unique Payment rows created in the period |
| Terminal Checkout | `COMPLETED + FAILED`; exclude still-valid `PENDING` rows |
| Checkout completion rate | `COMPLETED / (COMPLETED + FAILED)` |
| Report-unlock completion rate | Same calculation where `unlockTaskId` is present / `purchase_context = face_analysis_report` |
| Pricing completion rate | Same calculation where `unlockTaskId` is absent / `purchase_context = pricing` |
| Measurement discrepancy | Completed Payment rows without one matching GA `purchase`, or GA purchases without a completed Payment row |
| Advisor completion rate | Unique completed Face Analysis tasks / unique started Face Analysis tasks |

`PENDING` is not automatically abandonment. Treat it as actionable only after the Session reaches a terminal state or is anomalously old.

---

## 5. Observation protocol

Review after both conditions are satisfied:

1. at least 14 days have elapsed after 2026-08-10;
2. at least 30 unique Checkout Sessions exist, preferably 50.

At review time:

1. Reconcile Payment rows with Stripe Session status.
2. Compare `face_analysis_report` with `pricing` separately.
3. Segment by country, locale, device, acquisition source, and payment method only when sample size is adequate.
4. Compare Face Analysis start → completion before interpreting payment conversion.
5. Review failed reasons and unusually old pending rows.
6. Check whether GA Purchase and completed Payment totals reconcile.

Do not run simultaneous copy, price, payment-method, and layout experiments during this baseline period.

---

## 6. Conditions that reopen work

Resume engineering immediately if:

- Stripe shows a paid Session without a `COMPLETED` Payment row;
- credits or report access are not fulfilled after a completed payment;
- duplicate webhook delivery grants credits more than once;
- Checkout Session creation does not produce a `PENDING` row;
- GA Purchase materially disagrees with completed Payment records.

Resume conversion experimentation after the observation threshold only if:

- one purchase context has a consistently weaker terminal completion rate;
- a country/device/payment-method segment shows a repeated failure pattern;
- Face Analysis completion, pricing transition, or Checkout completion identifies a stable dominant drop-off;
- qualitative feedback identifies a specific trust, price, or offer-comprehension problem.

If none of these conditions appear, keep Checkout stable and return attention to qualified traffic and product continuation.

---

## 7. Known limitations

- Historical unpaid Checkout Sessions were not stored and cannot be fully backfilled.
- Stripe expiration is delayed, so recent `PENDING` rows must not be counted as failures.
- GA custom dimensions apply to newly collected data; they do not reconstruct historical event parameters in standard reports.
- Small totals should be reported as counts alongside rates.

---

## 8. Next handoff

The next person or agent should begin with this note, then read:

1. `docs/strategy/analytics/gtm.md` for current GTM priorities and AI-quality baseline;
2. `docs/product/specs/credits-pack-conversion.md` for product behavior;
3. Admin → Orders for Payment lifecycle records;
4. GA Explore using `Checkout purchase context` for behavioral segmentation.

Do not restart from the original “6 Checkout → 1 Purchase” event-count comparison without first reconciling the new server-side records.
