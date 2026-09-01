#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

ROOT="$PWD"
source "$ROOT/scripts/lib/postgres-tools.sh"
URL="${P3_SECONDARY_POSTGRES_URL:-}"
if [[ -z "$URL" ]]; then
  echo "SECOND_PROVIDER_LIVE_TEST: BLOCKED — non-production Supabase credentials are not available"
  if [[ "${P3_REQUIRE_SECONDARY_PROVIDER:-0}" == "1" ]]; then
    exit 1
  fi
  exit 0
fi

APP_ENV_NORMALIZED="$(printf '%s' "${APP_ENV:-}" | tr '[:upper:]' '[:lower:]')"
VERCEL_ENV_NORMALIZED="$(printf '%s' "${VERCEL_ENV:-}" | tr '[:upper:]' '[:lower:]')"
if [[ "$APP_ENV_NORMALIZED" == "production" || "$APP_ENV_NORMALIZED" == "preview" || "$VERCEL_ENV_NORMALIZED" == "production" || "$VERCEL_ENV_NORMALIZED" == "preview" ]]; then
  echo "❌ Secondary provider smoke refuses deployed environments." >&2
  exit 1
fi
if [[ "${P3_SECONDARY_POSTGRES_ALLOW:-}" != "1" ]]; then
  echo "❌ Set P3_SECONDARY_POSTGRES_ALLOW=1 to run the explicitly approved non-production provider smoke." >&2
  exit 1
fi

# `uselibpqcompat` is a node-postgres/PrismaPg connection option. libpq
# tools such as psql reject unknown URI parameters, so keep it for Prisma and
# strip it only from the direct libpq inspection connection.
PSQL_URL="${URL//&uselibpqcompat=true/}"
PSQL_URL="${PSQL_URL//\?uselibpqcompat=true/}"

MIGRATIONS_PATH="${P3_CANONICAL_MIGRATIONS_PATH:-$ROOT/prisma/migrations}"
BASELINE_NAME="00000000000000_canonical_baseline"
BASELINE_SQL="$MIGRATIONS_PATH/$BASELINE_NAME/migration.sql"
if [[ ! -f "$BASELINE_SQL" ]]; then
  echo "SECOND_PROVIDER_LIVE_TEST: BLOCKED — canonical migration fixture is not available"
  if [[ "${P3_REQUIRE_SECONDARY_PROVIDER:-0}" == "1" ]]; then
    exit 1
  fi
  exit 0
fi

PG_BIN_DIR="$(resolve_p3_pg_bin_dir)"
PG_MAJOR="$(require_p3_pg_tools "$PG_BIN_DIR" psql)"
echo "POSTGRES_TOOLCHAIN: PG$PG_MAJOR ($PG_BIN_DIR)"

TEST_ROOT="$(mktemp -d /tmp/visutry-db-p3-provider.XXXXXX)"
FUTURE_MIGRATIONS="$TEST_ROOT/future-migrations"
CONFIG="$ROOT/tests/fixtures/prisma-p3-test-config.ts"
trap 'rm -rf "$TEST_ROOT"' EXIT INT TERM

safe_log() {
  sed -E 's#postgres(ql)?://[^[:space:]"'"'"')>]+#[redacted PostgreSQL URL]#g' "$1"
}

run_prisma() {
  env -u DATABASE_URL -u DATABASE_URL_UNPOOLED -u DIRECT_URL -u DIRECT_DATABASE_URL \
    APP_ENV=local \
    P3_TEST_DATABASE_URL="$URL" \
    P3_TEST_SCHEMA_PATH="$ROOT/prisma/schema.prisma" \
    P3_TEST_MIGRATIONS_PATH="$1" \
    npx prisma "${@:2}" --config "$CONFIG"
}

if ! "$PG_BIN_DIR/psql" -X -w -v ON_ERROR_STOP=1 "$PSQL_URL" -Atc "SELECT COUNT(*) FROM pg_catalog.pg_tables WHERE schemaname = 'public'" >"$TEST_ROOT/table-count" 2>"$TEST_ROOT/table-count.err"; then
  echo "❌ Could not inspect the secondary PostgreSQL target." >&2
  safe_log "$TEST_ROOT/table-count.err" >&2
  exit 1
