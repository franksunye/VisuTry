#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

ROOT="$PWD"
source "$ROOT/scripts/lib/postgres-tools.sh"

if [[ "${APP_ENV:-}" != "local" || "${VERCEL_ENV:-}" == "production" || "${VERCEL_ENV:-}" == "preview" ]]; then
  echo "❌ PostgreSQL provider DR rehearsal requires APP_ENV=local and no deployed Vercel environment." >&2
  exit 1
fi
if [[ "${P3_EXTERNAL_SOURCE_ALLOW:-}" != "1" ]]; then
  echo "❌ Set P3_EXTERNAL_SOURCE_ALLOW=1 for an explicitly approved non-production source snapshot." >&2
  exit 1
fi

SOURCE_URL="${P3_EXTERNAL_SOURCE_DATABASE_URL:-}"
SOURCE_IDENTITY="${P3_EXTERNAL_SOURCE_DATABASE_IDENTITY:-}"
SOURCE_MAJOR="${P3_SOURCE_POSTGRES_MAJOR:-}"
if [[ -z "$SOURCE_URL" || -z "$SOURCE_IDENTITY" || -z "$SOURCE_MAJOR" ]]; then
  echo "❌ P3_EXTERNAL_SOURCE_DATABASE_URL, P3_EXTERNAL_SOURCE_DATABASE_IDENTITY, and P3_SOURCE_POSTGRES_MAJOR are required." >&2
  exit 1
fi
if [[ ! "$SOURCE_MAJOR" =~ ^[0-9]+$ ]]; then
  echo "❌ P3_SOURCE_POSTGRES_MAJOR must be a numeric PostgreSQL major version." >&2
  exit 1
fi
SOURCE_IDENTITY_NORMALIZED="$(printf '%s' "$SOURCE_IDENTITY" | tr '[:upper:]' '[:lower:]')"
case "$SOURCE_IDENTITY_NORMALIZED" in
  *production*|*preview*|*ep-wandering-union-ad43rx1s*|*ep-old-frog-adgzp23w*|*steep-silence-18355430*)
    echo "❌ External DR source identity looks protected; refusing the rehearsal." >&2
    exit 1
    ;;
esac

MIGRATIONS_PATH="${P3_CANONICAL_MIGRATIONS_PATH:-$ROOT/prisma/migrations}"
BASELINE_NAME="00000000000000_canonical_baseline"
BASELINE_SQL="$MIGRATIONS_PATH/$BASELINE_NAME/migration.sql"
EXPECTED_BASELINE_SHA256="f9a2b98a7ec4fc519bbd38edcb95c76d29ecddeacbf4eb55a6eb2d8f01d2326e"
if [[ ! -f "$BASELINE_SQL" ]]; then
  echo "❌ Canonical migration fixture is not available at the requested path." >&2
  exit 1
fi
actual_baseline_sha256="$(shasum -a 256 "$BASELINE_SQL" | awk '{print $1}')"
if [[ "$actual_baseline_sha256" != "$EXPECTED_BASELINE_SHA256" ]]; then
  echo "❌ Canonical baseline SHA-256 does not match the approved artifact." >&2
  exit 1
fi

PG_BIN_DIR="$(resolve_p3_pg_bin_dir)"
PG_MAJOR="$(require_p3_pg_tools "$PG_BIN_DIR" initdb pg_ctl pg_isready createdb psql pg_dump pg_restore)"
echo "POSTGRES_TOOLCHAIN: PG$PG_MAJOR ($PG_BIN_DIR)"

now_ms() {
  node -e 'process.stdout.write(String(Date.now()))'
}

TEST_ROOT="$(mktemp -d /tmp/visutry-db-p3-provider-dr.XXXXXX)"
PGDATA="$TEST_ROOT/pgdata"
PGLOG="$TEST_ROOT/postgres.log"
PORT="${P3_PROVIDER_DR_PGPORT:-55439}"
SOURCE_DATABASE="p3_provider_dr_source_sim"
TARGET_DATABASE="p3_provider_dr_target_sim"
LOCAL_SOURCE_URL="postgresql://p3_local@127.0.0.1:${PORT}/${SOURCE_DATABASE}"
LOCAL_TARGET_URL="postgresql://p3_local@127.0.0.1:${PORT}/${TARGET_DATABASE}"
FUTURE_MIGRATIONS="$TEST_ROOT/future-migrations"
CONFIG="$ROOT/tests/fixtures/prisma-p3-test-config.ts"
DUMP_FILE="$TEST_ROOT/supabase-public-data.dump"
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

if "$PG_BIN_DIR/pg_isready" -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; then
  echo "❌ Port $PORT is already in use; choose P3_PROVIDER_DR_PGPORT." >&2
  exit 1
fi

