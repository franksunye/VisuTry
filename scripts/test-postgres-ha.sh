#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

ROOT="$PWD"
source "$ROOT/scripts/lib/postgres-tools.sh"

APP_ENV_NORMALIZED="$(printf '%s' "${APP_ENV:-}" | tr '[:upper:]' '[:lower:]')"
VERCEL_ENV_NORMALIZED="$(printf '%s' "${VERCEL_ENV:-}" | tr '[:upper:]' '[:lower:]')"
if [[ "$APP_ENV_NORMALIZED" != "local" || "$VERCEL_ENV_NORMALIZED" == "production" || "$VERCEL_ENV_NORMALIZED" == "preview" ]]; then
  echo "❌ DB-P4 HA rehearsal requires APP_ENV=local and no deployed Vercel environment." >&2
  exit 1
fi

MIGRATIONS_PATH="${P4_CANONICAL_MIGRATIONS_PATH:-${P3_CANONICAL_MIGRATIONS_PATH:-}}"
if [[ -z "$MIGRATIONS_PATH" && -f "$ROOT/../visutry-db-p2b-canonical-migration-track/prisma/migrations/00000000000000_canonical_baseline/migration.sql" ]]; then
  MIGRATIONS_PATH="$ROOT/../visutry-db-p2b-canonical-migration-track/prisma/migrations"
fi
BASELINE_NAME="00000000000000_canonical_baseline"
BASELINE_SHA256="f9a2b98a7ec4fc519bbd38edcb95c76d29ecddeacbf4eb55a6eb2d8f01d2326e"
BASELINE_SQL="$MIGRATIONS_PATH/$BASELINE_NAME/migration.sql"
if [[ -z "$MIGRATIONS_PATH" || ! -f "$BASELINE_SQL" ]]; then
  echo "❌ Set P4_CANONICAL_MIGRATIONS_PATH to the approved canonical migration fixture." >&2
  exit 1
fi
if [[ "$(shasum -a 256 "$BASELINE_SQL" | awk '{print $1}')" != "$BASELINE_SHA256" ]]; then
  echo "❌ Approved canonical baseline checksum mismatch." >&2
  exit 1
fi

PG_BIN_DIR="$(resolve_p3_pg_bin_dir)"
PG_MAJOR="$(require_p3_pg_tools "$PG_BIN_DIR" initdb pg_ctl pg_isready createdb dropdb psql pg_dump pg_restore)"
if [[ "$PG_MAJOR" != "17" ]]; then
  echo "❌ DB-P4 local rehearsal requires PostgreSQL 17 tooling; found PostgreSQL $PG_MAJOR." >&2
  exit 1
fi

now_ms() {
  node -e 'process.stdout.write(String(Date.now()))'
}

TEST_ROOT="$(mktemp -d /tmp/visutry-db-p4-ha.XXXXXX)"
PGDATA="$TEST_ROOT/pgdata"
PGLOG="$TEST_ROOT/postgres.log"
PORT="${P4_HA_PGPORT:-55450}"
PRIMARY_DATABASE="p4_supabase_primary_sim"
NEON_A_DATABASE="p4_neon_a_sim"
NEON_B_DATABASE="p4_neon_b_sim"
FAILBACK_DATABASE="p4_supabase_failback_sim"
PRIMARY_URL="postgresql://p4_local@127.0.0.1:${PORT}/${PRIMARY_DATABASE}"
NEON_A_URL="postgresql://p4_local@127.0.0.1:${PORT}/${NEON_A_DATABASE}"
NEON_B_URL="postgresql://p4_local@127.0.0.1:${PORT}/${NEON_B_DATABASE}"
FAILBACK_URL="postgresql://p4_local@127.0.0.1:${PORT}/${FAILBACK_DATABASE}"
CONFIG="$ROOT/tests/fixtures/prisma-p3-test-config.ts"
FUTURE_MIGRATIONS="$TEST_ROOT/future-migrations"
BACKUP_PRIMARY="$TEST_ROOT/backup-supabase"
BACKUP_NEON_A="$TEST_ROOT/backup-neon-a"

trap '"$PG_BIN_DIR/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1 && "$PG_BIN_DIR/pg_ctl" -D "$PGDATA" -m fast stop >/dev/null 2>&1 || true; rm -rf "$TEST_ROOT"' EXIT INT TERM

safe_log() {
  sed -E 's#postgres(ql)?://[^[:space:]"'"'"')>]+#[redacted PostgreSQL URL]#g' "$1"
}

