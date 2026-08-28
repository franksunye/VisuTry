# Merchant first-paid production validation

This is a bounded operator runbook for validating the first real paid
Merchant. It is intentionally separate from code review. Do not execute it as
part of CI, a preview deployment, or an ordinary QA session.

## Guardrails

- Obtain explicit approval before creating a real Stripe Checkout session.
- Confirm the production site is running the intended merge SHA and the
  additive billing migration is applied.
- Use one named Merchant identity and one browser session. Do not classify a
  Merchant as `REAL` until payment and activation evidence has been reviewed.
- Record Stripe event IDs, Merchant ID, plan, timestamps, and the operator.
- Do not paste full Stripe payloads, secrets, customer email, or payment data
  into tickets or chat.
- A failed validation is reversible through the documented Stripe refund or
  cancellation process; never delete the Merchant, Store, Catalog, Campaign,
  or billing ledger as cleanup.

## Pre-flight

1. Verify Vercel production owns `/api/payment/*` and `/api/merchant/*`; the
   Cloudflare edge must not execute Merchant Billing business logic.
2. Verify live-mode Price IDs for Launch, Growth, Scale, and Founding Pilot
   are present in the production environment and map to the approved plan
   contract. Do not accept a client-supplied amount or Price ID.
3. Verify the production webhook endpoint, signing secret, and enabled event
   types. Send only a Stripe test-mode event to a test endpoint when checking
   signature configuration; never mix test and live credentials.
4. Open the Admin Merchant view and capture the initial classification,
   enrollment, Store status, plan, usage, and recent billing event state.

## Founding Pilot path

1. Confirm the Merchant is eligible for the Pilot and understands `$149 / 30
   days`, the included capacity, assisted setup, and weekly review.
2. Start Checkout from the Merchant workspace. Verify the return page says
   that payment is being confirmed; it must not grant the Pilot from the
   redirect alone.
3. Complete payment only after approval. Verify the signed webhook is recorded
   and the Merchant becomes `FOUNDING_PILOT / PILOT_ACTIVE` with a fixed
   30-day period.
4. Replay the same webhook and confirm the ledger records a duplicate without
   changing the period or counting a second Pilot.
5. Verify Store browsing remains live at every usage state. At exhaustion,
   Generative Try-On is paused while Store, product links, inquiry, and
   analytics remain available.
6. Before the period ends, verify the Merchant sees a continuation choice. The
   Pilot must not silently renew or convert to Launch.

## Monthly plan path

1. Start one approved Launch, Growth, or Scale Checkout session and record the
   selected plan and Price ID from the server-side allowlist.
2. Verify the return state is processing until the subscription webhook is
   accepted. Verify the canonical Merchant plan/status and billing period are
   updated only by the webhook.
3. Verify the first billing period, usage meter, active Campaign allowance,
   Store status, and Merchant Plan & Usage copy.
4. Deliver or replay same-second and older lifecycle events in a test fixture;
   event ordering must remain deterministic by `created` then `event.id`.
5. Verify cancellation at period end keeps the current plan active through the
   recorded end date, then transitions without deleting Store or Catalog data.

## Refund and cancellation semantics

Stripe refunds and subscription cancellations are financial operations and
must be performed in the Stripe dashboard or the approved future billing
operations flow. A refund does not justify deleting application data. Record
the Stripe refund/cancellation ID and review whether the Merchant should move
to `EXPIRED`, `PILOT_EXPIRED`, or a manually approved compatibility state.
G4-C does not invent automatic refund-to-entitlement behavior or automatic
overage charging.

## Completion record

Record:

```text
operator:
merchant_id:
classification_before:
classification_after:
plan:
checkout_session_id:
webhook_event_ids:
period_start:
period_end:
store_remained_live: YES / NO
entitlement_activated_by_webhook: YES / NO
duplicate_replay_idempotent: YES / NO
refund_or_cancellation_reference:
production_data_deleted: NONE
final_verdict: PASS / FAIL
```

If any invariant fails, stop the flow, leave the Merchant and ledger intact,
and return the evidence to engineering. Do not retry by creating a second
Merchant or a second payment unless the operator explicitly approves that
new financial action.