echo "→ Verifying the explicitly approved non-production source identity"
SOURCE_PREFLIGHT_ERR="$TEST_ROOT/source-preflight.err"
SOURCE_MARKER_TABLE="$($PG_BIN_DIR/psql -X -w -v ON_ERROR_STOP=1 "$SOURCE_URL" -Atc "SELECT to_regclass('public.\"EnvironmentMetadata\"')::text" 2>"$SOURCE_PREFLIGHT_ERR" || { safe_log "$SOURCE_PREFLIGHT_ERR" >&2; exit 1; })"
if [[ -n "$SOURCE_MARKER_TABLE" ]]; then
  SOURCE_ENVIRONMENT="$($PG_BIN_DIR/psql -X -w -v ON_ERROR_STOP=1 "$SOURCE_URL" -Atc "SELECT COALESCE(\"environment\", '') FROM \"EnvironmentMetadata\" WHERE \"id\" = 'primary' LIMIT 1" 2>"$SOURCE_PREFLIGHT_ERR" || { safe_log "$SOURCE_PREFLIGHT_ERR" >&2; exit 1; })"
  SOURCE_ENVIRONMENT_NORMALIZED="$(printf '%s' "$SOURCE_ENVIRONMENT" | tr '[:lower:]' '[:upper:]')"
  case "$SOURCE_ENVIRONMENT_NORMALIZED" in
    PRODUCTION|PREVIEW)
      echo "❌ External source reports a Production or Preview EnvironmentMetadata marker." >&2
      exit 1
      ;;
  esac
fi
echo "SOURCE_IDENTITY: non-production identity accepted"

echo "→ Starting disposable PostgreSQL 17 target cluster"
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

schema_prep_start="$(now_ms)"
for database_url in "$LOCAL_SOURCE_URL" "$LOCAL_TARGET_URL"; do
  run_prisma "$database_url" "$MIGRATIONS_PATH" migrate deploy >"$TEST_ROOT/$(basename "$database_url")-baseline.log" 2>&1 || {
    safe_log "$TEST_ROOT/$(basename "$database_url")-baseline.log" >&2
    exit 1
  }
done
schema_prep_ms=$(( $(now_ms) - schema_prep_start ))

echo "→ Exporting the non-production source snapshot with pg_dump"
export_start="$(now_ms)"
if ! "$PG_BIN_DIR/pg_dump" -w --format=custom --data-only --no-owner --no-privileges \
  --schema=public \
  --exclude-table=public._prisma_migrations \
  --exclude-table='public."EnvironmentMetadata"' \
  --exclude-table='public."DbP3MigrationRehearsalMarker"' \
  --file="$DUMP_FILE" "$SOURCE_URL" \
  >"$TEST_ROOT/pg-dump.log" 2>"$TEST_ROOT/pg-dump.err"; then
  safe_log "$TEST_ROOT/pg-dump.err" >&2
  exit 1
fi
export_ms=$(( $(now_ms) - export_start ))

"$PG_BIN_DIR/pg_restore" --list "$DUMP_FILE" >"$TEST_ROOT/pg-dump.list" 2>"$TEST_ROOT/pg-dump-list.err" || {
  safe_log "$TEST_ROOT/pg-dump-list.err" >&2
  exit 1
}
if rg -n '(^|[[:space:]])(pg_catalog|information_schema|pg_toast|supabase_[^[:space:]]*|_prisma_migrations|EnvironmentMetadata|DbP3MigrationRehearsalMarker)([[:space:]]|$)|EXTENSION' "$TEST_ROOT/pg-dump.list"; then
  echo "❌ Source dump contains a system, provider, environment-marker, migration, or test-fixture entry." >&2
  exit 1
fi

echo "→ Restoring the provider-neutral source snapshot into SOURCE_SIM and TARGET_SIM"
import_start="$(now_ms)"
for database_url in "$LOCAL_SOURCE_URL" "$LOCAL_TARGET_URL"; do
  if ! "$PG_BIN_DIR/pg_restore" --data-only --no-owner --no-privileges --exit-on-error \
    --dbname="$database_url" "$DUMP_FILE" \
    >"$TEST_ROOT/$(basename "$database_url")-restore.log" 2>"$TEST_ROOT/$(basename "$database_url")-restore.err"; then
    safe_log "$TEST_ROOT/$(basename "$database_url")-restore.err" >&2
    exit 1
  fi
done
import_ms=$(( $(now_ms) - import_start ))

validation_start="$(now_ms)"
if ! P3_SOURCE_DATABASE_URL="$LOCAL_SOURCE_URL" \
  P3_TARGET_DATABASE_URL="$LOCAL_TARGET_URL" \
  P3_READINESS_CONFIRM=1 \
  P3_VALIDATION_MODE=structural \
  APP_ENV=local \
  npx tsx scripts/postgres-data-migration-validator.ts >"$TEST_ROOT/structural-validation.log" 2>&1; then
  safe_log "$TEST_ROOT/structural-validation.log" >&2
  exit 1
fi
validation_ms=$(( $(now_ms) - validation_start ))

business_validation_start="$(now_ms)"
if ! P3_SOURCE_DATABASE_URL="$LOCAL_SOURCE_URL" \
  P3_TARGET_DATABASE_URL="$LOCAL_TARGET_URL" \
  P3_READINESS_CONFIRM=1 \
  P3_VALIDATION_MODE=business \
  APP_ENV=local \
  npx tsx scripts/postgres-data-migration-validator.ts >"$TEST_ROOT/business-validation.log" 2>&1; then
  safe_log "$TEST_ROOT/business-validation.log" >&2
  exit 1
