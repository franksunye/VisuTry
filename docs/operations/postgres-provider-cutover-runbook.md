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
6. The complete production request graph has one authoritative PostgreSQL
   provider. The approved Cloudflare catalog edge path currently follows
   `cloudflare-router/approved-edge-api.ts` →
   `src/data/glasses-cloudflare.ts` → `src/data/neon-cloudflare.ts`; it is a
   cutover blocker while it still reads Neon after the Vercel runtime is
   switched. Move that path to the switched provider or complete a separately
   reviewed provider boundary before cutover.

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
- no DNS-only or blind environment-variable switch;
- no split-brain provider configuration: all authoritative application reads,
  writes, migrations, jobs, and approved edge data paths must point at the
  same provider, or the cutover must stop.

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
   - a migration URL suitable for Prisma migration advisory locks and
     `pg_dump`/`pg_restore`. A Supabase Session Pooler session-mode URL may be
     used only after the exact connection mode passes rehearsal; a
     transaction-mode pooler is not an acceptable migration URL.
3. Require SSL and verify the target database identity before any write.
4. Apply the canonical active migration path to an empty target:

   ```text
   P3_SECONDARY_POSTGRES_URL=<target-migration-url>
   P3_SECONDARY_POSTGRES_ALLOW=1
   P3_CANONICAL_MIGRATIONS_PATH=<approved-canonical-migrations-path>
   npm run test:db-p3-secondary-provider
   ```

   This must report clean status, the complete schema contract, all seven
   raw-SQL invariants, application smoke success, and a future migration
   success before proceeding.

   Inventory `pg_extension` on both sides before choosing the dump/restore
   command. Provider-managed extensions are not portable by default: restore
   only extensions available on the target, and treat any missing extension or
   PostgreSQL-major-version mismatch as a compatibility stop requiring an
   operator decision. Use client tools compatible with the source server major
   version; never disable TLS or edit application data to work around a restore
   error.

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
2. Run the canonical migration path against the target with the migration URL.
3. Import the final snapshot without modifying `_prisma_migrations`:

   ```text
   pg_restore --data-only --no-owner --no-privileges --exit-on-error \
     --dbname=<target-migration-url> <protected-export-path>
   ```

4. Keep the source unchanged and authoritative until validation and smoke
   tests pass.

## 6. Validate before switching traffic

Run the reusable validator with both migration URLs held only in the operator
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

Only after validation passes, update the approved runtime and migration
configuration atomically in the deployment system:

1. `POSTGRES_RUNTIME_PROVIDER` → `pg`;
2. runtime `DATABASE_URL` → the exact approved Supabase runtime URL;
3. migration `DATABASE_MIGRATION_URL` → the exact approved Supabase migration
   URL. The legacy `DATABASE_URL_UNPOOLED`, `DIRECT_DATABASE_URL`, and
   `DIRECT_URL` aliases remain supported, but `DATABASE_MIGRATION_URL` takes
   precedence;
4. retain the old Neon values in the protected rollback procedure, not in
   source control or logs.

The supported configuration contract is explicit and has no hostname
inference:

```text
Neon (current/default):
POSTGRES_RUNTIME_PROVIDER=neon
DATABASE_URL=<Neon runtime URL>
DATABASE_MIGRATION_URL=<Neon migration URL>

Supabase (only after approval):
POSTGRES_RUNTIME_PROVIDER=pg
DATABASE_URL=<tested Supabase runtime URL>
DATABASE_MIGRATION_URL=<tested Supabase migration URL>
```

Immediately before and after the switch, run the read-only provider preflight
with the expected non-secret database identity supplied by the operator:

```text
APP_ENV=production
VISUTRY_PRODUCTION_READONLY_AUDIT_AUTHORIZED=1
P3_PROVIDER_PREFLIGHT_EXPECTED_ENVIRONMENT=PRODUCTION
P3_PROVIDER_PREFLIGHT_EXPECTED_DATABASE_IDENTITY=<approved-identity>
npm run db:provider:preflight
```

The preflight reports the selected provider, both database identities,
PostgreSQL version, the 42-table schema contract, all seven raw-SQL
invariants, and CLEAN migration status. It is read-only and never performs
baseline adoption.

Do not use blind DNS switching. Do not change the Prisma schema, edit
`_prisma_migrations`, or run an automatic baseline/resolve operation. If the
Cloudflare catalog path still points at Neon, do not release the switch: move
that path to Vercel or complete a separately reviewed explicit provider
boundary before resuming.

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

- Use an SSL-enabled PostgreSQL migration URL. Supabase Session Pooler
  session-mode (port 5432) is acceptable only because it passed the DB-P3
  rehearsal; do not use the transaction-mode pooler (port 6543) for Prisma
  migrations or `pg_dump`/`pg_restore`.
- Keep runtime and migration URLs separate even when they resolve to the same
  database. Prisma CLI precedence is `DATABASE_MIGRATION_URL` →
  `DATABASE_URL_UNPOOLED` → `DIRECT_DATABASE_URL` → `DIRECT_URL` →
  `DATABASE_URL`.
- `src/lib/postgres-runtime.ts` selects `PrismaNeon` by default and selects
  `PrismaPg` only for explicit `POSTGRES_RUNTIME_PROVIDER=pg`; application
  code continues to use the singleton in `src/lib/prisma.ts`.
- Choose runtime pooling only after validating the actual Supabase connection
  mode, serverless concurrency, timeout behavior, and connection limits.
- Compare source and target regions for latency and data-residency needs.
- Verify backup/PITR availability, retention, restore destination, and operator
  access for the selected account/plan; pricing and feature availability are
  intentionally not hardcoded here.
- The Node/Vercel application path is provider-selectable, but the current
  production Cloudflare approved catalog path remains Neon-specific. This
  runbook does not authorize a mixed-provider deployment; that edge path must
  be moved or separately providerized before `SUPABASE SWITCH READY` can be
  reported as YES.

## Prohibited shortcuts

- simultaneous baseline-lineage and provider cutover;
- blind DNS or environment-variable switching;
- direct insert/update/delete of `_prisma_migrations`;
- automatic baseline adoption during build/deploy;
- dual-write, Kafka, CQRS, or ad-hoc distributed transactions;
- destructive Neon shutdown before stabilization.
