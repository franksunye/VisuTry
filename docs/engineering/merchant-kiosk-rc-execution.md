# G1-F — Executed Kiosk shared-device privacy

The existing P1-M6 browser test is the source of truth. This dedicated
scoped CI workflow does **not** create a shorter replacement scenario.

Before actual Chromium execution, seed-local-qa prepares the TEST identity
and seed-local-kiosk-qa provisions an ACTIVE LOCAL test Store Experience with
a valid selected frame. Both require exact, read-back database identity marker
for disposable PostgreSQL. Missing fixtures are failures; Playwright
test.skip cannot pass the fail-closed ledger.

The original golden path tests Shopper A photo, recommendation, Try-On and
compare, QR Result retention on independent phone, manual reset and history
isolation, Shopper B clean state, idle reset, token-only reset denial and
reset failure handling. The existing scenario timeout is 480 seconds.
Dedicated RC job timeout is 27 minutes to avoid routine CI cost increases.

Evidence is the original Playwright JSON tested by mandatory fail-closed
ledger: one attempt; no skip or retry. Artifacts contain only outcome ledger,
not screenshots, session tokens, browser traces or server logs. Provider
requests/cost are reported zero, NOT independently metered.
No production Merchant, payment, storage or paid-provider write authorized.

A green Kiosk case does not complete successful public URL discovery,
real Vercel Blob, all G2, G3 or G4 acceptance.
