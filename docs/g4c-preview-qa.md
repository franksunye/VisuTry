# G4-C Preview QA Harness

**Status:** Active Preview QA operating guide
**Last reviewed:** 2026-08-29
**Owner:** Engineering
**Environment contract:** [`docs/engineering/environment-isolation-contract.md`](engineering/environment-isolation-contract.md)

The G4-C harness is a bounded, Preview-only operator tool. It is not an
Admin UI and it is not available through an application route.

## Canonical Preview entry point

Open and validate Preview only at:

```text
https://visutry-pre.vercel.app
```

Each Vercel Preview deployment also has a random deployment URL. That URL is
not the QA entry point because it would require a new Auth0 callback allow-list
entry. Once the deployment is READY, bind it to the fixed alias and then use
the fixed alias for all browser and provider-dependent checks:

```bash
vercel alias set <ready-preview-deployment>.vercel.app \
  visutry-pre.vercel.app --scope sunye
```

The alias is a stable pointer, not a separate database or payment
environment. Preview still uses the persistent Preview Neon branch and Stripe
TEST configuration described below. Auth0 is configured once for the fixed
callback:

```text
https://visutry-pre.vercel.app/api/auth/callback/auth0
```

Every command that reads or mutates QA state must run with all of the
following conditions:

```text
VERCEL_ENV=preview
APP_ENV=preview
VISUTRY_PREVIEW_QA=1
VISUTRY_DATABASE_IDENTITY=neon:steep-silence-18355430:br-raspy-cake-adwjq4e
STRIPE_MERCHANT_BILLING_MODE=test
STRIPE_SECRET_KEY=sk_test_...
```

The tool refuses Production, production application URLs, live Stripe keys,
missing/wrong Preview database markers, and any Merchant that is not `TEST`.
A `REAL` Merchant is rejected before a fixture write is attempted. Billing
ledger/history is append-only from the harness perspective; there is no delete
or arbitrary SQL command.

Run from the Preview environment so the command receives the project-level
Preview database and Stripe TEST configuration. Replace `<preview-branch>`
with the current Preview branch; all ordinary Preview branches inherit the
same project-level Preview variables. Browser QA must still use
`https://visutry-pre.vercel.app` after the alias is bound:

```bash
vercel env run -e preview --git-branch <preview-branch> -- \
  npx tsx scripts/merchant-preview-qa.ts ensure
```

This creates or reuses only these fixed QA Merchants, all with classification
`TEST`:

| Alias | Stable slug | Intended use |
| --- | --- | --- |
| `QA-FREE` | `g4c-qa-free` | FREE Store, catalog, and basic recommendation |
| `QA-PILOT` | `g4c-qa-pilot` | Stripe TEST Founding Pilot lifecycle |
| `QA-SUBSCRIPTION` | `g4c-qa-subscription` | Stripe TEST recurring subscription lifecycle |
| `QA-USAGE` | `g4c-qa-usage` | AI Commerce Session usage thresholds |

The aliases are the stable operator interface; the command output is the
source for the current `merchantId` in this Preview database.

New fixtures start as canonical `FREE`. The harness never upgrades them by
writing a paid plan. Use the normal Preview Stripe TEST Checkout to activate
`QA-PILOT`, `QA-SUBSCRIPTION`, or `QA-USAGE`; the lifecycle fixtures refuse to
run until the Merchant has a matching `PROCESSED` Stripe TEST event and, for a
subscription, a Stripe subscription identity.

### Fixed QA Merchant maintenance

The four QA Merchants are long-lived Preview assets. Reuse them across branches
and test runs; do not delete/recreate them or create a new QA Merchant for an
ordinary repeat run. Use the supported `ensure`, snapshot, usage, expiry, and
event replay commands to prepare a bounded state. Billing ledger/history is
preserved.

The harness requires `classification=TEST` before any read or mutation and
rejects `REAL` before a write. `G4 QA Merchant 20260828` is intentionally not
in this pool because its classification is `POSSIBLE_EXTERNAL`; it must not
be used as a substitute. QA plan state is runtime test data and does not make
the Merchant part of REAL commercial KPI.

## Commands

