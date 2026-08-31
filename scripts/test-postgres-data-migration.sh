#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

ROOT="$PWD"
if [[ "${APP_ENV:-}" == "production" || "${APP_ENV:-}" == "preview" || "${VERCEL_ENV:-}" == "production" || "${VERCEL_ENV:-}" == "preview" ]]; then
  echo "❌ PostgreSQL migration rehearsal refuses deployed environments." >&2
  exit 1
fi

MIGRATIONS_PATH="${P3_CANONICAL_MIGRATIONS_PATH:-$ROOT/prisma/migrations}"
BASELINE_NAME="00000000000000_canonical_baseline"
BASELINE_SQL="$MIGRATIONS_PATH/$BASELINE_NAME/migration.sql"
if [[ ! -f "$BASELINE_SQL" ]]; then
  echo "DATA_MIGRATION_REHEARSAL: BLOCKED — canonical migration fixture is not available"
  if [[ "${P3_REQUIRE_CANONICAL_FIXTURE:-0}" == "1" ]]; then
    exit 1
  fi
  exit 0
fi

PG_BIN_DIR="${P3_PG_BIN_DIR:-$(dirname "$(command -v initdb)")}"
for binary in initdb pg_ctl pg_isready createdb psql pg_dump pg_restore; do
  if [[ ! -x "$PG_BIN_DIR/$binary" ]]; then
    echo "❌ Missing PostgreSQL binary: $PG_BIN_DIR/$binary" >&2
    exit 1
  fi
done

PORT="${P3_REHEARSAL_PGPORT:-55435}"
if "$PG_BIN_DIR/pg_isready" -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; then
  echo "❌ Port $PORT is already in use; choose P3_REHEARSAL_PGPORT." >&2
  exit 1
fi

TEST_ROOT="$(mktemp -d /tmp/visutry-db-p3-migration.XXXXXX)"
PGDATA="$TEST_ROOT/pgdata"
PGLOG="$TEST_ROOT/postgres.log"
SOURCE_DATABASE="p3_source_sim"
TARGET_DATABASE="p3_target_sim"
SOURCE_URL="postgresql://p3_local@127.0.0.1:${PORT}/${SOURCE_DATABASE}"
TARGET_URL="postgresql://p3_local@127.0.0.1:${PORT}/${TARGET_DATABASE}"
FUTURE_MIGRATIONS="$TEST_ROOT/future-migrations"
CONFIG="$ROOT/tests/fixtures/prisma-p3-test-config.ts"
DUMP_FILE="$TEST_ROOT/source-data.dump"
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

echo "→ Starting disposable PostgreSQL SOURCE_SIM/TARGET_SIM cluster"
"$PG_BIN_DIR/initdb" -D "$PGDATA" --username=p3_local --auth=trust >/dev/null
"$PG_BIN_DIR/pg_ctl" -D "$PGDATA" -o "-p $PORT -h 127.0.0.1" -l "$PGLOG" start >/dev/null
for _ in $(seq 1 30); do
  if "$PG_BIN_DIR/pg_isready" -h 127.0.0.1 -p "$PORT" -U p3_local -d postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
"$PG_BIN_DIR/pg_isready" -h 127.0.0.1 -p "$PORT" -U p3_local -d postgres >/dev/null 2>&1 || {
  echo "❌ Disposable PostgreSQL did not become ready." >&2
  safe_log "$PGLOG" >&2
  exit 1
}
"$PG_BIN_DIR/createdb" -h 127.0.0.1 -p "$PORT" -U p3_local "$SOURCE_DATABASE"
"$PG_BIN_DIR/createdb" -h 127.0.0.1 -p "$PORT" -U p3_local "$TARGET_DATABASE"

echo "→ Applying canonical schema to both disposable databases"
run_prisma "$SOURCE_URL" "$MIGRATIONS_PATH" migrate deploy >"$TEST_ROOT/source-baseline.log" 2>&1 || { safe_log "$TEST_ROOT/source-baseline.log" >&2; exit 1; }
run_prisma "$TARGET_URL" "$MIGRATIONS_PATH" migrate deploy >"$TEST_ROOT/target-baseline.log" 2>&1 || { safe_log "$TEST_ROOT/target-baseline.log" >&2; exit 1; }
run_prisma "$SOURCE_URL" "$MIGRATIONS_PATH" migrate status >"$TEST_ROOT/source-baseline-status.log" 2>&1 || { safe_log "$TEST_ROOT/source-baseline-status.log" >&2; exit 1; }
run_prisma "$TARGET_URL" "$MIGRATIONS_PATH" migrate status >"$TEST_ROOT/target-baseline-status.log" 2>&1 || { safe_log "$TEST_ROOT/target-baseline-status.log" >&2; exit 1; }
rg -qi 'database schema is up to date' "$TEST_ROOT/source-baseline-status.log" || { safe_log "$TEST_ROOT/source-baseline-status.log" >&2; exit 1; }
rg -qi 'database schema is up to date' "$TEST_ROOT/target-baseline-status.log" || { safe_log "$TEST_ROOT/target-baseline-status.log" >&2; exit 1; }