run_prisma() {
  env -u DATABASE_URL -u DATABASE_URL_UNPOOLED -u DIRECT_URL -u DIRECT_DATABASE_URL \
    APP_ENV=local \
    P3_TEST_DATABASE_URL="$1" \
    P3_TEST_SCHEMA_PATH="$ROOT/prisma/schema.prisma" \
    P3_TEST_MIGRATIONS_PATH="$2" \
    npx prisma "${@:3}" --config "$CONFIG"
}

run_tsx() {
  env -u DATABASE_URL -u DATABASE_URL_UNPOOLED -u DIRECT_URL -u DIRECT_DATABASE_URL \
    APP_ENV=local \
    npx tsx "$@"
}

psql_local() {
  "$PG_BIN_DIR/psql" -X -w -v ON_ERROR_STOP=1 "$1" "${@:2}"
}

set_marker() {
  local database_url="$1"
  local environment="$2"
  local identity="$3"
  psql_local "$database_url" -c "INSERT INTO \"EnvironmentMetadata\" (\"id\", \"environment\", \"databaseIdentity\", \"createdAt\", \"updatedAt\") VALUES ('primary', '$environment', '$identity', TIMESTAMP '2026-01-01 00:00:00', TIMESTAMP '2026-01-01 00:00:00')"
}

status_clean() {
  local database_url="$1"
  local status_log="$2"
  run_prisma "$database_url" "$MIGRATIONS_PATH" migrate status >"$status_log" 2>&1 || return 1
  rg -qi 'database schema is up to date' "$status_log"
}

apply_baseline() {
  local database_url="$1"
  local label="$2"
  if ! run_prisma "$database_url" "$MIGRATIONS_PATH" migrate deploy >"$TEST_ROOT/${label}-baseline-deploy.log" 2>&1; then
    safe_log "$TEST_ROOT/${label}-baseline-deploy.log" >&2
    return 1
  fi
  status_clean "$database_url" "$TEST_ROOT/${label}-baseline-status.log" || {
    safe_log "$TEST_ROOT/${label}-baseline-status.log" >&2
    return 1
  }
}

echo "→ Starting disposable PostgreSQL 17 cluster for Supabase/Neon-A/Neon-B simulations"
if "$PG_BIN_DIR/pg_isready" -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; then
  echo "❌ Port $PORT is already in use; choose P4_HA_PGPORT." >&2
  exit 1
fi
"$PG_BIN_DIR/initdb" -D "$PGDATA" --username=p4_local --auth=trust >/dev/null
"$PG_BIN_DIR/pg_ctl" -D "$PGDATA" -o "-p $PORT -h 127.0.0.1" -l "$PGLOG" start >/dev/null
for _ in $(seq 1 30); do
  "$PG_BIN_DIR/pg_isready" -h 127.0.0.1 -p "$PORT" -U p4_local -d postgres >/dev/null 2>&1 && break
  sleep 1
done
"$PG_BIN_DIR/pg_isready" -h 127.0.0.1 -p "$PORT" -U p4_local -d postgres >/dev/null 2>&1 || {
  echo "❌ Disposable PostgreSQL did not become ready." >&2
  safe_log "$PGLOG" >&2
  exit 1
}
for database in "$PRIMARY_DATABASE" "$NEON_A_DATABASE" "$NEON_B_DATABASE" "$FAILBACK_DATABASE"; do
  "$PG_BIN_DIR/createdb" -h 127.0.0.1 -p "$PORT" -U p4_local "$database"
done

schema_start="$(now_ms)"
apply_baseline "$PRIMARY_URL" primary
apply_baseline "$NEON_A_URL" neon-a
apply_baseline "$NEON_B_URL" neon-b
apply_baseline "$FAILBACK_URL" failback
schema_ms=$(( $(now_ms) - schema_start ))

set_marker "$PRIMARY_URL" SUPABASE "127.0.0.1/$PRIMARY_DATABASE"
set_marker "$NEON_A_URL" NEON_A "127.0.0.1/$NEON_A_DATABASE"
set_marker "$NEON_B_URL" NEON_B "127.0.0.1/$NEON_B_DATABASE"
set_marker "$FAILBACK_URL" SUPABASE "127.0.0.1/$FAILBACK_DATABASE"

