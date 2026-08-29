# VisuTry Quality Assurance Strategy

Status: Active
Owner: Engineering
Scope: Consumer + Store + Shared Core

## 1. Purpose

VisuTry quality assurance must protect two things at the same time:

1. Consumer stability: existing B2C workflows must not regress while Store evolves.
2. Merchant Pilot correctness: Store commercial, tenancy, usage, retention, and intent flows must be deterministic before real merchant traffic is scaled.

The QA system is intentionally layered. Fast, deterministic checks block every PR. Environment-heavy or provider-dependent checks run later and must not make the basic PR gate flaky.

## 2. Quality Gates

### L1 — Static Gate

Runs on every pull request to `main` through GitHub Actions.

Required checks:

- TypeScript: `npm run typecheck`
- Dependency installation must complete with `npm ci`

Purpose:

- catch invalid contracts and type drift before deployment
- catch code paths that no longer compile independently of Vercel

Blocking: YES.

### L2 — Unit + Regression Gate

Runs on every pull request to `main` through GitHub Actions.

Command:

- `npm run test:unit:ci`

Local equivalent for L1 + L2:

- `npm run qa:pr`

Rules:

- deterministic only
- no real Gemini / Grsai / Stripe / Resend calls
- no dependence on production databases
- no dev server requirement
- a failing test must produce a non-zero process exit code

Blocking: YES.

Protected regression areas:

#### Consumer

- Face Detector
- Advisor
- Try-On generation contracts
- settlement / credits
- Compare
- Store must never become a dependency of Consumer

#### Store

- merchant tenant isolation
- MerchantSession creation and expiry
- recommendation contracts
- Try-On idempotency and settlement
- Store retention
- intent/event persistence
- entitlement / allowance / renewal rules

#### Shared Core

- Consumer and Store may share stable capabilities
- shared code must not embed Store-specific commercial policy
- provider identity must not leak into merchant-facing entitlement contracts

### L3 — Build / Preview Gate

Runs through the existing Vercel Git integration for every PR.

Vercel remains the deployment/build authority because it has the correct project environment and preview configuration.

Required outcome:

- Preview Deployment = READY

Vercel's normal `npm run build` path is:

`prisma generate && bash scripts/migrate-deploy.sh && next build`

Important:

- GitHub Actions does NOT execute database migrations.
- `scripts/migrate-deploy.sh` skips successfully for Preview/CI/local builds.
- Production migration requires `VERCEL_ENV=production` and
  `VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1`; `build:production` is an alias
  for the same guarded build path.
- A Vercel preview failure blocks merge even when L1/L2 pass.

Blocking: YES.

### Environment and QA data ownership

The three-environment operating contract is maintained in the
[Environment Isolation Contract](environment-isolation-contract.md). Local
tests use repository-local data; Vercel Preview uses the persistent Preview
database and Stripe TEST configuration; Production uses separate live
resources.

Provider-dependent Preview validation must reuse the fixed `TEST` Merchant
pool and bounded fixtures documented in [`docs/g4c-preview-qa.md`](../g4c-preview-qa.md).
Do not create disposable QA Merchants for ordinary repeat runs, use
Production data in Preview, or use `REAL`/`POSSIBLE_EXTERNAL` Merchants as QA
substitutes. A test Merchant may exercise runtime entitlement state while
remaining excluded from REAL-only commercial KPI.

All browser and provider-dependent Preview checks use the fixed entry point
`https://visutry-pre.vercel.app`. A deployment-specific Vercel URL is only an
artifact URL; bind it to the fixed alias after the deployment is READY before
starting authenticated QA. Auth0 therefore needs one stable Preview callback,
not a new callback entry for every deployment.

### L4 — Integration / E2E / Provider Validation

Runs on release, when risk requires it, or manually before significant production changes.

Examples:

- `npm run test:integration:new`
- `npm run test:api`
- `npm run test:workflows`
- `npm run test:e2e:playwright`
- provider smoke tests such as Gemini / Grsai

Rules:

- real provider tests are not part of the basic PR gate
- secrets must never be required by L1/L2
- provider failures must be distinguishable from product regressions
- destructive or billable tests require explicit execution

Blocking: risk-based.

## 3. Required PR Flow

```text
Developer / Agent
      ↓
Pull Request
      ↓
GitHub Actions: Quality Gate
  L1 TypeScript
  L2 Unit + Regression
      ↓
Vercel Preview
  L3 Build / Preview
  Fixed alias: https://visutry-pre.vercel.app
      ↓
Optional L4 Integration / E2E / Provider Smoke
      ↓
Merge main
      ↓
Production Deployment
```

A PR is merge-ready only when all required GitHub checks pass and the Vercel preview is READY.

## 4. Test Placement

Use domain-oriented placement for new tests.

Preferred structure:

```text
tests/
  unit/
    consumer/
    store/
    shared/
    architecture/

  integration/
    consumer/
    store/
    api/

  e2e/
    consumer/
    store/
```

Existing tests do not need to be moved solely for aesthetics. Move files only when touched or when ownership is ambiguous.

## 5. What Must Be Tested When Code Changes

### Consumer change

At minimum:

- changed domain/application behavior
- protected Consumer regression affected by the change
- Store dependency boundary if shared code changes

### Store change

At minimum:

- tenant ownership
- session capability/expiry behavior
- idempotency for write/generation paths
- entitlement/usage behavior when commercial policy is touched
- retention behavior when assets/tasks are touched

### Shared capability change

At minimum:

- Consumer behavior remains stable
- Store behavior remains stable
- no Store commercial logic enters shared core

### Commercial policy change

At minimum:

- plan resolution
- allowance resolution
- billing/entitlement period boundaries
- commercial exceptions
- renewal/reset behavior

## 6. Legacy Test Runner

`tests/scripts/run-all-tests.js` is retained as a legacy/manual orchestration utility.

It is NOT a PR merge gate.

Reasons:

- it starts a development server even for suites that do not require one
- it mixes unit, integration, E2E, and environment concerns
- historical pattern assumptions do not represent all current TypeScript tests

CI must call Jest directly through the explicit package scripts instead of relying on this runner.

Do not expand the legacy runner. New QA automation belongs in GitHub Actions and explicit npm scripts.

## 7. Merge Gate Policy

Required before merge:

- `Quality Gate / Static + Unit Regression` = success
- Vercel Preview = success / READY
- no unresolved P0/P1 review issue

Do not bypass a failed quality gate by merging first and fixing on `main`, except for an explicit production incident response.

## 8. Stop Conditions / Scope Control

This QA consolidation is complete when:

- PRs automatically run deterministic TypeScript + unit/regression checks
- failed tests block through a non-zero CI status
- Vercel remains the environment-aware build/preview gate
- external provider tests remain separated from basic PR validation
- engineering has one documented rule for where each class of test runs

Do not add heavyweight CI infrastructure, coverage gates, matrix builds, or mandatory provider calls until real failure data shows they are needed.
