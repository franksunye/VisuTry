# Merchant Delivery Factory v1 — private configuration Verify

**Status:** Source feature stacked on #395 (canonical Store display readiness) on top of #391 (read-only Factory Plan). Does NOT grant Factory Apply and is NOT a commercial release certificate.

## Owner/Admin API

`POST /api/merchant/{merchantId}/delivery-factory/verify` with the strict **same v1 Manifest body** used by the Plan endpoint.

- Requires an authenticated Human OWNER or ADMIN for precisely the URL Merchant ID; Agent tokens and anonymous users are not accepted. All foreign/missing merchants remain 404-masked.
- Re-reads canonical merchant/Catalog/Brand/Store/Campaign from DB through `getMerchantFactoryDryRun`. No user-supplied plan or untrusted `merchantId` can overwrite the actual snapshot.
- Compares the proposed Manifest to the fresh Plan. Only **all NO_CHANGE steps** + zero Plan blockers + at least one selected Store product can produce `CONFIGURATION_MATCHED`.
- Otherwise `ACTION_REQUIRED` contains bounded pending steps and actual blockers. Existing Catalog extras are warnings, not destructive proposals.
- Strictly rejects unknown fields including `approved:true`. No write, import, publish, media upload, payment, or third-party fetch; `Cache-Control: private, no-store`.

`CONFIGURATION_MATCHED` means **private configuration values match the Manifest at read time**. It does NOT imply published/live Store, correct public image, actual shopper navigation, valid Result/QR/Kiosk privacy or billing. Response always contains `canApply:false`, `releaseReady:false`, and independent checks marked `NOT_EXECUTED`; verify these separately in Codex guarded browser/PG acceptance and store durable evidence in the handoff receipt from #396.

## Gate & dependencies

- #391 must pass the real two-tenant, read-only Plan PostgreSQL acceptance before merge.
- #395 requires Store display eligibility matching canonical Merchant rules, before merging Verify.
- This feature's exact-head unit, route, lint, typecheck, Next/Cloudflare and targeted merchant CI must pass after stacking bases merge.
- Factory Apply will be a **separate** explicitly approved Human canonical command path with replay/tenant/state constraints; do not reuse a previous Plan/Verify response as write authority.
- G4 `releaseReady=false` pending real public, Auth0, billing and support gates.

## Lead acceptance handoff (2026-10-13)
#391 and #395 are now merged. This Verify endpoint is intentionally **read-only**
and cannot certify a shopper experience. Require exact-head CI against main and
real two-tenant disposable PostgreSQL/Chromium verification before merge.
Expected proof: one full existing private matching Store/Campaign/Brand snapshot,
one legitimate Draft difference ACTION_REQUIRED, image/display-ineligible negative,
Owner/ADMIN membership isolation and 401/404/400 denials; unchanged DB/audit
hash before/after. Keep external/public checks NOT_EXECUTED and releaseReady=false.
