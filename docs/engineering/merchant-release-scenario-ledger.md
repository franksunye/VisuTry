# G1-F — Merchant mandatory scenario ledger (foundation)

Status: **Foundation only. Not G2 or G4 Commercial-Ready certification.**

Why: Quality Gate currently **discovers** Merchant Playwright specs but does not
execute the full Merchant lifecycle. A successful \`--list\`, skipped fixture,
or an unrelated green Consumer browser job cannot be counted as Merchant PASS.

## Guard

\`scripts/merchant-release-scenario-ledger.mjs\` consumes actual Playwright JSON
report(s) plus the explicit \`merchant-release-scenarios.v1.json\` manifest.
It **fails** for any required scenario that is absent, skipped, failed,
flaky/retried, or appears ambiguously in multiple reports. The test suite for
the guard runs on every PR as \`test:merchant:scenario-ledger\`.

Example **after** running the guarded, isolated LOCAL suites and saving JSON
reporters (\`--reporter=json\`, one file per invocation):

\`\`\`bash
HEAD_SHA="$(git rev-parse HEAD)"
npm run merchant:release:ledger -- \
  --manifest docs/engineering/merchant-release-scenarios.v1.json \
  --report .local/evidence/first-value-playwright.json \
  --report .local/evidence/catalog-playwright.json \
  --report .local/evidence/campaign-playwright.json \
  --report .local/evidence/kiosk-playwright.json \
  --source-sha "$HEAD_SHA" \
  --database-marker 'LOCAL|local:127.0.0.1:55434/visutry_g1f_test' \
  --mode PREPARED_DEMO \
  --provider-requests 0 \
  --external-cost-usd 0 \
  --output .local/evidence/g1f-ledger.json
\`\`\`

The marker and provider/cost values are **operator-reported provenance**, not
verified by this parser. Attach independently verified Local DB ownership
marker, execution log, paid-provider deny evidence, test duration, and redacted
screenshots before accepting a release. Never pass a Production/Preview DB URL,
credentials, private Result tokens or customer data to this tool or artifacts.
The invocation is illustrative; no claim that these four reports already exist.

The manifest initially covers **four named core paths** (First Value,
URL/CSV/manual inspection and approval, Campaign lifecycle and Kiosk privacy).
A PASS means these *four* executed tests passed in supplied evidence, **not**
that all Merchant release requirements are covered. G2 must expand the
required case matrix to Brand/Result, six Journey × Store/Campaign, tenant/usage
denials, actual image dimensions, recovery and plan gating before certification.

## Next required step (#358)

Run in a provisioned disposable, marker-owned LOCAL DB via an explicit RC
workflow with deterministic fixtures, and make this ledger a blocking job for
the declared RC scope. Do **not** silently make this expensive fixture-heavy
matrix run on every trivial PR; the current static Quality Gate only exercises
the parser contract. No production writes, provider calls or new testing
infrastructure are approved by this document.
