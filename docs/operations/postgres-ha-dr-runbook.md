# PostgreSQL HA/DR runbook

This runbook describes the DB-P4 engineering design for a single-authority
PostgreSQL deployment:

- `supabase` is the intended primary.
- `neon_a` is the warm DR target.
- `neon_b` is the cold DR target.
- `ACTIVE_DB_PROVIDER` is the explicit authority selector.

Only one provider may be authoritative at a time. The initial design uses
portable PostgreSQL custom-format, data-only snapshots and deliberately does
not use continuous logical replication or automatic failover. The target is
an RPO of 15–30 minutes and an RTO of 10–20 minutes; these are planning
targets, not a production guarantee until measured with production-sized
snapshots.

## Operating rules

1. Keep the current authority and all deployment/migration workers pointed at
   the same provider.
2. Publish a fresh, checksummed snapshot on the configured interval. Keep at
   least the last 8 interval snapshots and one representative snapshot for
   each of the last 7 UTC days. Retention settings are configurable; the
   repository planner is dry-run only.
3. Record provider, sanitized database identity, timestamp, PostgreSQL
   version, canonical baseline SHA-256, application table count, dump size,
   dump SHA-256, and restore/validation times in `dr-state.json`. Never put a
   URL password, token, row data, or Git dump in a manifest.
4. A snapshot is not a failover authorization by itself. The target must have
   passed schema, raw-invariant, business-data, migration-status, and smoke
   validation.
5. Do not edit `_prisma_migrations` directly. Do not use `db push` or a
   provider-specific schema track as a recovery shortcut.

## Snapshot and restore commands

Use only from a local operator shell with explicit approvals and disposable
or separately authorized non-production identities during rehearsal:

```text
npm run db:ha:backup
npm run db:ha:restore
npm run db:ha:validate-data
npm run db:ha:status
npm run db:ha:capacity
npm run db:ha:watch
```

`db:ha:watch` is one scheduled health/backup tick: it checks the single
authority and triggers a backup only when that authority is healthy. It never
switches providers. Run it from the approved scheduler at the desired backup
interval; a failed tick must page an operator rather than initiate failover.

The backup and restore tools use PostgreSQL custom format and data-only
content. They exclude the Prisma migration ledger, environment identity
marker, rehearsal marker, and provider-owned schemas. The target must already
have the canonical schema. Restore does not make a target authoritative and
does not modify migration history.

## Health and capacity

`npm run db:ha:status` reports `HEALTHY`, `DEGRADED`, `UNAVAILABLE`, or
`UNKNOWN`. It checks connectivity, the 42-table schema contract, all seven
raw SQL invariants, and Prisma ledger health. It also requires exactly one
observed authority matching `ACTIVE_DB_PROVIDER`; multiple authorities are a
split-brain failure.

`npm run db:ha:capacity` is read-only. Its thresholds are:

- 60%: `WARNING`
- 75%: `ELEVATED`
- 85%: `ACTION`
- 90%: `CRITICAL`

The configured capacity limit must represent an approved provider limit. Do
not infer plan limits from this local tool or from unverified pricing.

## Controlled failover

Automatic failover is disabled. An operator may prepare a failover only after
the following serialized window has started:

1. Declare the current authority unavailable and fence it at the application,
   worker, cron, migration, and deployment layers.
2. Freeze writes and confirm that no unrelated deployment or migration job is
   running.
3. Confirm exactly one current authority and authorize the operator action.
4. Select the newest validated snapshot within the RPO budget.
5. Restore and validate the target, including business checks and
   `prisma migrate status` = clean.
6. Run:

   ```text
   npm run db:ha:prepare-failover -- --target=neon-a
   ```

7. Atomically switch the runtime pooled connection, direct migration
   connection, and `ACTIVE_DB_PROVIDER` to the target. Do not change only a
   DNS record or only one connection variable.
8. Deploy the already-reviewed application configuration, run preflight and
   critical smoke checks, verify new writes land only on the target, then
   reopen traffic.
9. Monitor the rollback window while retaining the old provider and snapshot.

If any gate is false, stop. The planner is fail-closed and performs no
environment mutation.

## Failback

Failback is another migration, not a blind switch-back:

1. Keep the current provider authoritative and freeze writes.
2. Export its latest authoritative snapshot.
3. Prepare the old provider from the canonical schema and restore the
   snapshot.
4. Validate row counts, constraints, raw invariants, business metrics,
   sequences/defaults, application smoke, and clean migration status.
5. Atomically switch all runtime/direct migration settings, verify the new
   authority, and reopen writes.
6. Keep the former provider and both manifests for the rollback window.

If target validation or smoke fails, do not attempt ad-hoc dual-write
reconciliation. Return to the still-authoritative source only after fencing
and confirming which provider owns the latest accepted writes.

## Split-brain prevention

The authority selector is explicit and must have one value. A failover is
blocked when the observed authority list contains more than one provider, the
target equals the current authority, writes are not frozen, fencing is not
confirmed, the target is not validated, the migration status is not clean, or
the snapshot is stale/missing. There is no automatic conflict resolution.

The full state transition is:

```text
HEALTHY authority
  -> DEGRADED/UNAVAILABLE observation
  -> fenced + writes frozen
  -> validated snapshot restored
  -> target migration status CLEAN
  -> atomically switched single authority
  -> smoke verified
  -> writes reopened + monitored
```

## Provider connection notes

For Supabase, use the direct PostgreSQL connection for Prisma migration and
`pg_dump`/`pg_restore` operations. Use the pooled/runtime connection for
serverless application traffic when required by the deployment model. Keep
SSL enabled and account for pooler transaction/session behavior; do not pass
Prisma-only connection parameters to libpq tools.

For a Neon target, use the direct connection for migration and snapshot
operations and the approved runtime connection for application traffic. A
warm target should be kept schema-current and regularly restore-validated; a
cold target may be restored on demand but must still pass the same validation
before authority is switched.

Before selecting any provider plan or region, verify current connection
limits, storage growth, compute behavior, backup/PITR retention, restore
availability, latency from Vercel/Cloudflare, and serverless connection
characteristics. Those values are operational inputs and are intentionally
not hard-coded here.

## Rehearsal boundary

The DB-P4 rehearsal uses disposable PostgreSQL 17 databases labeled as
Supabase, Neon-A, Neon-B, and failback targets. It does not access or mutate
Production or Preview. Live provider credentials are not required for the
local portability and round-trip rehearsal. A live provider test, when
authorized, must use an explicitly disposable non-production project and
must not weaken any guard.
