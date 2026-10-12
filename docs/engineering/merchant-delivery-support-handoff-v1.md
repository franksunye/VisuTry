# Merchant Support Handoff v1 — read-only customer handover snapshot

Scope: **Merchant Delivery Factory G3 support and repeatable handoff** (#358 / #356). This is not an automated Apply, public-route verification, billing verification or Commercial-Ready certificate.

## Authenticated endpoint

`GET /api/merchant/:merchantId/delivery-factory/handoff`

- Human Owner/Admin session and exact membership on URL merchantId required; foreign/missing merchants return the same 404. No Agent credential or anonymous access.
- Dynamic `Cache-Control: private, no-store`; response does not contain tokens, consumer sessions, contact lists, payment data, email, raw analytics or customer PII.
- Exactly one tenant-scoped canonical Prisma Merchant read. No writes, imports, image fetches, publish, archive or external services.

## Contract

The v1 response contains: Merchant classification/name/slug; whether Brand logo/accent are configured; total/ACTIVE/Store-eligible Catalog counts; Store publish status, selected/eligible product counts, hero configured and **public path only when ACTIVE**; bounded Campaign public paths only when ACTIVE; and clear blockers like no products, incomplete selected product, multiple ACTIVE Stores or un-published Store.

All external evidence is intentionally marked `NOT_EXECUTED`: public image loading, Campaign rendering, Owner Auth callback and live billing. `releaseReady=false` ALWAYS. An ACTIVE Store with valid product imagery in the database is **not evidence that public HTML, Next image optimizer or Cloudflare actually displayed the image**.

Use this response to prepare a human support handover and troubleshooting checklist. After separately recorded real-merchant permission, verify public visitor view, Web/Kiosk/Result/Handoff, entitlements, payment/renewal and customer-specific support contacts. Keep the signed execution evidence pack (exact SHA, tenant classification, browser/DB markers, screenshots without PII, limitations, approval/rollback) separate from this current-state read model.

The Factory Manifest/Plan from #391 and later guarded Apply/Verify are **separate**: this endpoint neither accepts a manifest nor implies configuration has been applied.

## Independent QA

- Unit: real Store display-readiness policy (an ACTIVE product can still be image-invalid); single active Store, Draft-only, multiple-active conflict, bounded Campaigns, no false public verification.
- HTTP: unauthenticated 401, OWNER/ADMIN tenant scope, masked 404, no-store, sanitized 500, no DB write.
- Full acceptance: isolated Local PostgreSQL and 390/1440 browser proof can be batched with Factory E2E after code review. No Production mutations authorized.
