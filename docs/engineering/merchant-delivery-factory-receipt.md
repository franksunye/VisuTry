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
`releaseReady` is explicitly false in v1 because these outstanding hard
gates are not independently provable from Playwright alone: successful public
HTTPS product import; real isolated QA Blob read/write; canonical merchant
configuration manifest; tenant-approved command apply/verify; sanitized
handoff/support receipt; full G2/G3/G4 business release approval.

**No direct Prisma writes / no high-impact Agent calls / no checkout,
deployment, Blob uploads, or merchant changes.** Current Release Candidate
artifacts have three-day retention; archive only redacted, non-sensitive
receipts via approved internal evidence retention before expiry. Future
proof adapters require separate review, not arbitrary status overrides.
