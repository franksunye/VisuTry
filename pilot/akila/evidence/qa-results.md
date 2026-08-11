# AKILA QA results

## Package and source checks

- Existing `readPilotPackage('pilot/akila')`: PASS — 18 active rows; Store 18; two Campaigns 9/9.
- Experience selections resolve to catalog external IDs: PASS.
- Product URL and image URL health: PASS — 36 checks, no failures.
- No brand-specific runtime/importer code: PASS — package-only change.

## Shared quality gates

- `npx prisma validate`: PASS.
- `npm run typecheck`: PASS.
- `npm run build:ci`: PASS.
- Shared Store/Experience pilot, recommendation, policy, intent, Admin, and insights tests: PASS — 7 suites / 48 tests.

Build output contains existing repository warnings for legacy `<img>` usage, React Hook dependency lint rules, and stale browser data. No warning points to the AKILA package.

## Production shopper/admin checks

- Public Store and two Campaign routes, desktop + mobile: PASS.
- Anonymous session creation and Experience attribution: PASS.
- Reference Pilot / Simulation labeling: PASS.
- Consumer Credits prompt: absent.
- Admin protected routes: expected Auth0 redirect; direct workspace query: PASS.
- Real AI provider: not called.
