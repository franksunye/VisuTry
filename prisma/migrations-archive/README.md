# Archived Prisma migration history

This directory is forensic history only. It is deliberately outside the Prisma configured active path (`prisma/migrations`) and must never be passed to `prisma migrate deploy`, `migrate dev`, or fresh-database bootstrap.

- `legacy/` contains the 53 migration directories from DB1A base, moved byte-for-byte and identified in [`../../docs/operations/migration-history-provenance-20261003.md`](../../docs/operations/migration-history-provenance-20261003.md).
- `production-applied-variants/` preserves exact historical SQL bytes whose Production checksum differs from the current-repository variant.
- `production-ledger-only/` preserves the old Production ledger-only baseline source. It is not the new canonical baseline and must not be activated or replayed.
- `20241121_add_try_on_type` had a Production ledger row but no source SQL in audited history; its name/checksum remain documented in the provenance manifest.

The only active initial migration is `20261003000000_canonical_schema_baseline` under `prisma/migrations`. Future migrations belong beside that baseline as timestamped deltas.
