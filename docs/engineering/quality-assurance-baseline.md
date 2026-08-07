# Quality Assurance Baseline

Established: 2026-08-07

This baseline records the first successful deterministic PR quality-gate run after QA consolidation.

- TypeScript gate: passing
- Unit/regression suites: 63 / 63 passing
- Unit/regression tests: 407 / 407 passing
- CI database access: none; Prisma client generation uses a local non-routable placeholder URL only
- Vercel: remains the environment-aware Preview/Build gate

The initial CI activation surfaced six stale assertions across five suites. They were reconciled against current implementation contracts for PricingCard, Stripe attribution, quota configuration, GrowthFunnelLink attribution, and Search-to-Tool localization.

This is a baseline, not a permanent test-count target. New behavior should add or revise tests based on risk and ownership rather than preserving the numeric count.