fi
if [[ "$(<"$TEST_ROOT/table-count")" != "0" ]]; then
  echo "❌ Secondary provider target is not empty; refusing a migration smoke that could alter existing data." >&2
  exit 1
fi

if ! P3_TARGET_DATABASE_URL="$URL" P3_READINESS_CONFIRM=1 APP_ENV=local \
  npx tsx scripts/postgres-readiness-target-check.ts >"$TEST_ROOT/target-safety.log" 2>&1; then
  safe_log "$TEST_ROOT/target-safety.log" >&2
  exit 1
fi

echo "→ Applying canonical baseline to the empty secondary PostgreSQL target"
if ! run_prisma "$MIGRATIONS_PATH" migrate deploy >"$TEST_ROOT/baseline-deploy.log" 2>&1; then
  safe_log "$TEST_ROOT/baseline-deploy.log" >&2
  exit 1
fi

if ! run_prisma "$MIGRATIONS_PATH" migrate status >"$TEST_ROOT/baseline-status.log" 2>&1; then
  safe_log "$TEST_ROOT/baseline-status.log" >&2
  exit 1
fi
if ! rg -qi 'database schema is up to date' "$TEST_ROOT/baseline-status.log"; then
  echo "❌ Secondary provider baseline status was not clean." >&2
  safe_log "$TEST_ROOT/baseline-status.log" >&2
  exit 1
fi

P3_SECONDARY_POSTGRES_URL="$URL" \
  P3_SECONDARY_POSTGRES_ALLOW=1 \
  APP_ENV=local \
  npx tsx scripts/postgres-provider-smoke.ts >"$TEST_ROOT/application-smoke.log" 2>&1 || {
    safe_log "$TEST_ROOT/application-smoke.log" >&2
    exit 1
  }

mkdir -p "$FUTURE_MIGRATIONS/$BASELINE_NAME" "$FUTURE_MIGRATIONS/00000000000001_db_p3_future_rehearsal"
cp "$BASELINE_SQL" "$FUTURE_MIGRATIONS/$BASELINE_NAME/migration.sql"
cp "$ROOT/tests/fixtures/db-p3-future-migration.sql" "$FUTURE_MIGRATIONS/00000000000001_db_p3_future_rehearsal/migration.sql"
if ! run_prisma "$FUTURE_MIGRATIONS" migrate deploy >"$TEST_ROOT/future-deploy.log" 2>&1; then
  safe_log "$TEST_ROOT/future-deploy.log" >&2
  exit 1
fi
if ! run_prisma "$FUTURE_MIGRATIONS" migrate status >"$TEST_ROOT/future-status.log" 2>&1; then
  safe_log "$TEST_ROOT/future-status.log" >&2
  exit 1
fi
if ! rg -qi 'database schema is up to date' "$TEST_ROOT/future-status.log"; then
  echo "❌ Secondary provider future migration status was not clean." >&2
  safe_log "$TEST_ROOT/future-status.log" >&2
  exit 1
fi

MARKER="$("$PG_BIN_DIR/psql" -X -w -v ON_ERROR_STOP=1 "$PSQL_URL" -Atc "SELECT EXISTS (SELECT 1 FROM pg_catalog.pg_class WHERE relname = 'DbP3MigrationRehearsalMarker' AND relkind = 'r')")"
[[ "$MARKER" == "t" ]] || { echo "❌ Future migration marker is missing." >&2; exit 1; }

echo "SECOND_PROVIDER_MIGRATE: PASS"
echo "SECOND_PROVIDER_STATUS: CLEAN"
echo "SECOND_PROVIDER_RAW_INVARIANTS: PASS"
echo "SECOND_PROVIDER_APP_SMOKE: PASS"
echo "SECOND_PROVIDER_FUTURE_MIGRATION: PASS"
