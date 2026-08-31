# DB-P2B Production Baseline Cutover Runbook

**Status:** Prepared for the next controlled migration task; not executed by DB-P2B.

**Scope:** Existing Production database adoption only. This runbook does not authorize deployment, credential changes, schema changes, or direct SQL against `_prisma_migrations`.

## Preconditions

- The canonical active migration tree is present in the reviewed release.
- The 48 historical migrations remain byte-for-byte preserved in `prisma/migrations_legacy/`.
- A disposable copy has verified the current schema and historical ledger are compatible with the canonical baseline.
- The approved direct PostgreSQL connection and release authorization are available through the normal controlled operator process. Do not record credentials here.

## Ordered procedure

1. Verify the Production schema against the approved current-schema catalog.
2. Verify the complete `_prisma_migrations` ledger, including finished and failed rows.
3. Confirm there are no pending or failed migrations and no active migration process.
4. Confirm backup and restore safety, including a recent restorable backup and an agreed rollback/forward-fix plan.
5. Run the controlled migration command with the canonical active migration tree selected.
6. Execute `prisma migrate resolve --applied 00000000000000_canonical_baseline` once, using the direct migration connection.
7. Run `prisma migrate status` and require a clean result.
8. Verify the baseline checksum and confirm the historical ledger rows remain intact.
9. Only after the clean checks pass, allow the normal guarded `prisma migrate deploy` path for subsequent migrations.
10. Run the approved Production smoke test and monitor migration/application health.

## Stop conditions

Stop immediately and do not deploy if:

- the database identity, environment, or schema does not match the approved target;
- any migration is pending, failed, rolled back, or actively running unexpectedly;
- backup/restore verification is missing or fails;
- the baseline checksum differs from the reviewed artifact;
- `migrate resolve` or `migrate status` returns an error, divergence, or unexpected migration;
- Prisma requires direct SQL mutation of `_prisma_migrations`;
- the normal direct-connection and authorization guards are not satisfied;
- the smoke test or post-cutover monitoring shows a regression.

Do not attempt to repair the ledger with manual `INSERT`, `UPDATE`, or `DELETE` statements. Escalate for review and preserve the database state for diagnosis.
