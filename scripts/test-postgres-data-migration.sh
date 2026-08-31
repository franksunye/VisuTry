#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

ROOT="$PWD"
APP_ENV_NORMALIZED="$(printf '%s' "${APP_ENV:-}" | tr '[:upper:]' '[:lower:]')"
VERCEL_ENV_NORMALIZED="$(printf '%s' "${VERCEL_ENV:-}" | tr '[:upper:]' '[:lower:]')"
if [[ "$APP_ENV_NORMALIZED" == "production" || "$APP_ENV_NORMALIZED" == "preview" || "$VERCEL_ENV_NORMALIZED" == "production" || "$VERCEL_ENV_NORMALIZED" == "preview" ]]; then
  echo "❌ PostgreSQL migration rehearsal refuses deployed environments." >&2
  exit 1
fi

MODE="${P3_DATA_MIGRATION_MODE:-fast}"
if [[ "$MODE" != "fast" && "$MODE" != "scale" ]]; then
  echo "❌ P3_DATA_MIGRATION_MODE must be fast or scale." >&2
  exit 1
fi

now_ms() {
  node -e 'process.stdout.write(String(Date.now()))'
}

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

for target_url in "$SOURCE_URL" "$TARGET_URL"; do
  target_name="source"
  [[ "$target_url" == "$TARGET_URL" ]] && target_name="target"
  P3_TARGET_DATABASE_URL="$target_url" P3_READINESS_CONFIRM=1 APP_ENV=local \
    npx tsx scripts/postgres-readiness-target-check.ts >"$TEST_ROOT/${target_name}-target-check.log" 2>&1 || {
      safe_log "$TEST_ROOT/${target_name}-target-check.log" >&2
      exit 1
    }
done

echo "→ Applying canonical schema to both disposable databases"
schema_prep_start="$(now_ms)"
run_prisma "$SOURCE_URL" "$MIGRATIONS_PATH" migrate deploy >"$TEST_ROOT/source-baseline.log" 2>&1 || { safe_log "$TEST_ROOT/source-baseline.log" >&2; exit 1; }
run_prisma "$TARGET_URL" "$MIGRATIONS_PATH" migrate deploy >"$TEST_ROOT/target-baseline.log" 2>&1 || { safe_log "$TEST_ROOT/target-baseline.log" >&2; exit 1; }
run_prisma "$SOURCE_URL" "$MIGRATIONS_PATH" migrate status >"$TEST_ROOT/source-baseline-status.log" 2>&1 || { safe_log "$TEST_ROOT/source-baseline-status.log" >&2; exit 1; }
run_prisma "$TARGET_URL" "$MIGRATIONS_PATH" migrate status >"$TEST_ROOT/target-baseline-status.log" 2>&1 || { safe_log "$TEST_ROOT/target-baseline-status.log" >&2; exit 1; }
rg -qi 'database schema is up to date' "$TEST_ROOT/source-baseline-status.log" || { safe_log "$TEST_ROOT/source-baseline-status.log" >&2; exit 1; }
rg -qi 'database schema is up to date' "$TEST_ROOT/target-baseline-status.log" || { safe_log "$TEST_ROOT/target-baseline-status.log" >&2; exit 1; }
schema_prep_ms=$(( $(now_ms) - schema_prep_start ))

echo "→ Seeding SOURCE_SIM with synthetic relational VisuTry data"
source_prep_start="$(now_ms)"
if [[ "$MODE" == "scale" ]]; then
  P3_FIXTURE_DATABASE_URL="$SOURCE_URL" P3_READINESS_CONFIRM=1 APP_ENV=local \
    npx tsx scripts/postgres-data-migration-scale-seed.ts >"$TEST_ROOT/seed-persistent.log" 2>&1 || {
    safe_log "$TEST_ROOT/seed-persistent.log" >&2
    exit 1
  }
else
  P3_FIXTURE_DATABASE_URL="$SOURCE_URL" P3_READINESS_CONFIRM=1 APP_ENV=local \
    npx tsx scripts/postgres-data-migration-seed.ts >"$TEST_ROOT/seed-persistent.log" 2>&1 || {
    safe_log "$TEST_ROOT/seed-persistent.log" >&2
    exit 1
  }
fi
source_prep_ms=$(( $(now_ms) - source_prep_start ))