echo "→ Seeding representative application data into the simulated Supabase authority"
source_prep_start="$(now_ms)"
SEED_SCRIPT="scripts/postgres-data-migration-seed.ts"
DATASET="users=1 tryOnTasks=2 generationRequests=1 generationAttempts=1 faceShapeDetections=0 faceAnalysisTasks=1 payments=1 merchantUsageRows=2 sponsoredUsageRows=1"
if [[ "${P4_HA_REHEARSAL_SCALE:-0}" == "1" ]]; then
  SEED_SCRIPT="scripts/postgres-data-migration-scale-seed.ts"
  DATASET="users=5000 tryOnTasks=20000 generationRequests=20000 generationAttempts=30000 faceShapeDetections=50000 faceAnalysisTasks=5000 payments=5000 merchantUsageRows=5000 sponsoredUsageRows=5000"
fi
if ! P3_FIXTURE_DATABASE_URL="$PRIMARY_URL" P3_READINESS_CONFIRM=1 APP_ENV=local \
  run_tsx "$SEED_SCRIPT" >"$TEST_ROOT/source-seed.log" 2>&1; then
  safe_log "$TEST_ROOT/source-seed.log" >&2
  exit 1
fi
source_prep_ms=$(( $(now_ms) - source_prep_start ))

echo "→ Detecting healthy authority and creating its provider-neutral backup"
export_start="$(now_ms)"
if ! P4_DR_WATCH_ALLOW=1 P4_DR_BACKUP_ALLOW=1 APP_ENV=local \
  ACTIVE_DB_PROVIDER=supabase \
  P4_DR_SUPABASE_DATABASE_URL="$PRIMARY_URL" \
  P4_DR_SUPABASE_DATABASE_IDENTITY="127.0.0.1/$PRIMARY_DATABASE" \
  P4_DR_SUPABASE_DATABASE_ENVIRONMENT=SUPABASE \
  P4_DR_BACKUP_DIR="$BACKUP_PRIMARY" \
  run_tsx scripts/postgres-dr-watch.ts >"$TEST_ROOT/primary-watch.log" 2>&1; then
  safe_log "$TEST_ROOT/primary-watch.log" >&2
  exit 1
fi
export_ms=$(( $(now_ms) - export_start ))
PRIMARY_MANIFEST="$BACKUP_PRIMARY/dr-state.json"

echo "→ Restoring the same snapshot into independent Neon-A and Neon-B simulations"
import_start="$(now_ms)"
for target in neon-a neon-b; do
  if [[ "$target" == "neon-a" ]]; then
    target_url="$NEON_A_URL"
    target_db="$NEON_A_DATABASE"
    target_env=NEON_A
  else
    target_url="$NEON_B_URL"
    target_db="$NEON_B_DATABASE"
    target_env=NEON_B
  fi
  if ! P4_DR_RESTORE_ALLOW=1 APP_ENV=local \
    P4_DR_TARGET_PROVIDER="$target" \
    P4_DR_TARGET_DATABASE_URL="$target_url" \
    P4_DR_TARGET_DATABASE_IDENTITY="127.0.0.1/$target_db" \
    P4_DR_EXPECTED_TARGET_ENVIRONMENT="$target_env" \
    P4_DR_BACKUP_MANIFEST="$PRIMARY_MANIFEST" \
    P4_SOURCE_POSTGRES_MAJOR=17 \
    run_tsx scripts/postgres-dr-restore.ts >"$TEST_ROOT/${target}-restore.log" 2>&1; then
    safe_log "$TEST_ROOT/${target}-restore.log" >&2
    exit 1
  fi
done
import_ms=$(( $(now_ms) - import_start ))

echo "→ Validating source/target row counts, constraints, typed values, and business metrics"
validation_start="$(now_ms)"
if ! P4_DR_VALIDATE_ALLOW=1 APP_ENV=local \
  P4_DR_SOURCE_DATABASE_URL="$PRIMARY_URL" \
  P4_DR_SOURCE_DATABASE_IDENTITY="127.0.0.1/$PRIMARY_DATABASE" \
  P4_DR_EXPECTED_SOURCE_ENVIRONMENT=SUPABASE \
  P4_DR_TARGET_DATABASE_URL="$NEON_A_URL" \
  P4_DR_TARGET_DATABASE_IDENTITY="127.0.0.1/$NEON_A_DATABASE" \
  P4_DR_EXPECTED_TARGET_ENVIRONMENT=NEON_A \
  run_tsx scripts/postgres-dr-validate.ts >"$TEST_ROOT/neon-a-validation.log" 2>&1; then
  safe_log "$TEST_ROOT/neon-a-validation.log" >&2
  exit 1
