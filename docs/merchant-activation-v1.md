# Merchant Activation v1

**Status:** Active implementation contract; production promotion is a separate release decision
**Owner:** Merchant Product / Engineering
**Scope:** New self-service Merchant activation observability and the first-product continuation path
**Primary KPI:** Merchant First Item Activation Rate

This document is the source of truth for the Activation v1 event contract. It
does not redefine Merchant billing, pricing, Campaigns, Store presentation, or
the historical Production cohort.

## 1. Goals and boundaries

Activation v1 makes a new self-service journey measurable from workspace
creation through the first usable catalog item and Store preview. It also gives
a zero-catalog Merchant one clear next action.

The implementation is deliberately bounded:

- no Campaign functionality;
- no pricing or billing behavior change;
- no Production backfill, classification change, or data cleanup;
- no sample/demo data counted as a Merchant activation milestone;
- no replacement Store preview or second analytics system.

## 2. Source of truth

Durable activation facts are stored in PostgreSQL in
`MerchantActivationEvent` (migration
`20260907120000_add_merchant_activation_events`). The existing Merchant,
MerchantFrame, Experience, MerchantSession, and billing records remain the
authoritative state for their own domains. Activation events record the
successful transition and provide a joinable timeline by `merchantId`.

GA4/dataLayer is for acquisition and UX observation. Axiom/Vercel logs are for
operational correlation and runtime diagnosis. Neither is the activation
cohort denominator. The internal post-v1 report is implemented in
`src/modules/merchant/application/merchant-activation-report.ts` and is
rendered in the existing Admin Merchant portfolio page; it uses the durable
`MERCHANT_WORKSPACE_CREATED` event from
`classificationSource=SELF_SERVICE_SIGNUP` as its denominator.

## 3. Canonical events

Event values are defined in
`src/modules/merchant/domain/merchant-activation.ts` and intentionally reuse
the existing GA vocabulary where it exists.

| Event | Authority | Meaning | Activation stage |
| --- | --- | --- | --- |
| `merchant_workspace_created` | Server | Merchant, OWNER membership, and activation event committed by self-service creation | A0 |
| `merchant_workspace_entered` | Client, authenticated API | First workspace view in a bounded browser session | A1 |
| `merchant_profile_updated` | Server | Meaningful name and/or website update persisted | A2 |
| `merchant_catalog_started` | Client, authenticated API | Merchant explicitly enters/starts Catalog from the workspace | — |
| `merchant_first_item_added` | Server | First real Merchant frame/product successfully persisted | A3 |
| `merchant_catalog_ready` | Server | First persisted item satisfies existing Merchant frame readiness semantics | A4 |
| `merchant_store_configured` | Server | First meaningful Store configuration save succeeds | A5 |
| `merchant_store_previewed` | Client, authenticated API | Existing Store preview is opened for the Merchant | A6 |
| `merchant_store_published` | Server | Store publish state transition succeeds | A7 |
| `merchant_first_shopper_session` | Server | First real shopper session is created for the Merchant | A9 |
| `merchant_commercial_intent` | Client, authenticated API | A bounded pricing/plan intent is explicitly selected | A11 |
| `merchant_checkout_started` | Server | Checkout start is safely hookable without changing billing behavior | A12 |

A8 remains reserved for future Campaign work and is intentionally not emitted
by Activation v1. A first item is not “ready” merely because a row exists:
readiness delegates to the existing `validateMerchantFrameReadiness`
contract. Pending or invalid data can therefore be visible in the checklist
without being falsely reported as catalog-ready.

## 4. Idempotency and event semantics

`MerchantActivationEvent` has a unique `(merchantId, dedupeKey)` constraint.
First-time milestones use deterministic keys such as
`merchant:<merchantId>:first_item_added`; retries, double-clicks, Auth callback
replays, and webhook-related retries are no-ops. The workspace-created event is
written only after the Merchant and OWNER membership creation succeeds, and an
existing membership path does not manufacture a second creation milestone.

Workspace entry and other repeatable UX events use a bounded session or
resource key. A refresh in the same browser session does not create a return
visit; a new browser session can. The summary reports `workspaceSessionCount`,
`returnSessionCount`, the first timestamps, highest confirmed stage, and time
to first item / Store publish.

Client-originated writes accept only the allowlisted client event types. The
route requires authenticated Merchant membership, validates bounded IDs and
metadata, and resolves authorization from the server-side actor context rather
than trusting a `merchantId` or analytics payload.

## 5. Signup correlation and attribution

The browser keeps two opaque, random, bounded values in `sessionStorage`:

- `visutry_merchant_signup_correlation_id` for the signup journey;
- `visutry_merchant_activation_session_id` for the bounded workspace session.

At workspace creation, the first-touch snapshot is sanitized and persisted in
the workspace-created event metadata. Supported fields are:

`landing_page`, `acquisition_source`, `acquisition_medium`, `referrer_host`,
`utm_source`, `utm_medium`, `utm_campaign`, `commercial_intent`,
`signup_correlation_id`, and `landing_locale`.

The snapshot is first-touch only, uses a pathname instead of a full URL, stores
only a referrer host, enforces length limits and allowlists, and rejects values
that look like email addresses, URLs, control data, or unsafe IDs. No raw
email, IP, auth token, cookie, full user-agent, or full referrer URL is stored
in activation events.

## 6. GA4 and Axiom roles

`merchant_onboarding_started` is emitted by the onboarding component through
the existing Campaign Event Layer. That layer performs one GA4 emission and
one dataLayer push; it does not send the event to the Consumer first-party
funnel. The component test and analytics transport test cover the emission and
the absence of a duplicate.

The historical GA4 value of zero cannot be reconstructed from application code
alone. It may reflect signup timing, consent, event registration/reporting
configuration, or the historical call path. Activation v1 fixes and tests the
application emission path; GA4 account-side visibility remains an operational
verification item rather than a reason to use GA4 as the cohort source.

Every server-authoritative milestone emits the existing structured Merchant
log shape: `domain=merchant`, `event=merchant_activation`,
`activationEvent`, `merchantId`, `environment`, and bounded correlation
context where available. Logs contain no raw request body, email, IP, token,
or Stripe secret. Merchant operator activation logs remain distinct from
Consumer and Store/Campaign shopper telemetry.

## 7. First-product success path

The existing Merchant Control Center shows the activation checklist only when
it is relevant:

1. **Add your first product** when there is no usable catalog item;
2. **Preview your Store** when a usable item exists but the Store has not been
   previewed/configured;
3. **Publish your Store** when the existing Store path makes publishing valid.

An existing active Store returns to the normal Control Center and is not taken
over by the checklist. Pending/invalid catalog rows are not treated as a
successful first product; the UI explains that the product is still being
prepared and links to Catalog. A successful manual add shows immediate
confirmation and the appropriate next action. The existing Store preview
component is reused.

Manual first-product creation remains the primary v1 path because it is the
clearest guaranteed path observed in the historical activated cases. Existing
website, CSV, and Agent-assisted paths remain secondary options and are not
silently reimplemented here.

## 8. Historical versus post-v1 cohorts

The historical Production research baseline remains **pre-instrumentation**:
41 confirmed self-service Merchants, 2 reaching Catalog/Store, and a 2/41
(4.9%) observed first-item baseline. Activation v1 does not backfill workspace
returns, sessions, attribution, or milestones that were not recorded.

The post-v1 report starts a new denominator at the first durable
`merchant_workspace_created` event. This preserves the distinction between
known historical state and newly measurable journeys. Existing catalog/store
state can still be shown as current state, but it is not rewritten as a
historical Activation event.

## 9. Three-environment QA contract

Activation QA follows the long-lived
[`Environment Isolation Contract`](engineering/environment-isolation-contract.md):

- **Local:** repository-local PostgreSQL and local seed data only;
- **Preview:** fixed `https://visutry-pre.vercel.app`, persistent isolated Neon
  Preview branch, `APP_ENV=preview`, Stripe TEST, and `VISUTRY_PREVIEW_QA=1`;
- **Production:** separate live resources; no Preview harness, no direct QA
  mutation, and no Production deployment as part of this task.

Preview browser QA reuses the fixed `TEST` Merchant pool documented in
[`docs/g4c-preview-qa.md`](g4c-preview-qa.md): `QA-FREE`, `QA-PILOT`,
`QA-SUBSCRIPTION`, and `QA-USAGE`. These are long-lived aliases, not disposable
accounts. Do not create a new QA Merchant for an ordinary run, use the
`POSSIBLE_EXTERNAL` G4 QA Merchant as a substitute, or point Preview at
Production.

After a Preview deployment is READY, bind its deployment URL to the fixed
alias before Auth0/browser validation:

```bash
vercel alias set <ready-preview-deployment>.vercel.app \
  visutry-pre.vercel.app --scope sunye
```

Preview schema changes use the guarded Preview bootstrap/release procedure;
the default guarded build skips migrations outside Production. No Activation
v1 command deletes billing history or provides arbitrary SQL execution.

## 10. Review checklist

Before Production promotion, the PR must demonstrate:

- additive migration only, with no backfill;
- server-authoritative creation/first-item/readiness/Store milestones;
- same-session entry dedupe and measurable return sessions;
- first-touch attribution bounded and PII-free;
- zero-catalog checklist and truthful pending state;
- Admin report usable without manual GA4+Axiom joins;
- typecheck, unit/regression, migration boundary, Prisma validation, both
  builds, and diff check passing;
- fixed Preview URL, isolated Preview database, TEST Stripe mode, and no
  Production access during QA.

The final release report must separately state Preview results and the fact
that Production remains untouched.
