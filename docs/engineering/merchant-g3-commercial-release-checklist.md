# Merchant G3 Commercial Release Checklist — evidence before acquisition

**Status:** OPEN / NOT CERTIFIED  
**Owner:** Lead, parent [#356](https://github.com/franksunye/VisuTry/issues/356)  
**Baseline source SHA:** `b37e024d182782d4c766310ede9418dbd4e20f43` (2026-10-11)  
**Invariant:** `releaseReady=false` until explicit G4 signoff. No outreach under #353.

## Accepted baseline (do not retest without changed code or a targeted gap)

- **G2 Local functional RC PASS** on exact SHA: real isolated PostgreSQL + Chromium First Value, Campaign/CSV, six Journey policies for Store/Campaign, canonical Result/QR/phone continuation, Kiosk Shopper A reset before B, scoped Agent/MCP read/draft/preview/revoke/foreign-tenant denial. Valid runs had 0 product failures / 0 required skips; separate fixture/setup errors are disclosed in [#358 ledger](https://github.com/franksunye/VisuTry/issues/358#issuecomment-6107904896).
- **Brand shopper cross-surface PASS_LOCAL_MOCK_MEDIA**: Owner API saved synthetic non-null Logo, Accent and independent Store/Campaign Heroes with approval and tenant guards; image parity and Kiosk reset seen in Chromium 1440/1024/390. [#360 evidence](https://github.com/franksunye/VisuTry/issues/360#issuecomment-6109346000).
- **Blob transport only PASS_SEPARATE**: previously authorized one Production synthetic file stage/public read/decode/exact cleanup. Not an approved Catalog/Brand attachment lifecycle. [#359 Lead evidence](https://github.com/franksunye/VisuTry/issues/359#issuecomment-6106574625).
- **Real Stripe Test mode core PASS_SEPARATE**: Founding Pilot and Launch/Growth/Scale real test provider Checkout/signed webhook/entitlement evidence. Historical local post-return 500 is not proven to be a Production product defect; live parity is unknown. [#352](https://github.com/franksunye/VisuTry/issues/352).
- **Public arbitrary website catalog scraping NOT PASS**: multiple externally imposed 403s; explicitly **best-effort**, with Manual/CSV recovery. No claim of guaranteed product import. [#359](https://github.com/franksunye/VisuTry/issues/359).
- **Agent scope**: canonical Node MCP **20 registered tools**, Cloudflare **18-tool subset**; publish/archive and other high-impact actions Human Workspace-only pending genuine authorization. Do not claim full autonomous Merchant administration. [#362](https://github.com/franksunye/VisuTry/issues/362).

## Outstanding gates

| ID / priority | Requirement and acceptance evidence | Current status / safe next action |
| --- | --- | --- |
| G3-MEDIA / **P0** | Exactly bounded **real** Merchant Catalog first-party image and Brand Logo/Hero transport → canonical authorized save/approval → persisted resource → correctly decoded private/public shopper image → failed-attachment cleanup, with tenant scopes | **NOT TESTED as one integration.** Define dedicated TEST environment, exact objects, disposable tenant, blast radius and orphan procedure. Require separate Owner signoff before any Blob/Production data write. Mock and transport-only evidence do not substitute |
| G3-AUTH / **P0** | Existing authorized Owner genuinely signs in through Auth0/OAuth, callback returns to Merchant workspace, desktop/mobile; persisted session/merchant identity remains correct, no secret disclosure | **NOT TESTED in actual Auth0.** Local mock auth does not certify it. Start read-only non-secret config and redacted callback health; browser smoke needs explicit permitted existing identity. Do not submit fake Production `?billing=processing`/checkout signals |
| G3-BILLING / **P0** | **Read-only** Stripe Live Products/Prices for Pilot/Launch/Growth/Scale, actual recurring/one-time/currency/account + enabled signed webhook endpoint + Vercel Production key **presence/target/mode**, Consumer shared-webhook isolation | **UNKNOWN/PARTIAL**: non-decrypting Vercel inventory was limited to 100 returned entries; absence in that sample is **not** proof of missing Production secrets. Obtain complete metadata-only scope and operator-approved Stripe Live object read. Never print tokens or execute a Live charge. See [#352](https://github.com/franksunye/VisuTry/issues/352) |
| G3-PUBLIC / **P0** | Public CDN host vs Vercel Origin, distinct merchant Store/Campaign identity, public asset cache/invalidation, safe auth/QR/Webhook routing | **PARTIAL:** Origin routes and tenant identities separately verified; CDN/browser cache parity not yet certified. Read-only guest HTTP/browser, no synthetic Result token or Checkout analytics |
| G3-FACTORY / **P0** | Canonical sanitized configuration manifest covers Brand/Catalog/Journey/Presentation/Result/Delivery/plan; diffs before **explicit** authorized apply via canonical commands; idempotent verify and bounded restore/handoff | **NOT CERTIFIED** by v1 evidence-only receipt. Propose/dry-run is read-only; only dedicated marked TEST tenant with independent authorized write gate. Do not permit cross-tenant/raw Prisma business writes. [#358](https://github.com/franksunye/VisuTry/issues/358) |
| G3-COMMS / **P1** | Merchant-facing pricing/plan/entitlement and quota behavior, first product onboarding/help/error recovery, URL Best-effort warning, Agent Human-only publish limits, provider/photo privacy, support escalation + known limitations | **NEEDS FINAL COPY / SUPPORT REVIEW.** Lead owns source/site audit and targeted PR only for demonstrated misleading claims; do not initiate external prospect contact |
| G3-MEASURE / **P1** | Sanitized per-merchant handoff/support receipt; operator interventions, QA runtime/CI minutes, external call count/cost, *actual* human active time (separate from automation wall time), rollback support | **PARTIAL:** prior automation timings known; actual novice/human activation time unknown. Preserve receipt evidence class and 3-day RC artifact retention |

## Execution order, safety and signoff

1. **Lead first:** inspect code and public copy, prepare redacted exact-gate gap evidence and proposed corrections; resolve metadata-only Stripe/Vercel/Auth0/public CDN constraints without new credentials or writes.
2. **Codex only for bounded authorized operator work:** one metadata-only complete parity read and a real owner callback smoke if already permitted; stop at a missing permission, do not simulate a pass. For actual storage or canonical Factory apply, seek **separate explicit Owner authorization** scoped to exact TEST tenant, paths, object count, cleanup and failure risk.
3. **Release vote:** each mandatory P0 has `PASS_VERIFIED` or explicit Owner-approved narrowing with transparent product claim; P1 support material accepted; `releaseReady=false` until Lead G4 signed, real data/paid provider and Production permissions bounded. Never promote `MOCK_MEDIA`, `MOCK_AUTH`, `PREPARED_DEMO` or basic route 200 to a complete real-product integration certification.

This checklist captures **evidence state**, not an alternate source of truth for Merchant business commands, entitlements, checkout or deployment.