fi
if ! P4_DR_VALIDATE_ALLOW=1 APP_ENV=local \
  P4_DR_SOURCE_DATABASE_URL="$PRIMARY_URL" \
  P4_DR_SOURCE_DATABASE_IDENTITY="127.0.0.1/$PRIMARY_DATABASE" \
  P4_DR_EXPECTED_SOURCE_ENVIRONMENT=SUPABASE \
  P4_DR_TARGET_DATABASE_URL="$NEON_B_URL" \
  P4_DR_TARGET_DATABASE_IDENTITY="127.0.0.1/$NEON_B_DATABASE" \
  P4_DR_EXPECTED_TARGET_ENVIRONMENT=NEON_B \
  run_tsx scripts/postgres-dr-validate.ts >"$TEST_ROOT/neon-b-validation.log" 2>&1; then
  safe_log "$TEST_ROOT/neon-b-validation.log" >&2
  exit 1
fi
validation_ms=$(( $(now_ms) - validation_start ))

echo "→ Applying a normal future migration to both simulated DR targets"
mkdir -p "$FUTURE_MIGRATIONS/$BASELINE_NAME" "$FUTURE_MIGRATIONS/00000000000001_db_p4_future_rehearsal"
cp "$BASELINE_SQL" "$FUTURE_MIGRATIONS/$BASELINE_NAME/migration.sql"
cp "$ROOT/tests/fixtures/db-p3-future-migration.sql" "$FUTURE_MIGRATIONS/00000000000001_db_p4_future_rehearsal/migration.sql"
for target in "$NEON_A_URL" "$NEON_B_URL"; do
  run_prisma "$target" "$FUTURE_MIGRATIONS" migrate deploy >"$TEST_ROOT/$(basename "$target")-future-deploy.log" 2>&1 || {
    safe_log "$TEST_ROOT/$(basename "$target")-future-deploy.log" >&2
    exit 1
  }
  status_clean "$target" "$TEST_ROOT/$(basename "$target")-future-status.log" || {
    safe_log "$TEST_ROOT/$(basename "$target")-future-status.log" >&2
    exit 1
  }
done

echo "→ Running transactional application smoke and one durable write on Neon-A"
smoke_start="$(now_ms)"
for target in neon-a neon-b; do
  target_url="$NEON_A_URL"
  [[ "$target" == "neon-b" ]] && target_url="$NEON_B_URL"
  if ! P3_APPLICATION_DATABASE_URL="$target_url" P3_READINESS_CONFIRM=1 APP_ENV=local \
    run_tsx scripts/postgres-application-smoke.ts >"$TEST_ROOT/${target}-application-smoke.log" 2>&1; then
    safe_log "$TEST_ROOT/${target}-application-smoke.log" >&2
    exit 1
  fi
done
if ! P4_DR_WRITE_ALLOW=1 APP_ENV=local \
  P4_DR_WRITE_DATABASE_URL="$NEON_A_URL" \
  P4_DR_WRITE_DATABASE_IDENTITY="127.0.0.1/$NEON_A_DATABASE" \
  P4_DR_WRITE_EXPECTED_ENVIRONMENT=NEON_A \
  run_tsx scripts/postgres-dr-write-smoke.ts >"$TEST_ROOT/neon-a-write-smoke.log" 2>&1; then
  safe_log "$TEST_ROOT/neon-a-write-smoke.log" >&2
  exit 1
fi
smoke_ms=$(( $(now_ms) - smoke_start ))

echo "→ Checking single-authority, stale-backup, migration-clean, and split-brain gates"
P4_PLANNER_BASE_ENV=(APP_ENV=local ACTIVE_DB_PROVIDER=supabase P4_OBSERVED_AUTHORITY_PROVIDERS=supabase P4_FAILOVER_OPERATOR_AUTHORIZED=1 P4_FENCING_CONFIRMED=1 P4_WRITES_FROZEN=1 P4_TARGET_VALIDATED=1 P4_TARGET_MIGRATION_STATUS=CLEAN P4_NEWEST_VALIDATED_BACKUP="$PRIMARY_MANIFEST")
if ! env "${P4_PLANNER_BASE_ENV[@]}" npx --no-install tsx scripts/postgres-ha.ts prepare-failover --target=neon-a >"$TEST_ROOT/failover-plan.log" 2>&1; then
  safe_log "$TEST_ROOT/failover-plan.log" >&2
  exit 1
