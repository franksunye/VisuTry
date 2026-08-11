# Article One QA results

Snapshot date: 2026-08-11. Deterministic and low-cost checks only; no real AI provider was called.

- Package preflight: PASS; 18 active rows; 1 Store + 2 Campaigns; selected counts 18/9/9.
- Product/image URL health: PASS; 18/18 product URLs and 18/18 image URLs healthy; no redirects or failures.
- Dry-run seed plan: PASS; CREATE merchant; CREATE 18 frames; CREATE 3 Experiences; 0 deactivation; 0 errors.
- Required production migrations: PASS by direct read of `_prisma_migrations`; `20260812100000_add_experiences` and `20260812113000_harden_experience_tenant_foreign_keys` finished successfully. `prisma migrate status` still returns the pre-existing blank schema-engine error caused by historical migration state; no migration was changed.
- Production seed: PASS; merchant `cmsotuyga0000xzi8ed15j0sk`; 18 active frames; 3 active Experiences.
- Production verification: PASS; Store 18; Active Eyewear 9; Find Your Fit 9; all expected ExperienceFrame selections match.
- Initial production route smoke: body/status/identity/headline/frame count/reference marker passed, but Next Image returned four 400 responses because the shared image allowlist did not include Article One's official BigCommerce CDN.
- Remediation: added the generic `cdn11.bigcommerce.com` hostname to the shared Next image allowlist; no Article One-specific branching or API was added. Production confirmation is pending the deployment containing this config change.
- Shopper scope regression: PASS; existing shared Experience policy, recommendation, insights, intent, Admin route, and critical Store tests passed 40/40; no new shopper test framework was created.
- Critical E2E: PASS; `tests/e2e/store-pilot.spec.ts` against `https://www.visutry.com` passed 4/4 with no real AI generation.
- Admin workspace: production data contract verified through the existing workspace path; final browser check is pending authenticated Admin access.
