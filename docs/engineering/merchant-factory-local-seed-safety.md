# Merchant Factory — Legacy Pilot Seed Safety Boundary

**Status:** Safety prerequisite for [#358](https://github.com/franksunye/VisuTry/issues/358). This document does **not** certify Merchant Delivery Factory v1, canonical provisioning, or Commercial-Ready.

The historical `scripts/seed-store-pilot.ts` writes directly through Prisma rather than through authorized Merchant application commands. It is therefore **LOCAL TEST-only**. Never use it for real Merchant, Preview, Staging, or Production setup, even when a tenant appears disposable.

## Execution contract

Read-only inspection (`--dry-run`) remains independent of the write guard:

```bash
npm run db:seed:pilot -- pilot/<local-test-package> --dry-run
```

For any actual local write, set an **isolated, marked, disposable** loopback PostgreSQL database and confirm the exact target out of band. Use `APP_ENV=local`, `STORE_SEED_CONFIRM=local-test-only` and both `DATABASE_URL` and `DATABASE_URL_UNPOOLED`. They must resolve to the **same** database named `visutry_local` or `visutry_local_*` on `127.0.0.1`, `localhost` or `::1`. Production runtimes, remote URLs, DSN host overrides and mismatched destinations are rejected even if confirmation is supplied. Do not paste credentials into logs or GitHub.

**Forbidden:** Setting `STORE_SEED_CONFIRM=yes` to bypass any boundary; repointing TEST variables to a live DB; copying any Production/Preview connection string; editing Source/Prod data to make a fixture pass.

## Factory v1 requirements still open

The standard product delivery path remains **Manifest → Validate → Diff/Dry-run → authenticated, specifically Owner-approved canonical Apply → Idempotent Verify → bounded Restore → Handoff Receipt**. It needs repeated acceptance against at least two isolated TEST merchants with no direct Prisma business writes and with an explicit tested/skipped/not-executed ledger.

A green unit test for the legacy safety gate does not prove those capabilities. `releaseReady=false` until the complete G3 and G4 approval.
