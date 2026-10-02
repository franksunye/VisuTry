# Local Merchant Growth Lab

**Status:** Active operating procedure
**Owner:** Product / Engineering
**Last updated:** 2026-10-02
**Scope:** Guarded Local development and QA for Merchant activation, operating workspaces, Store/Campaign lifecycle, and Merchant regressions without Preview/Production mutation.

The Local Merchant Growth Lab is the primary development and QA environment
for Merchant acquisition through private Store Preview. It uses repository-local
PostgreSQL, guarded mock identities, and Stripe TEST configuration only.

For the reusable VisuTry Demo Optical Store, use the separate
[Local Demo Runtime Contract](./local-demo-runtime-contract.md). It owns the
`demo:local:seed`, `demo:local:dev`, and browser network verification loop;
the Merchant Growth Lab's clean-onboarding seed/reset remains separate.
The canonical Demo identity and provider policy are defined in the
[VisuTry Demo Environment Contract](../ops/visutry-demo-environment-contract.md).

## First run

```bash
cp .env.local.example .env.local
npm install
npm run merchant:local:bootstrap
npm run merchant:local:dev
```

Open `http://127.0.0.1:3001/en/business`.

## Repeatable browser QA loop

```bash
# Each gate prepares its own marked disposable E2E database and starts/stops
# its own Local Next server. Run sequentially; both commands are repeatable.
npm run merchant:local:e2e
npm run merchant:local:p1-m1:e2e
npm run merchant:local:campaign:e2e
```

The browser gates require the repository Local PostgreSQL endpoint
(`127.0.0.1:5433`) with the normal `visutry_local` database marker. If the
repository-local PostgreSQL server is not running, the gate starts it through
`db:local:up`. Each command then resets only the separately owned
`visutry_local_merchant_e2e` database after verifying its exact `LOCAL`
`EnvironmentMetadata` marker, reapplies the current schema, and seeds the
repository-owned mock identities plus TEST Merchant fixtures. A database with
that reserved name but a missing or different marker is never reset. The gate
serves the browser journey at `http://127.0.0.1:3003`, refuses an occupied port,
and shuts down the server on completion. Runs share a lock in the Git common
directory, so parallel linked worktrees cannot reset this shared Local test DB
while another E2E is using it.

`clean@local.test` is owned by the test harness and must have no Merchant at
the start of each run; `existing@local.test` owns the four seeded QA TEST
Merchants, including `Local QA-USAGE`. Those identities and fixture rows are
recreated on each isolated-database bootstrap, not inferred from the state of
the interactive `visutry_local` development database. No whole-cluster reset is
needed for these browser gates. `merchant:local:reset-clean` remains a separate
manual development command and must not be used as an E2E fixture reset.

### Merchant dashboard visual QA

Use the repository-owned deterministic seed and capture commands for Home and
Analytics visual review; do not create one-off `/tmp` Playwright scripts for
normal Merchant UX review. The seed writes only canonical Local
`MerchantSession`, `MerchantEvent`, and `MerchantIntent` rows for the exactly
marked `Local Commerce Intelligence Lab` TEST merchant. It never writes
dashboard aggregates or real shopper identity/photo data. The separate capture
command is read-only: it validates Local mock-auth, TEST Stripe, the loopback
database, and the fixture; starts its own Local Next server; blocks browser
requests outside loopback; and writes a machine-readable manifest and
screenshots only under the ignored `.local/merchant-dashboard-capture/<run-id>/`
directory.

```bash
npm run merchant:local:dashboard:seed -- --preset showcase
npm run merchant:local:dashboard:capture

npm run merchant:local:dashboard:seed -- --preset low-volume
npm run merchant:local:dashboard:capture

npm run merchant:local:dashboard:seed -- --preset empty
npm run merchant:local:dashboard:capture
```

`showcase` is the visual-review default and has complete 30-day current and
previous periods, natural weekly cadence, several campaign lifts, four
distinct Store/Campaign contexts, eight TEST frames, varied canonical shopper
events/intents/sources, and anonymous activity within 15 minutes. `low-volume`
retains the sparse 34-session reliability-boundary sample; `empty` contains no
session, event, or intent rows. Re-seeding one preset replaces only rows proven
to belong to this exact fixture. Seed and capture are deliberately separate so
re-running capture cannot mutate data.

The capture includes Home and Analytics at 1440×900 and 390×844; current
30-day and 7-day views where applicable; viewport and full-page captures; the
mobile navigation open state; anonymous Recent Activity; and keyboard
chart-tooltip verification when a chart exists. The manifest records the
checked-out Git SHA, preset, fixture/database identity, period and activity
counts, event/intent/source distributions, routes, viewport/state, screenshot
names, HTTP and browser errors, smooth-curve/overflow/broken-image checks, and
a stable scene/step contract for a future WebM capture mode. Screenshot output
is Local-only evidence; capture does not reset or reseed the fixture, call
providers, or access Preview/Production. If Local DB settings are not already
exported or present in `.env.local`, provide explicit loopback `DATABASE_URL`,
matching `DATABASE_URL_UNPOOLED` and `VISUTRY_DATABASE_IDENTITY` values with
mock auth and TEST Stripe enabled.