echo "→ Seeding SOURCE_SIM with synthetic relational VisuTry data"
P3_FIXTURE_DATABASE_URL="$SOURCE_URL" P3_READINESS_CONFIRM=1 APP_ENV=local \
  npx tsx scripts/postgres-data-migration-seed.ts >"$TEST_ROOT/seed-persistent.log" 2>&1 || {
  safe_log "$TEST_ROOT/seed-persistent.log" >&2
  exit 1
}

echo "→ Exporting SOURCE_SIM with pg_dump (migration ledger excluded)"
export_start="$SECONDS"
"$PG_BIN_DIR/pg_dump" -w --format=custom --data-only --no-owner --no-privileges \
  --exclude-table=public._prisma_migrations --file="$DUMP_FILE" "$SOURCE_URL" \
  >"$TEST_ROOT/pg-dump.log" 2>"$TEST_ROOT/pg-dump.err" || {
  safe_log "$TEST_ROOT/pg-dump.err" >&2
  exit 1
}
export_seconds=$((SECONDS - export_start))

echo "→ Importing the consistent snapshot into TARGET_SIM"
import_start="$SECONDS"
"$PG_BIN_DIR/pg_restore" --data-only --no-owner --no-privileges --exit-on-error \
  --dbname="$TARGET_URL" "$DUMP_FILE" >"$TEST_ROOT/pg-restore.log" 2>"$TEST_ROOT/pg-restore.err" || {
  safe_log "$TEST_ROOT/pg-restore.err" >&2
  exit 1
}
import_seconds=$((SECONDS - import_start))

echo "→ Validating schema, rows, constraints, typed values, timestamps, and business metrics"
validation_start="$SECONDS"
P3_SOURCE_DATABASE_URL="$SOURCE_URL" \
  P3_TARGET_DATABASE_URL="$TARGET_URL" \
  P3_READINESS_CONFIRM=1 \
  APP_ENV=local \
  npx tsx scripts/postgres-data-migration-validator.ts >"$TEST_ROOT/validation.log" 2>&1 || {
    safe_log "$TEST_ROOT/validation.log" >&2
    exit 1
  }
validation_seconds=$((SECONDS - validation_start))

mkdir -p "$FUTURE_MIGRATIONS/$BASELINE_NAME" "$FUTURE_MIGRATIONS/00000000000001_db_p3_future_rehearsal"
cp "$BASELINE_SQL" "$FUTURE_MIGRATIONS/$BASELINE_NAME/migration.sql"
cp "$ROOT/tests/fixtures/db-p3-future-migration.sql" "$FUTURE_MIGRATIONS/00000000000001_db_p3_future_rehearsal/migration.sql"

echo "→ Applying a normal future migration after the imported data"
run_prisma "$TARGET_URL" "$FUTURE_MIGRATIONS" migrate deploy >"$TEST_ROOT/future-deploy.log" 2>&1 || { safe_log "$TEST_ROOT/future-deploy.log" >&2; exit 1; }
run_prisma "$TARGET_URL" "$FUTURE_MIGRATIONS" migrate status >"$TEST_ROOT/future-status.log" 2>&1 || { safe_log "$TEST_ROOT/future-status.log" >&2; exit 1; }
rg -qi 'database schema is up to date' "$TEST_ROOT/future-status.log" || { safe_log "$TEST_ROOT/future-status.log" >&2; exit 1; }
MARKER="$("$PG_BIN_DIR/psql" -X -w -v ON_ERROR_STOP=1 "$TARGET_URL" -Atc "SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relname = 'DbP3MigrationRehearsalMarker' AND relkind = 'r')")"
[[ "$MARKER" == "t" ]] || { echo "❌ Future migration marker is missing." >&2; exit 1; }

echo "→ Simulating application switch to TARGET_SIM, then rollback to SOURCE_SIM"
smoke_start="$SECONDS"
P3_APPLICATION_DATABASE_URL="$TARGET_URL" P3_READINESS_CONFIRM=1 APP_ENV=local \
  npx tsx scripts/postgres-application-smoke.ts >"$TEST_ROOT/target-smoke.log" 2>&1 || {
  safe_log "$TEST_ROOT/target-smoke.log" >&2
  exit 1
}
P3_APPLICATION_DATABASE_URL="$SOURCE_URL" P3_READINESS_CONFIRM=1 APP_ENV=local \
  npx tsx scripts/postgres-application-smoke.ts >"$TEST_ROOT/source-rollback-smoke.log" 2>&1 || {
  safe_log "$TEST_ROOT/source-rollback-smoke.log" >&2
  exit 1
}
smoke_seconds=$((SECONDS - smoke_start))

echo "DATA_MIGRATION_REHEARSAL: PASS"
echo "SOURCE_TARGET_ROW_VALIDATION: PASS"
echo "BUSINESS_INVARIANTS: PASS"
echo "FUTURE_MIGRATION: PASS"
echo "ROLLBACK_REHEARSAL: PASS"
echo "TIMING_SECONDS: export=${export_seconds} import=${import_seconds} validation=${validation_seconds} smoke=${smoke_seconds}"
