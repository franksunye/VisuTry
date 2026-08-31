# PostgreSQL provider cutover runbook

Neon PostgreSQL → Supabase PostgreSQL

Status: preparation only. This document does not authorize a production
cutover, a migration resolve, a migration deploy, or a provider change.

## Preconditions

1. The canonical Prisma baseline is already stable and has been adopted by
   the existing source database through the separately approved cutover.
2. The source migration ledger is clean and the active migration tree is
   unchanged since its last review.
3. A non-production Supabase database has passed the empty-baseline,
   future-migration, schema-contract, and application portability tests.
4. The target region, PostgreSQL version, storage headroom, connection limits,
   and serverless connection mode have been reviewed. Do not assume that a
   particular Supabase plan includes a particular backup or PITR feature.
5. A tested backup/restore path exists for both providers.

If any precondition is false, stop. Do not combine this operation with the
canonical-baseline lineage cutover.

## Local rehearsal modes

These commands use disposable local PostgreSQL only. They are not a
Production timing estimate and do not authorize an environment switch:

```text
P3_CANONICAL_MIGRATIONS_PATH=<approved-canonical-migrations-path> npm run test:db-p3-data-migration
P3_CANONICAL_MIGRATIONS_PATH=<approved-canonical-migrations-path> npm run test:db-p3-data-migration:scale
```

The first command is the fast CI-sized rehearsal. The second uses the scaled
synthetic dataset and reports phase timings, dump/database sizes, row counts,
and the post-import write/default/sequence smoke.

## Mandatory deployment freeze / serialization window

Obtain an explicit deployment freeze before touching the source database. The
freeze covers the entire window:

preflight recheck → target backup/PITR verification → final source export →
target import → validation → environment switch → `prisma migrate status`
CLEAN → application smoke → monitoring → rollback-window handoff.

During this window there must be:

- no unrelated Production deployment or parallel release;
- no automated migration job or alternate operator migration;
- no schema-changing branch merge;
- no simultaneous canonical-baseline adoption;
- no DNS-only or blind environment-variable switch.

If serialization cannot be guaranteed, stop the cutover.

## 1. Preflight the source

1. Confirm source identity using the approved production identity marker and
   `EnvironmentMetadata`; do not rely on a hostname alone.
2. Verify the source schema, application table count, raw-SQL invariants, and
   migration ledger are clean.
3. Confirm there are no failed/unfinished migrations, long-running writes,
   blocked sessions, or active migration processes.
4. Record database size, largest tables, connection limits, and the expected
   maintenance window. Use the read-only tool:

   ```text
   VISUTRY_FOOTPRINT_READ_ONLY=1
   VISUTRY_PRODUCTION_READONLY_AUDIT_AUTHORIZED=1
   VISUTRY_FOOTPRINT_DATABASE_URL=<approved-read-only-direct-url>
   VISUTRY_FOOTPRINT_EXPECTED_DATABASE_IDENTITY=<approved-identity>
   npm run db:footprint:audit
   ```

   The URL is supplied by the operator at execution time and must never be
   committed or pasted into a report.

## 2. Provision and verify the target

1. Provision a Supabase PostgreSQL target with an approved region and enough
   storage/connection headroom.
2. Obtain two target connection forms without committing them:
   - a runtime URL suitable for the serverless connection pattern;
   - a direct/admin URL for Prisma migrations and `pg_dump`/`pg_restore`.
3. Require SSL and verify the target database identity before any write.
4. Apply the canonical active migration path to an empty target:

   ```text
   P3_SECONDARY_POSTGRES_URL=<target-direct-url>
   P3_SECONDARY_POSTGRES_ALLOW=1
   P3_CANONICAL_MIGRATIONS_PATH=<approved-canonical-migrations-path>
   npm run test:db-p3-secondary-provider
   ```

   This must report clean status, the complete schema contract, all seven
   raw-SQL invariants, application smoke success, and a future migration
   success before proceeding.

## 3. Verify backup and restore readiness

Confirm the source backup/PITR timestamp, retention window, restore operator,
restore destination, and recovery procedure. Confirm a target restore path as
well. Do not treat a dashboard toggle as proof until the operator can identify
the recovery point and restore destination.

If backup or restore readiness cannot be established, stop.

## 4. Freeze writes and export the final source snapshot

After the freeze is active, stop or drain application writes according to the
application release procedure. Keep the source authoritative.

Use a consistent PostgreSQL-native export; do not export the Prisma migration
ledger for insertion into the target:

