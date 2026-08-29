# VisuTry Environment Isolation Contract

**Status:** Active source of truth
**Last reviewed:** 2026-08-29
**Owner:** Engineering
**Scope:** Local development, Vercel Preview, Production, database identity, payment mode, and QA data ownership.

This document defines the long-lived operating contract for the three VisuTry
environments. It is the operational companion to the environment guards and
build scripts in the repository. It contains no credentials or secret values.

## 1. Environment contract

| Environment | Application owner | Required identity | Database | Stripe mode | QA policy |
| --- | --- | --- | --- | --- | --- |
| Local | Local Next.js process | `APP_ENV=local` | Repository-local PostgreSQL at `.local/postgres` (`127.0.0.1:5433`, `visutry_local`) | Test/development only | Local seed data only; reset is allowed inside the repository-local cluster |
| Preview | Vercel Preview deployment | `VERCEL_ENV=preview`, `APP_ENV=preview` | Persistent Neon Preview branch, checked by a non-secret database marker | Stripe TEST | Preview QA harness only; fixed `TEST` Merchants |
| Production | Vercel Production deployment | `VERCEL_ENV=production`, `APP_ENV=production` | Production Neon database | Stripe LIVE | No Preview harness, no direct QA mutation |

The application environment must be explicit. `requireExplicitAppEnvironment()`
rejects a missing or invalid `APP_ENV`; database-bound operations verify the
environment marker before a bounded mutation.

## 2. Ownership and configuration

### Local

Local database operations are provided by the repository scripts:

```bash
npm run db:local:up
npm run db:local:migrate
npm run db:local:seed
npm run db:local:status
npm run db:local:down
```

`npm run db:local:reset` is destructive only to the repository-local
`.local/postgres` cluster. The script refuses known Neon endpoints and keeps
the local data identity separate from Preview and Production.

Do not point Local `DATABASE_URL` at Neon. Set the Local connection and
identity in `.env` before starting the app, for example:

```text
APP_ENV=local
VISUTRY_DATABASE_IDENTITY=local:127.0.0.1:5433/visutry_local
DATABASE_URL=postgresql://visutry_local@127.0.0.1:5433/visutry_local
DATABASE_URL_UNPOOLED=postgresql://visutry_local@127.0.0.1:5433/visutry_local
```

`npm run dev:local` starts Next.js using the existing `.env`; it does not
select a remote database for you. The `db:local:*` scripts supply the local
connection for their own migration, seed, and status operations. Use
`npx prisma` directly only when the command is deliberately scoped to the
local connection.

### Preview

Preview is the shared, persistent QA environment for all Vercel Preview
branches. The Vercel project-level Preview variables are the default for every
Preview branch; a branch-specific override is an exception and must be
documented before use.

The Preview database is identified by the non-secret marker:

```text
neon:steep-silence-18355430:br-raspy-cake-adwjq4e
```

The marker is verified by the Preview bootstrap and QA guard. The guarded
`migrate-deploy.sh` intentionally skips migrations outside Production;
Preview schema/bootstrap changes therefore use the explicit Preview
bootstrap/release procedure, not an implicit Production migration.

Preview Merchant billing uses Stripe TEST configuration. The bounded QA
harness additionally requires:

```text
VISUTRY_PREVIEW_QA=1
STRIPE_MERCHANT_BILLING_MODE=test
```

The harness refuses Production hosts, live Stripe keys, mismatched database
markers, and any Merchant that is not classified `TEST`.

The fixed QA Merchant pool and its reuse rules are maintained in
[`docs/g4c-preview-qa.md`](../g4c-preview-qa.md). Do not create a new QA
Merchant for an ordinary repeat run and do not use a `REAL` or
`POSSIBLE_EXTERNAL` Merchant as a substitute.

### Production

Production is the only environment allowed to use the live Stripe mode and
Production Neon database. Production migrations are fail-closed and require
explicit authorization:

```text
VERCEL_ENV=production
VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1
```

Production Merchant billing, Store, and catalog behavior must be exercised
through normal application routes and release procedures. The Preview QA
harness must never be enabled in Production, and no production database
mutation should be performed through ad hoc SQL or a QA fixture.

## 3. Data and provider boundaries

The following boundaries are permanent:

1. Local data is disposable and repository-scoped.
2. Preview data is persistent QA data and is never Production data.
3. Production data is never used for unit tests or Preview fixtures.
4. Stripe TEST events stay in Preview/Local; Stripe LIVE events stay in Production.
5. Merchant `classification` controls commercial KPI inclusion, not authorization.
6. `TEST` runtime usage may exist for QA, but it must remain excluded from REAL-only commercial metrics.
7. Environment isolation is not achieved by naming alone; runtime guards, database markers, and build/deployment configuration must agree.

## 4. Fixed Preview QA Merchant pool

The long-lived Preview QA assets are stable aliases, not disposable accounts:

| Alias | Stable slug | Primary fixture purpose | Classification |
| --- | --- | --- | --- |
| `QA-FREE` | `g4c-qa-free` | Canonical FREE Store, catalog, and basic recommendation | `TEST` |
| `QA-PILOT` | `g4c-qa-pilot` | Stripe TEST Founding Pilot lifecycle | `TEST` |
| `QA-SUBSCRIPTION` | `g4c-qa-subscription` | Stripe TEST recurring subscription lifecycle | `TEST` |
| `QA-USAGE` | `g4c-qa-usage` | 69/70/90/100% AI Commerce Session thresholds | `TEST` |

These records are created or reused by the supported Preview QA command. The
operator must use the alias and the command output's `merchantId`, rather than
hard-coding an ID across environments. Fixed QA Merchants are not deleted or
recreated during normal test maintenance; supported fixtures may append or
advance state while preserving billing ledger/history.

`G4 QA Merchant 20260828` is not part of this pool because it is classified
`POSSIBLE_EXTERNAL`. It must not be used as a Preview QA substitute.

## 5. Standard workflows

### Pull request

```text
Local deterministic checks
→ GitHub Quality Gate
→ Vercel Preview build/deployment
→ bounded Preview QA when provider/runtime validation is needed
→ merge main
→ Production deployment and smoke
```

Preview branches share the Preview environment contract. A new branch does
not imply a new database, Stripe account, or QA Merchant pool.

### Preview QA

Run the bounded harness from a Vercel Preview environment and follow the
commands in [`docs/g4c-preview-qa.md`](../g4c-preview-qa.md). Paid state must
come from the normal Stripe TEST Checkout/webhook path; the harness may set
bounded usage or period-end fixtures only after the required Stripe evidence
exists.

### Production release

Use the guarded default Vercel build path, confirm the deployed commit and
required migration, then run the smallest approved production smoke. Never
reuse Preview fixture commands or Preview credentials in that smoke.

## 6. Change control

When the environment mapping, database branch, payment mode, migration
boundary, or fixed QA Merchant policy changes, update all of the following in
the same change:

- this contract;
- [`docs/guides/development-guide.md`](../guides/development-guide.md) when developer commands change;
- [`docs/g4c-preview-qa.md`](../g4c-preview-qa.md) when QA fixtures change;
- `.env.example` when variable names or example semantics change;
- the relevant runtime guard or test that enforces the boundary.

Review this contract monthly and before any change to Auth0, Neon, Stripe,
Vercel, migration behavior, or Preview QA data ownership.
