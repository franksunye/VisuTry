# Public URL import pause

**Status:** Ready for independent review; not deployed
**Owner:** Merchant Engineering
**Last updated:** 2026-11-05

Store URL automatic catalog inspection is disabled by default. Manual entry and CSV import remain available, including original product URL fields, review, approval and persistence. Existing catalog records and the data model are unchanged.

`NEXT_PUBLIC_MERCHANT_PUBLIC_URL_IMPORT_ENABLED` accepts only literal `true` to opt in. It is unset/false by default. The client flag is captured at build time, so changing UI availability requires a rebuild. The API checks its flag after authentication and merchant membership, before the URL inspection service; a disabled URL request returns HTTP 403 with `PUBLIC_URL_IMPORT_DISABLED`. An old client cannot override this server decision. Re-enabling requires a separate product/release decision.

New empty catalogs start in Manual; existing catalogs start in CSV. Signup website metadata no longer selects the URL inspection path while disabled. Store URL tabs and URL-first guidance are removed from the default experience. Product URL fields remain ordinary metadata and do not initiate scraping.

This independent branch is based on main. PRs #516 and #517 remain untouched; Shopify product adapter work stays in #517. This change does not disable features in the currently deployed application until a separate merge/deployment decision is approved.

Acceptance covers default-off API denial without source-service invocation, opt-in, authentication and tenant checks, manual metadata preservation, UI entry selection, real multipart CSV approval/persistence, and desktop/mobile Catalog screenshots in Merchant RC artifacts. C1/C1.1 acceptance is not reopened. Future Shopify authorized integration is a separate workstream.
