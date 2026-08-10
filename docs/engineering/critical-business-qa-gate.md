# Critical Business QA Gate

## Purpose

Protect revenue- and state-sensitive VisuTry workflows from regressions while allowing low-risk UI, SEO, and performance changes to move quickly.

The first protected critical journey is Face Analysis:

`Auth → Upload → Local geometry → AI submit → Quota/Credits → Report → Unlock checkout → Stripe fulfillment`

## Pull request gate

Every pull request to `main` runs `.github/workflows/quality-gate.yml`.

Required checks:

1. **Critical scope report**
   - Reports changes under Face Analysis, auth, quota, payment, Stripe, and Face Analysis service runtime paths.
   - The report is informational; the critical regression tests remain mandatory for every PR so a UI-only change cannot accidentally bypass them.

2. **TypeScript gate**
   - `npm run typecheck`

3. **Critical business journey gate**
   - `npm run test:critical:ci`
   - Protects Face Analysis session gating, upload/submit wiring, no-credit behavior, quota source priority, completion-only quota deduction, failure/no-charge behavior, unlock checkout ownership/state rules, and Stripe webhook idempotency/fulfillment.
   - Uses mocks and isolated test state only. It never calls production AI, Stripe, or the production database.

4. **Full unit/regression gate**
   - `npm run test:unit:ci`
   - Protects the rest of the application and catches cross-feature regressions.

5. **Playwright suite discovery**
   - `npm run test:e2e:list`
   - Ensures critical/smoke browser suites remain discoverable and are not silently removed or misconfigured.

A local equivalent is available through `npm run qa:pr`.

## Production smoke

`.github/workflows/production-smoke.yml` runs after pushes to `main`, on a schedule, and on demand.

The smoke test is deliberately non-mutating. It verifies key public routes, Face Analysis product markers, and unauthenticated protection on Face Analysis submit and payment checkout endpoints. It must never spend credits, call an AI generation endpoint as an authenticated user, or create a Stripe Checkout Session.

## Build responsibility

The GitHub PR gate intentionally uses dummy database URLs and never connects to production data. A full Next.js build currently prerenders database-backed admin pages, so the authoritative environment-backed build check remains the Vercel preview/production deployment rather than connecting GitHub PR CI to a real database.

## What this gate does not prove

The deterministic gate does not perform a real external-provider transaction. It does not charge a Stripe test card, consume a real AI provider request, or mutate a real user account.

If VisuTry later adds a dedicated staging database plus test Auth/Stripe/AI credentials, add a separate staging E2E workflow for the full external-provider journey. Keep that workflow isolated from production accounts and production billing.

## Merge rule

Do not merge a PR when the Quality Gate is red. For changes touching auth, quota, payment, Face Analysis submit/report, or Stripe fulfillment, review the Critical scope report in addition to the green automated checks.
