# Article One QA results

Snapshot date: 2026-08-11. Deterministic and low-cost checks only; no real AI provider was called.

- Package preflight: PASS; 18 active rows; 1 Store + 2 Campaigns; selected counts 18/9/9.
- Product/image URL health: PASS; 18/18 product URLs and 18/18 image URLs healthy; no redirects or failures.
- Dry-run seed plan: PASS; CREATE merchant; CREATE 18 frames; CREATE 3 Experiences; 0 deactivation; 0 errors.
- Required production migrations: PASS by direct read of `_prisma_migrations`; `20260812100000_add_experiences` and `20260812113000_harden_experience_tenant_foreign_keys` finished successfully. `prisma migrate status` still returns the pre-existing blank schema-engine error caused by historical migration state; no migration was changed.
- Production seed: PASS; merchant `cmsotuyga0000xzi8ed15j0sk`; 18 active frames; 3 active Experiences.
- Production verification: PASS; Store 18; Active Eyewear 9; Find Your Fit 9; all expected ExperienceFrame selections match.
- Initial live production route smoke: body/status/identity/headline/frame count/reference marker passed, but Next Image returned four 400 responses because the live shared image allowlist did not include Article One's official BigCommerce CDN.
- Remediation: added the generic `cdn11.bigcommerce.com` hostname to the shared Next image allowlist; no Article One-specific branching or API was added. A local production build connected to the production Neon data passed all six desktop/mobile route checks with zero console/page errors.
- Vercel Preview deployment: PASS, but anonymous route smoke is blocked by Deployment Protection/Auth0 and returns the provider login page; this is an environment access blocker, not an app/data failure.
- Shopper scope regression: PASS; existing shared Experience policy, recommendation, insights, intent, Admin route, and critical Store tests passed 40/40; no new shopper test framework was created.
- Critical E2E: PASS; `tests/e2e/store-pilot.spec.ts` against `https://www.visutry.com` passed 4/4 with no real AI generation.
- Admin workspace: PASS through the existing production data contract; Merchant Catalog count 18; Store 18; Active Eyewear 9; Find Your Fit 9; Legacy / Unassigned visible; all metrics currently zero as expected for a newly seeded reference pilot.