The golden path is:

```text
Business → Local QA Clean Merchant → name gate → workspace
→ first manual product → Catalog ready → Store draft → private Preview
```

The Campaign workspace browser journey creates a fresh FREE Merchant with
`LOCAL-MERCHANT-CLEAN`, then uses the seeded `QA-USAGE` Growth TEST Merchant
for the allowed activation path. It prepares Catalog/Store private-Preview
state through the normal authenticated Local APIs, then exercises Campaign
Draft, readiness, private Preview, the Free-plan allowance response, explicit
Campaign Publish, immediate Live edits, and Archive in the browser. It never
publishes the Store or accesses Preview/Production data.

It stops before Store Publish and payment. Campaign lifecycle actions are
explicitly exercised because they are the subject of this test. All Merchant,
Catalog, Store, Campaign, and activation writes use the real local application
and local PostgreSQL. The
deterministic product image is repository-owned at
`/assets/glasses-presets/large-round-classic.jpg`.

## P1-M1 First Value validation

P1-M1 defines First Value as a private Store Preview that visibly contains the
Merchant's own first product. The local validation path intentionally stops
before Publish and payment:

```text
Clean Merchant
→ Add your first product
→ product name + image + SKU or product URL
→ Review product → Approve and import
→ Create Store draft
→ when exactly one eligible product exists, it is selected automatically
→ when multiple products exist, select products → Save products
→ Preview your Store
```

The first-use path deliberately stops at the private Preview. Publish, Store
customization, additional products, and Agent connection remain available as
follow-up actions after First Value; they are not prerequisites for it. The
Merchant workspace surfaces the human action first and keeps Agent connection
as a secondary accelerator.

The workspace has two lifecycle modes. The First Value path remains
activation-first and culminates in the durable `merchant_store_previewed`
milestone. Runtime Operating eligibility, however, is resolved separately from
activation analytics: Preview event, Publish event, or an actual ACTIVE Store
can enter Operating Mode without fabricating historical activation events.
Home, Catalog, Store, Campaigns, and Analytics are primary destinations; More
contains Integrations, Plan & Usage, and Settings. The mobile More control
remains visible while the primary navigation is horizontally scrollable.
Switching Merchants remounts the keyed client workspace so lifecycle and local
control state cannot leak between Merchant contexts.

The compatibility regression for an ACTIVE Store with no historical
Preview/Publish event is `tests/e2e/p1-operating-mode-compat.spec.ts`. It must
prove Operating Home plus direct Catalog/Store/Campaign routes while leaving a
true pre-First-Value Merchant in Activation Mode and writing no activation
history.

The first-product form keeps the minimum identity fields visible and moves
shape, brand, and price into optional details. After the first import, the
success state links directly to Store setup. The Store draft uses its default
details until the Merchant chooses to add copy, so the next action remains
clear. Preview is private and must show the imported product; it must not start
a shopper session or publish the Store.

The canonical activation events remain the source of truth and should be
observed in this order where the domain state supports them:

```text
merchant_workspace_created
→ merchant_first_item_added
→ merchant_catalog_ready
→ merchant_store_configured
→ merchant_store_previewed
```

Run the same reset/bootstrap loop before measuring a fresh journey. Record
time-to-first-value from the first workspace view to the successful private
preview, plus the number of required fields, clicks, and screens. Historical
activation data is not backfilled by this procedure.

To verify the analytics fail-closed guard with intentionally fake valid GA/GTM
IDs, run:

```bash
npm run merchant:local:analytics:e2e
```

This starts a temporary Local server with `G-LOCALSHOULDNOTSEND` and
`GTM-LOCALSHOULDNOTSEND`, then proves that neither bootstrap nor remote request
is emitted. Local GA/GTM remains disabled even if real public IDs are present
in a developer shell.

For later local billing work, keep Stripe in TEST mode and forward the Stripe
CLI webhook to the fixed local port:

```bash
npm run stripe:local:webhook
```

The CLI-provided `whsec_...` value belongs in `.env.local` only. Never put a
live key or a Production Price ID in the local file.

## Safety contract

- `APP_ENV=local` is required for PrismaPg and local reset/bootstrap.
- Local PostgreSQL must resolve to `127.0.0.1`, `localhost`, or `::1`.
- The database marker must be `LOCAL` with the loopback identity.
- Preview and Production always remain Neon-backed.
- Mock auth is allowed only in Local or automated test context; it is rejected
  by Preview/Production.
- Local Merchant billing must be Stripe TEST (`sk_test_*`) or the local mock.
- Local telemetry does not send to Production GA4 or Axiom datasets.
- Optional providers such as Axiom, GA4, Resend, Browser Rendering, Gemini,
  and GrsAI are not required for the first-product and private-preview path.

## Troubleshooting

If preflight fails, do not override it by pointing Local at Neon. Check that
PostgreSQL tools are installed, `.env.local` contains the loopback URLs, and
run `npm run merchant:local:bootstrap` again. The reset command is scoped to
`.local/postgres`; it does not touch Preview or Production.