Read a bounded state snapshot:

```bash
npx tsx scripts/merchant-preview-qa.ts snapshot --merchant=QA-FREE
```

Set usage thresholds on a Stripe-activated paid QA Merchant. The command uses
the canonical `MerchantUsageLedger`, appends only missing rows, and supports
the deterministic sequence `69 → 70 → 90 → 100`. It never deletes or rewrites
usage history and refuses to lower an existing period's usage:

```bash
npx tsx scripts/merchant-preview-qa.ts usage-threshold --merchant=QA-USAGE --percent=69
npx tsx scripts/merchant-preview-qa.ts usage-threshold --merchant=QA-USAGE --percent=70
npx tsx scripts/merchant-preview-qa.ts usage-threshold --merchant=QA-USAGE --percent=90
npx tsx scripts/merchant-preview-qa.ts usage-threshold --merchant=QA-USAGE --percent=100
```

After each command the output includes environment, Merchant id,
classification, before state, fixture action, after state, and `PASS` or
`FAIL`. At 100%, the resolver must still report Store available and Try-On
unavailable.

Expire a Pilot only after the normal Preview TEST Pilot checkout has produced
`PILOT_ACTIVE` and a processed Pilot receipt. The fixture changes only the
Preview Merchant period end; it does not change the receipt ledger. The
command verifies `PILOT_EXPIRED`, live Store state, disabled Try-On, and
unchanged historical Pilot revenue:

```bash
npx tsx scripts/merchant-preview-qa.ts pilot-expire --merchant=QA-PILOT
```

Prepare a subscription boundary after a real Preview TEST subscription
activation. `expired` is the default; `near-expiry` places the boundary five
minutes ahead. Neither mode fabricates the initial activation:

```bash
npx tsx scripts/merchant-preview-qa.ts subscription-boundary --merchant=QA-SUBSCRIPTION --mode=expired
npx tsx scripts/merchant-preview-qa.ts subscription-boundary --merchant=QA-SUBSCRIPTION --mode=near-expiry
```

Replay an existing Stripe TEST event through the same
`processMerchantStripeEvent` implementation used by the Preview webhook
route. Repeating twice is the bounded duplicate-event check; the command
retrieves the event from Stripe and refuses non-Merchant events or a different
Merchant identity:

```bash
npx tsx scripts/merchant-preview-qa.ts replay-event \
  --merchant=QA-SUBSCRIPTION --event-id=evt_... --repeat=2
```

Retryable `SUBSCRIPTION_NOT_READY`, terminal price/identity rejection, older
event ordering, and same-timestamp ordering remain covered by the existing
Merchant Billing fixture tests. Those tests call the same application
processor; they do not introduce a second billing state machine.

Run the guardrail and billing fixture regression with:

```bash
npm run test:merchant-preview-qa
```

No Production admin mutation control, Cloudflare billing implementation, or
generic SQL execution tool is part of this harness.

## Environment isolation

Preview uses the persistent schema-only Neon branch `preview` and is identified
by the non-secret marker `neon:steep-silence-18355430:br-raspy-cake-adwjq4e`.
Production keeps its existing Neon connection and live Stripe configuration.
The marker is registered by the bounded Preview bootstrap only after the
schema-only branch is selected:

```bash
vercel env run -e preview --git-branch codex/g4c-commercial-launch -- \
  npx tsx scripts/preview-db-bootstrap.ts
```

The bootstrap is intentionally specific to that branch. It marks the schema
copied by Neon as the existing migration baseline, applies the environment
identity migration, and registers `PREVIEW`; it cannot target Production.

For Local development, Docker is optional when native PostgreSQL 16 is
available:

```bash
npm run db:local:up
npm run db:local:migrate
npm run db:local:seed
npm run db:local:status
npm run db:local:down
```

`npm run db:local:reset` is destructive only to the repository-local
`.local/postgres` cluster. Local seed data uses fixed `TEST` merchants and the
synthetic `mock-user-1`; it never connects to a Neon URL. For Stripe TEST
webhook development, use `stripe listen --forward-to
http://localhost:3000/api/payment/webhook` after logging into the Stripe CLI.