echo "→ Exporting SOURCE_SIM with pg_dump (migration ledger excluded)"
export_start="$(now_ms)"
"$PG_BIN_DIR/pg_dump" -w --format=custom --data-only --no-owner --no-privileges \
  --exclude-table=public._prisma_migrations --file="$DUMP_FILE" "$SOURCE_URL" \
  >"$TEST_ROOT/pg-dump.log" 2>"$TEST_ROOT/pg-dump.err" || {
  safe_log "$TEST_ROOT/pg-dump.err" >&2
  exit 1
}
export_ms=$(( $(now_ms) - export_start ))

echo "→ Importing the consistent snapshot into TARGET_SIM"
import_start="$(now_ms)"
"$PG_BIN_DIR/pg_restore" --data-only --no-owner --no-privileges --exit-on-error \
  --dbname="$TARGET_URL" "$DUMP_FILE" >"$TEST_ROOT/pg-restore.log" 2>"$TEST_ROOT/pg-restore.err" || {
  safe_log "$TEST_ROOT/pg-restore.err" >&2
  exit 1
}
import_ms=$(( $(now_ms) - import_start ))
dump_bytes="$(wc -c <"$DUMP_FILE" | tr -d '[:space:]')"

echo "→ Running post-import write/default/sequence smoke on TARGET_SIM"
smoke_start="$(now_ms)"
P3_APPLICATION_DATABASE_URL="$TARGET_URL" P3_READINESS_CONFIRM=1 APP_ENV=local \
  npx tsx scripts/postgres-application-smoke.ts >"$TEST_ROOT/target-post-import-smoke.log" 2>&1 || {
  safe_log "$TEST_ROOT/target-post-import-smoke.log" >&2
  exit 1
}
smoke_ms=$(( $(now_ms) - smoke_start ))

echo "→ Validating schema, rows, constraints, typed values, timestamps, and sequences"
validation_start="$(now_ms)"
P3_SOURCE_DATABASE_URL="$SOURCE_URL" \
  P3_TARGET_DATABASE_URL="$TARGET_URL" \
  P3_READINESS_CONFIRM=1 \
  P3_VALIDATION_MODE=structural \
  APP_ENV=local \
  npx tsx scripts/postgres-data-migration-validator.ts >"$TEST_ROOT/validation.log" 2>&1 || {
    safe_log "$TEST_ROOT/validation.log" >&2
    exit 1
  }
validation_ms=$(( $(now_ms) - validation_start ))

echo "→ Validating business metrics independently"
business_validation_start="$(now_ms)"
P3_SOURCE_DATABASE_URL="$SOURCE_URL" \
  P3_TARGET_DATABASE_URL="$TARGET_URL" \
  P3_READINESS_CONFIRM=1 \
  P3_VALIDATION_MODE=business \
  APP_ENV=local \
  npx tsx scripts/postgres-data-migration-validator.ts >"$TEST_ROOT/business-validation.log" 2>&1 || {
    safe_log "$TEST_ROOT/business-validation.log" >&2
    exit 1
  }
business_validation_ms=$(( $(now_ms) - business_validation_start ))

mkdir -p "$FUTURE_MIGRATIONS/$BASELINE_NAME" "$FUTURE_MIGRATIONS/00000000000001_db_p3_future_rehearsal"
cp "$BASELINE_SQL" "$FUTURE_MIGRATIONS/$BASELINE_NAME/migration.sql"
cp "$ROOT/tests/fixtures/db-p3-future-migration.sql" "$FUTURE_MIGRATIONS/00000000000001_db_p3_future_rehearsal/migration.sql"

echo "→ Applying a normal future migration after the imported data"
run_prisma "$TARGET_URL" "$FUTURE_MIGRATIONS" migrate deploy >"$TEST_ROOT/future-deploy.log" 2>&1 || { safe_log "$TEST_ROOT/future-deploy.log" >&2; exit 1; }
run_prisma "$TARGET_URL" "$FUTURE_MIGRATIONS" migrate status >"$TEST_ROOT/future-status.log" 2>&1 || { safe_log "$TEST_ROOT/future-status.log" >&2; exit 1; }
rg -qi 'database schema is up to date' "$TEST_ROOT/future-status.log" || { safe_log "$TEST_ROOT/future-status.log" >&2; exit 1; }
MARKER="$("$PG_BIN_DIR/psql" -X -w -v ON_ERROR_STOP=1 "$TARGET_URL" -Atc "SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relname = 'DbP3MigrationRehearsalMarker' AND relkind = 'r')")"
[[ "$MARKER" == "t" ]] || { echo "❌ Future migration marker is missing." >&2; exit 1; }