fi
sleep 2
if env "${P4_PLANNER_BASE_ENV[@]}" P4_BACKUP_MAX_AGE_SECONDS=0 npx --no-install tsx scripts/postgres-ha.ts prepare-failover --target=neon-a >"$TEST_ROOT/stale-backup.log" 2>&1; then
  echo "❌ Stale backup was incorrectly accepted by the failover planner." >&2
  exit 1
fi
if env "${P4_PLANNER_BASE_ENV[@]}" P4_OBSERVED_AUTHORITY_PROVIDERS=supabase,neon-a npx --no-install tsx scripts/postgres-ha.ts prepare-failover --target=neon-a >"$TEST_ROOT/split-brain.log" 2>&1; then
  echo "❌ Split-brain authority state was incorrectly accepted." >&2
  exit 1
fi
if env "${P4_PLANNER_BASE_ENV[@]}" P4_TARGET_MIGRATION_STATUS=DIVERGED npx --no-install tsx scripts/postgres-ha.ts prepare-failover --target=neon-a >"$TEST_ROOT/dirty-target.log" 2>&1; then
  echo "❌ Non-clean target migration status was incorrectly accepted." >&2
  exit 1
fi

echo "→ Verifying all three provider health states and capacity thresholds"
health_start="$(now_ms)"
if ! ACTIVE_DB_PROVIDER=supabase P4_OBSERVED_AUTHORITY_PROVIDERS=supabase APP_ENV=local \
  P4_DR_SUPABASE_DATABASE_URL="$PRIMARY_URL" P4_DR_SUPABASE_DATABASE_IDENTITY="127.0.0.1/$PRIMARY_DATABASE" P4_DR_SUPABASE_DATABASE_ENVIRONMENT=SUPABASE \
  P4_DR_NEON_A_DATABASE_URL="$NEON_A_URL" P4_DR_NEON_A_DATABASE_IDENTITY="127.0.0.1/$NEON_A_DATABASE" P4_DR_NEON_A_DATABASE_ENVIRONMENT=NEON_A \
  P4_DR_NEON_B_DATABASE_URL="$NEON_B_URL" P4_DR_NEON_B_DATABASE_IDENTITY="127.0.0.1/$NEON_B_DATABASE" P4_DR_NEON_B_DATABASE_ENVIRONMENT=NEON_B \
  run_tsx scripts/postgres-dr-health.ts >"$TEST_ROOT/health.log" 2>&1; then
  safe_log "$TEST_ROOT/health.log" >&2
  exit 1
fi
if ! P4_CAPACITY_ALLOW=1 APP_ENV=local \
  P4_CAPACITY_DATABASE_URL="$PRIMARY_URL" \
  P4_CAPACITY_DATABASE_IDENTITY="127.0.0.1/$PRIMARY_DATABASE" \
  P4_CAPACITY_EXPECTED_ENVIRONMENT=SUPABASE \
  P4_CAPACITY_LIMIT_BYTES=1073741824 \
  run_tsx scripts/postgres-dr-capacity.ts >"$TEST_ROOT/capacity.log" 2>&1; then
  safe_log "$TEST_ROOT/capacity.log" >&2
  exit 1
fi
health_ms=$(( $(now_ms) - health_start ))

echo "→ Rehearsing failback: Neon-A authoritative snapshot back to a fresh Supabase target"
failback_export_start="$(now_ms)"
if ! P4_DR_BACKUP_ALLOW=1 APP_ENV=local \
  P4_DR_SOURCE_PROVIDER=neon_a \
  P4_DR_SOURCE_DATABASE_URL="$NEON_A_URL" \
  P4_DR_SOURCE_DATABASE_IDENTITY="127.0.0.1/$NEON_A_DATABASE" \
  P4_DR_EXPECTED_SOURCE_ENVIRONMENT=NEON_A \
  P4_DR_BACKUP_DIR="$BACKUP_NEON_A" \
  run_tsx scripts/postgres-dr-backup.ts >"$TEST_ROOT/neon-a-backup.log" 2>&1; then
  safe_log "$TEST_ROOT/neon-a-backup.log" >&2
  exit 1
