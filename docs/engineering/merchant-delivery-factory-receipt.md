# G1-F Delivery Factory receipt v1 — evidence-only

Status: **partial foundation; NOT a deployment, apply, G2, G3 or G4
commercial readiness certificate**.

The existing Merchant CI executes First Value, Campaign, native photo with
**mocked external Blob** (real Local Catalog approval), unsafe URL rejection
and real CSV approval in one scoped four-case RC. The independent Kiosk RC
executes the complete existing Shopper A→reset→B privacy golden path with
**deterministic LOCAL provider fixtures**. They ran in separate PRs and
typically have **different source SHAs**. Never merge those results into
an unqualified PASS for the latest main.

Use the evidence-only aggregator to produce a sanitized, auditable local
release receipt. It has no network, database, provider, secret or write action
besides writing the local JSON receipt file.

```bash
node scripts/merchant-delivery-factory-receipt.mjs \
  --manifest docs/engineering/merchant-delivery-factory-receipt.v1.json \
  --source-sha "$(git rev-parse HEAD)" \
  --foundation-ledger .local/evidence/current-sha-foundation-ledger.json \
  --kiosk-ledger .local/evidence/current-sha-kiosk-ledger.json \
  --output .local/evidence/merchant-delivery-receipt.json
```

Inputs MUST be genuine machine-readable JSON ledgers from actual Chromium
executions at the same exact source SHA; mismatched PR/main revision, omitted
ledger, skipped/retried tests, mismatched selector or tampered gate are
BLOCKED. The aggregator also checks each scenario against the live manifest,
counts, execution flag, and one attempt. Its claimed local database marker
is **only operator-reported**, not independently re-verified here.

Exit code 0 means **local receipt generated with five local PASS assertions**,
not a commercial release. Exit code 2 means incomplete or invalid evidence.
`releaseReady` is explicitly false in v1 because the standalone receipt
cannot independently certify the following: third-party public URL compatibility
(**best-effort, not a universal-import PASS**, with clear CSV/manual recovery),
actual first-party Blob upload **attached via authorized Catalog/Brand commands**
and visibly rendered after readback (separate from the already accepted single
synthetic Production Blob stage/read/decode/exact-delete transport smoke),
real Auth0 Owner callback, merchant configuration manifest, tenant-approved
command apply/verify, sanitized handoff/support receipt, and G3/G4 commercial
release approval. The dated source-of-truth gate list is
`merchant-delivery-factory-receipt.v1.json`.

**No direct Prisma writes / no high-impact Agent calls / no checkout,
deployment, Blob uploads, or merchant changes.** Current Release Candidate
artifacts have three-day retention; archive only redacted, non-sensitive
receipts via approved internal evidence retention before expiry. Future
proof adapters require separate review, not arbitrary status overrides.

## G2 Local functional RC accepted; G3 still open (2026-10-11)

Lead accepted [exact-main combined G2 Local RC](https://github.com/franksunye/VisuTry/issues/358#issuecomment-6109514047) at
`b37e024d182782d4c766310ede9418dbd4e20f43`, incorporating the [Brand cross-surface Local test](https://github.com/franksunye/VisuTry/issues/360#issuecomment-6109346000).
First Value, Campaign/CSV, six valid Journey policies for Store/Campaign,
Prepared Demo Result/QR/Kiosk reset and local Agent/tenant negatives completed
within their **actual** evidence class. Brand Logo/Accent and scoped Hero
readback/render used **MOCK_MEDIA**; Owner auth used **MOCK_AUTH**; Try-On
media used **PREPARED_DEMO**, not paid provider output. Initial fixture setup
failures were disclosed and corrected before the valid final runs.

**This does not upgrade the five-case receipt generator to a G2 or G3
certificate.** The factory's operational manifest -> reviewed diff ->
authorized apply -> verify -> handoff/restore lifecycle still requires its own
demonstration and support receipt. The genuine Blob attachment, Auth0 callback,
Live Stripe parity, public-domain/cache and merchant-facing disclosure gates
are tracked in [G3 Commercial Release Checklist](merchant-g3-commercial-release-checklist.md).
`releaseReady=false` until those requirements are separately accepted.
