# Framed EWE QA results

Snapshot date: 2026-08-12. This file is updated after the standard checks. Routine QA uses no real AI provider and no shopper face data.

- Package preflight: PASS; 20 active rows; 1 Store + 2 Campaigns; selected counts 20/11/12.
- Product/image URL health: PASS; 20/20 product URLs and 20/20 image URLs healthy; no redirects or failures.
- Dry-run seed plan: PASS before publish; CREATE merchant, CREATE 20 frames, CREATE 3 Experiences, 0 deactivation, 0 errors. Post-publish dry-run is idempotent: UPDATE 20 frames, REPLACE 3 Experience selections, 0 deactivation.
- Production migration status: PASS by direct read of `_prisma_migrations`; `20260812100000_add_experiences` and `20260812113000_harden_experience_tenant_foreign_keys` have finished timestamps and no rollback. `prisma migrate status` still emits the pre-existing blank schema-engine error; no migration was changed.
- Production seed/read-back: PASS; merchant `cmsovc43q00003ai87qtpyf2r`; 20 active frames; Store 20; Find Your Frames 11; Sunglasses Edit 12; all rows are reference data.
- Route smoke: PASS; 6/6 Store/Campaign desktop/mobile checks returned HTTP 200 with identity, headline, frame count and Reference marker; no application, console or page errors.
- Anonymous session attribution: PASS; two lightweight sessions per route were created during verification, all six have the correct Experience ID, campaign/source context and `referenceData=true`; no AI provider was called.
- Shopper scope regression: PASS; existing shared Experience policy, recommendation, insights, intent, Admin route and critical Store tests were reused. No new test framework or production code was added.
- Multi-brand regression: PASS through existing shared recommendation test contract: same-merchant frames are eligible together while a different merchant frame is excluded; product brand is not used as a tenant boundary.
- Admin workspace: PASS through the existing workspace data contract; Merchant Catalog 20; Store 20; Find Your Frames 11; Sunglasses Edit 12; metrics load at zero plus Legacy / Unassigned. Anonymous Admin route remains Auth0-protected as expected.
- Quality gates: PASS for the delivery scope — typecheck; shared importer ESLint; build:ci; 9 shared Store/Experience suites (58 tests); critical Consumer suite (30 tests); critical Store E2E (4/4). Full unit was 86/87 suites and 595/596 tests: the single pre-existing `tests/unit/lib/auth0-config.test.ts` failure expects `auth0.com` but the configured issuer is `https://auth.visutry.com`; Auth0 code was not changed.