fi
failback_export_ms=$(( $(now_ms) - failback_export_start ))
NEON_A_MANIFEST="$BACKUP_NEON_A/dr-state.json"
if ! P4_DR_RESTORE_ALLOW=1 APP_ENV=local \
  P4_DR_TARGET_PROVIDER=supabase \
  P4_DR_TARGET_DATABASE_URL="$FAILBACK_URL" \
  P4_DR_TARGET_DATABASE_IDENTITY="127.0.0.1/$FAILBACK_DATABASE" \
  P4_DR_EXPECTED_TARGET_ENVIRONMENT=SUPABASE \
  P4_DR_BACKUP_MANIFEST="$NEON_A_MANIFEST" \
  P4_SOURCE_POSTGRES_MAJOR=17 \
  run_tsx scripts/postgres-dr-restore.ts >"$TEST_ROOT/failback-restore.log" 2>&1; then
  safe_log "$TEST_ROOT/failback-restore.log" >&2
  exit 1
fi
run_prisma "$FAILBACK_URL" "$FUTURE_MIGRATIONS" migrate deploy >"$TEST_ROOT/failback-future-deploy.log" 2>&1 || {
  safe_log "$TEST_ROOT/failback-future-deploy.log" >&2
  exit 1
}
status_clean "$FAILBACK_URL" "$TEST_ROOT/failback-future-status.log" || {
  safe_log "$TEST_ROOT/failback-future-status.log" >&2
  exit 1
}
if ! P4_DR_VALIDATE_ALLOW=1 APP_ENV=local \
  P4_DR_SOURCE_DATABASE_URL="$NEON_A_URL" P4_DR_SOURCE_DATABASE_IDENTITY="127.0.0.1/$NEON_A_DATABASE" P4_DR_EXPECTED_SOURCE_ENVIRONMENT=NEON_A \
  P4_DR_TARGET_DATABASE_URL="$FAILBACK_URL" P4_DR_TARGET_DATABASE_IDENTITY="127.0.0.1/$FAILBACK_DATABASE" P4_DR_EXPECTED_TARGET_ENVIRONMENT=SUPABASE \
  run_tsx scripts/postgres-dr-validate.ts >"$TEST_ROOT/failback-validation.log" 2>&1; then
  safe_log "$TEST_ROOT/failback-validation.log" >&2
  exit 1
fi
if ! P4_FAILBACK_OPERATOR_AUTHORIZED=1 P4_WRITES_FROZEN=1 APP_ENV=local \
  ACTIVE_DB_PROVIDER=neon_a P4_OBSERVED_AUTHORITY_PROVIDERS=neon_a \
  npx --no-install tsx scripts/postgres-ha.ts failback-plan --from=neon_a --to=supabase >"$TEST_ROOT/failback-plan.log" 2>&1; then
  safe_log "$TEST_ROOT/failback-plan.log" >&2
  exit 1
fi

echo "SCENARIO: LOCAL_SYNTHETIC_ONLY"
echo "POSTGRES_MAJOR: $PG_MAJOR"
echo "DATASET: $DATASET"
echo "APPLICATION_TABLES: 42"
echo "NEON_A_RESTORE: PASS"
echo "NEON_B_RESTORE: PASS"
echo "PORTABLE_BACKUP: PASS"
echo "STRUCTURAL_VALIDATION: PASS"
echo "BUSINESS_VALIDATION: PASS"
echo "POST_IMPORT_WRITE_SEQUENCE: PASS"
echo "HEALTH_CHECK: PASS"
echo "CAPACITY_GUARD: PASS"
echo "STALE_BACKUP_DETECTION: PASS"
echo "SPLIT_BRAIN_GUARD: PASS"
echo "FAILOVER_PLAN: PASS"
echo "FAILBACK_PLAN: PASS"
echo "FULL_ROUND_TRIP: PASS"
echo "TIMING_SOURCE_PREP_MS: $source_prep_ms"
echo "TIMING_SCHEMA_PREP_MS: $schema_ms"
echo "TIMING_EXPORT_MS: $export_ms"
echo "TIMING_IMPORT_MS: $import_ms"
echo "TIMING_VALIDATION_MS: $validation_ms"
echo "TIMING_SMOKE_MS: $smoke_ms"
echo "TIMING_FAILBACK_EXPORT_MS: $failback_export_ms"
echo "TIMING_HEALTH_AND_CAPACITY_MS: $health_ms"
echo "RPO_TARGET_SECONDS: 1800"
echo "RTO_TARGET_SECONDS: 1200"
