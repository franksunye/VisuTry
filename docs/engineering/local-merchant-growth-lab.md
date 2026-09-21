# Local Merchant Growth Lab

**Status:** Active operating procedure

The Local Merchant Growth Lab is the primary development and QA environment
for Merchant acquisition through private Store Preview. It uses repository-local
PostgreSQL, guarded mock identities, and Stripe TEST configuration only.

## First run

```bash
cp .env.local.example .env.local
npm install
npm run merchant:local:bootstrap
npm run merchant:local:dev
```

Open `http://127.0.0.1:3001/en/business`.

## Repeatable QA loop

```bash
npm run merchant:local:preflight
npm run merchant:local:reset-clean
npm run merchant:local:dev
# in another terminal
npm run merchant:local:e2e
# P1-M1 first-value journey (same guarded Local path)
npm run merchant:local:p1-m1:e2e
```

The golden path is:

```text
Business → Local QA Clean Merchant → name gate → workspace
→ first manual product → Catalog ready → Store draft → private Preview
```

It stops before Publish and before payment. All Merchant, Catalog, Store, and
activation writes use the real local application and local PostgreSQL. The
deterministic product image is repository-owned at
`/glasses-presets/large-round-classic.jpg`.

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
→ select product → Save products
→ Preview your Store
```

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