```text
pg_dump --format=custom --data-only --no-owner --no-privileges \
  --exclude-table=public._prisma_migrations \
  --file=<protected-export-path> <source-direct-url>
```

Protect the export as sensitive operational data. Do not print connection
strings, row values, tokens, image URLs, or credentials.

## 5. Prepare and import the target

1. Confirm the target is the expected empty or disposable cutover database.
2. Run the canonical migration path against the target with the direct URL.
3. Import the final snapshot without modifying `_prisma_migrations`:

   ```text
   pg_restore --data-only --no-owner --no-privileges --exit-on-error \
     --dbname=<target-direct-url> <protected-export-path>
   ```

4. Keep the source unchanged and authoritative until validation and smoke
   tests pass.

## 6. Validate before switching traffic

Run the reusable validator with both direct URLs held only in the operator
environment:

```text
P3_SOURCE_DATABASE_URL=<source-direct-url>
P3_TARGET_DATABASE_URL=<target-direct-url>
P3_READINESS_CONFIRM=1
npx tsx scripts/postgres-data-migration-validator.ts
```

Require PASS for all of the following:

- every application table row count;
- primary/foreign-key shape and zero FK orphans;
- zero unique violations and required-NULL violations;
- enum labels, defaults, sequences, timestamps, JSON/JSONB, and arrays;
- Payment amounts/statuses/credits revoked;
- User credit and premium/account metrics;
- TryOnTask status/origin/merchant ownership/quota-settlement fields;
- MerchantUsageLedger and sponsored-usage totals;
- GenerationRequest/GenerationAttempt counts and linkage.

## 7. Switch the provider

Only after validation passes, update the approved runtime and direct migration
configuration atomically in the deployment system:

1. runtime `DATABASE_URL` → approved Supabase runtime/pooled URL;
2. migration `DATABASE_URL_UNPOOLED` (or the approved direct equivalent) →
   approved Supabase direct URL;
3. retain the old Neon values in the protected rollback procedure, not in
   source control or logs.

Do not use blind DNS switching. Do not change the Prisma schema, edit
`_prisma_migrations`, or run an automatic baseline/resolve operation.

Immediately run `prisma migrate status` against the target active path and
require `Database schema is up to date!` / CLEAN. If status is divergent,
unknown, failed, or inconclusive, fail closed and do not run `migrate deploy`.

## 8. Smoke and monitor

Run the critical application smoke without live Stripe operations:

- authentication user/session/account persistence;
- TryOnTask lifecycle and idempotency/fenced-lease fields;
- FaceAnalysisTask persistence;
- Payment and credit/accounting invariants;
- Merchant membership, credentials metadata, classification, and entitlement;
- Store/Experience/Campaign persistence and one-active-store behavior;
- MerchantUsageLedger and sponsored usage;
- GenerationRequest and GenerationAttempt telemetry.

Monitor errors, latency, connections, locks, failed migrations, queue/cron
health, billing callbacks, and application write rates throughout the rollback
window.

## 9. Rollback

If target validation, status, smoke, or monitoring fails:

1. Do not attempt ad-hoc dual-write reconciliation.
2. Keep the source authoritative if it remains intact.
3. Switch the application back to the original provider using the approved
   rollback configuration.
4. Re-run source identity, migration status, and critical smoke checks before
   reopening writes.
5. Preserve the target and export for forensic comparison.

Do not decommission or delete Neon until the rollback window has ended and the
owner has approved stabilization.

## Supabase readiness notes

- Use a direct, SSL-enabled PostgreSQL URL for Prisma migrations; do not send
  migration advisory locks through an incompatible transaction pooler.
- Choose runtime pooling only after validating the actual Supabase connection
  mode, serverless concurrency, timeout behavior, and connection limits.
- Compare source and target regions for latency and data-residency needs.
- Verify backup/PITR availability, retention, restore destination, and operator
  access for the selected account/plan; pricing and feature availability are
  intentionally not hardcoded here.
- The current VisuTry application runtime remains provider-specific until a
  separately approved adapter change. This runbook proves PostgreSQL schema
  and persistence portability; it does not authorize a runtime adapter rewrite.

## Prohibited shortcuts

- simultaneous baseline-lineage and provider cutover;
- blind DNS or environment-variable switching;
- direct insert/update/delete of `_prisma_migrations`;
- automatic baseline adoption during build/deploy;
- dual-write, Kafka, CQRS, or ad-hoc distributed transactions;
- destructive Neon shutdown before stabilization.