echo "→ Simulating application switch-back to SOURCE_SIM"
rollback_start="$(now_ms)"
P3_APPLICATION_DATABASE_URL="$SOURCE_URL" P3_READINESS_CONFIRM=1 APP_ENV=local \
  npx tsx scripts/postgres-application-smoke.ts >"$TEST_ROOT/source-rollback-smoke.log" 2>&1 || {
  safe_log "$TEST_ROOT/source-rollback-smoke.log" >&2
  exit 1
}
rollback_ms=$(( $(now_ms) - rollback_start ))
source_db_bytes="$("$PG_BIN_DIR/psql" -X -w -v ON_ERROR_STOP=1 "$SOURCE_URL" -Atc "SELECT pg_database_size(current_database())")"
target_db_bytes="$("$PG_BIN_DIR/psql" -X -w -v ON_ERROR_STOP=1 "$TARGET_URL" -Atc "SELECT pg_database_size(current_database())")"
application_sequence_objects="$("$PG_BIN_DIR/psql" -X -w -v ON_ERROR_STOP=1 "$TARGET_URL" -Atc "SELECT COUNT(*) FROM pg_catalog.pg_sequences WHERE schemaname = 'public'")"

if [[ "$MODE" == "scale" ]]; then
  scale_users="${P3_SCALE_USERS:-5000}"
  scale_tasks="${P3_SCALE_TRY_ON_TASKS:-20000}"
  scale_requests="${P3_SCALE_GENERATION_REQUESTS:-20000}"
  scale_second_attempts="${P3_SCALE_SECOND_ATTEMPT_REQUESTS:-10000}"
  scale_faces="${P3_SCALE_FACE_SHAPE_DETECTIONS:-50000}"
  scale_face_analysis="${P3_SCALE_FACE_ANALYSIS_TASKS:-5000}"
  scale_payments="${P3_SCALE_PAYMENTS:-5000}"
  scale_store_tasks="${P3_SCALE_STORE_TASKS:-1000}"
  scale_usage="${P3_SCALE_USAGE_ROWS:-5000}"
  scale_sponsored="${P3_SCALE_SPONSORED_USAGE_ROWS:-5000}"
  (( scale_store_tasks > scale_tasks )) && scale_store_tasks="$scale_tasks"
  (( scale_requests > scale_tasks )) && scale_requests="$scale_tasks"
  (( scale_second_attempts > scale_requests )) && scale_second_attempts="$scale_requests"
  (( scale_usage > scale_tasks )) && scale_usage="$scale_tasks"
  dataset="users=${scale_users} tryOnTasks=${scale_tasks} generationRequests=${scale_requests} generationAttempts=$((scale_requests + scale_second_attempts)) faceShapeDetections=${scale_faces} faceAnalysisTasks=${scale_face_analysis} payments=${scale_payments} merchantUsageRows=${scale_usage} sponsoredUsageRows=${scale_sponsored}"
else
  dataset="users=1 tryOnTasks=2 generationRequests=1 generationAttempts=1 faceShapeDetections=0 faceAnalysisTasks=1 payments=1 merchantUsageRows=2 sponsoredUsageRows=1"
fi

echo "DATA_MIGRATION_MODE: $MODE"
echo "LOCAL_SYNTHETIC_ONLY: YES"
echo "DATASET: $dataset"
echo "DUMP_BYTES: $dump_bytes"
echo "SOURCE_DATABASE_BYTES: $source_db_bytes"
echo "TARGET_DATABASE_BYTES: $target_db_bytes"
echo "APPLICATION_SEQUENCE_OBJECTS: $application_sequence_objects"
echo "DATA_MIGRATION_REHEARSAL: PASS"
echo "SOURCE_TARGET_ROW_VALIDATION: PASS"
echo "BUSINESS_INVARIANTS: PASS"
echo "POST_IMPORT_WRITE_SEQUENCE_SMOKE: PASS"
echo "FUTURE_MIGRATION: PASS"
echo "ROLLBACK_REHEARSAL: PASS"
echo "TIMINGS_MS: source_prep=${source_prep_ms} export=${export_ms} schema_prep=${schema_prep_ms} import=${import_ms} row_validation=${validation_ms} business_validation=${business_validation_ms} smoke=${smoke_ms} rollback=${rollback_ms}"