fi
business_validation_ms=$(( $(now_ms) - business_validation_start ))

echo "→ Running post-import write/default/sequence smoke on TARGET_SIM"
smoke_start="$(now_ms)"
if ! P3_APPLICATION_DATABASE_URL="$LOCAL_TARGET_URL" P3_READINESS_CONFIRM=1 APP_ENV=local \
  npx tsx scripts/postgres-application-smoke.ts >"$TEST_ROOT/target-smoke.log" 2>&1; then
  safe_log "$TEST_ROOT/target-smoke.log" >&2
  exit 1
fi
smoke_ms=$(( $(now_ms) - smoke_start ))

mkdir -p "$FUTURE_MIGRATIONS/$BASELINE_NAME" "$FUTURE_MIGRATIONS/00000000000001_db_p3_provider_dr_future"
cp "$BASELINE_SQL" "$FUTURE_MIGRATIONS/$BASELINE_NAME/migration.sql"
cp "$ROOT/tests/fixtures/db-p3-future-migration.sql" "$FUTURE_MIGRATIONS/00000000000001_db_p3_provider_dr_future/migration.sql"

echo "→ Applying a normal future migration after the restored data"
future_start="$(now_ms)"
run_prisma "$LOCAL_TARGET_URL" "$FUTURE_MIGRATIONS" migrate deploy >"$TEST_ROOT/future-deploy.log" 2>&1 || {
  safe_log "$TEST_ROOT/future-deploy.log" >&2
  exit 1
}
run_prisma "$LOCAL_TARGET_URL" "$FUTURE_MIGRATIONS" migrate status >"$TEST_ROOT/future-status.log" 2>&1 || {
  safe_log "$TEST_ROOT/future-status.log" >&2
  exit 1
}
rg -qi 'database schema is up to date' "$TEST_ROOT/future-status.log" || {
  safe_log "$TEST_ROOT/future-status.log" >&2
  exit 1
}
future_ms=$(( $(now_ms) - future_start ))
MARKER="$($PG_BIN_DIR/psql -X -w -v ON_ERROR_STOP=1 "$LOCAL_TARGET_URL" -Atc "SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relname = 'DbP3MigrationRehearsalMarker' AND relkind = 'r')")"
[[ "$MARKER" == "t" ]] || { echo "❌ Future migration marker is missing." >&2; exit 1; }

echo "→ Simulating switch-back to the unchanged source authority"
rollback_start="$(now_ms)"
if ! P3_APPLICATION_DATABASE_URL="$LOCAL_SOURCE_URL" P3_READINESS_CONFIRM=1 APP_ENV=local \
  npx tsx scripts/postgres-application-smoke.ts >"$TEST_ROOT/source-rollback-smoke.log" 2>&1; then
  safe_log "$TEST_ROOT/source-rollback-smoke.log" >&2
  exit 1
fi
rollback_ms=$(( $(now_ms) - rollback_start ))

source_tables="$($PG_BIN_DIR/psql -X -w -v ON_ERROR_STOP=1 "$LOCAL_SOURCE_URL" -Atc "SELECT COUNT(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('_prisma_migrations', 'DbP3MigrationRehearsalMarker')")"
target_tables="$($PG_BIN_DIR/psql -X -w -v ON_ERROR_STOP=1 "$LOCAL_TARGET_URL" -Atc "SELECT COUNT(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public' AND tablename NOT IN ('_prisma_migrations', 'DbP3MigrationRehearsalMarker')")"
if [[ "$source_tables" != "42" || "$target_tables" != "42" ]]; then
  echo "❌ Restored databases do not expose the expected 42 application tables." >&2
  exit 1
fi
dump_bytes="$(wc -c <"$DUMP_FILE" | tr -d '[:space:]')"

echo "SOURCE_POSTGRES_MAJOR: $SOURCE_MAJOR"
echo "TARGET_POSTGRES_MAJOR: $PG_MAJOR"
echo "SOURCE_APPLICATION_TABLES: $source_tables"
echo "TARGET_APPLICATION_TABLES: $target_tables"
echo "DUMP_BYTES: $dump_bytes"
echo "PG_DUMP: PASS"
echo "PG_RESTORE: PASS"
echo "SOURCE_DATA_SNAPSHOT: PASS"
echo "SOURCE_TARGET_STRUCTURAL_VALIDATION: PASS"
echo "BUSINESS_INVARIANTS: PASS"
echo "POST_IMPORT_WRITE_SEQUENCE_SMOKE: PASS"
echo "FUTURE_MIGRATION: PASS"
echo "FINAL_MIGRATE_STATUS: CLEAN"
echo "ROLLBACK_SWITCH_BACK: PASS"
echo "TIMINGS_MS: schema_prep=${schema_prep_ms} export=${export_ms} import=${import_ms} row_validation=${validation_ms} business_validation=${business_validation_ms} smoke=${smoke_ms} future_migration=${future_ms} rollback=${rollback_ms}"
