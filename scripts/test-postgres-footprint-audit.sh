#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

ROOT="$PWD"
source "$ROOT/scripts/lib/postgres-tools.sh"
MIGRATIONS_PATH="${P3_CANONICAL_MIGRATIONS_PATH:-$ROOT/prisma/migrations}"
BASELINE_SQL="$MIGRATIONS_PATH/00000000000000_canonical_baseline/migration.sql"
if [[ ! -f "$BASELINE_SQL" ]]; then
  echo "FOOTPRINT_AUDIT_REHEARSAL: BLOCKED — canonical migration fixture is not available"
  if [[ "${P3_REQUIRE_CANONICAL_FIXTURE:-0}" == "1" ]]; then exit 1; fi
  exit 0
fi

PG_BIN_DIR="$(resolve_p3_pg_bin_dir)"
PG_MAJOR="$(require_p3_pg_tools "$PG_BIN_DIR" initdb pg_ctl pg_isready createdb)"
echo "POSTGRES_TOOLCHAIN: PG$PG_MAJOR ($PG_BIN_DIR)"

PORT="${P3_FOOTPRINT_PGPORT:-55436}"
if "$PG_BIN_DIR/pg_isready" -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; then
  echo "❌ Port $PORT is already in use; choose P3_FOOTPRINT_PGPORT." >&2
  exit 1
fi

TEST_ROOT="$(mktemp -d /tmp/visutry-db-p3-footprint.XXXXXX)"
PGDATA="$TEST_ROOT/pgdata"
DATABASE="p3_footprint_sim"
DATABASE_URL="postgresql://p3_local@127.0.0.1:${PORT}/${DATABASE}"
CONFIG="$ROOT/tests/fixtures/prisma-p3-test-config.ts"
trap '"$PG_BIN_DIR/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1 && "$PG_BIN_DIR/pg_ctl" -D "$PGDATA" -m fast stop >/dev/null 2>&1 || true; rm -rf "$TEST_ROOT"' EXIT INT TERM

run_prisma() {
  env -u DATABASE_URL -u DATABASE_URL_UNPOOLED -u DIRECT_URL -u DIRECT_DATABASE_URL \
    APP_ENV=local \
    P3_TEST_DATABASE_URL="$DATABASE_URL" \
    P3_TEST_SCHEMA_PATH="$ROOT/prisma/schema.prisma" \
    P3_TEST_MIGRATIONS_PATH="$MIGRATIONS_PATH" \
    npx prisma "${@}" --config "$CONFIG"
}

"$PG_BIN_DIR/initdb" -D "$PGDATA" --username=p3_local --auth=trust >/dev/null
"$PG_BIN_DIR/pg_ctl" -D "$PGDATA" -o "-p $PORT -h 127.0.0.1" -l "$TEST_ROOT/postgres.log" start >/dev/null
for _ in $(seq 1 30); do
  if "$PG_BIN_DIR/pg_isready" -h 127.0.0.1 -p "$PORT" -U p3_local -d postgres >/dev/null 2>&1; then break; fi
  sleep 1
done
"$PG_BIN_DIR/createdb" -h 127.0.0.1 -p "$PORT" -U p3_local "$DATABASE"
run_prisma migrate deploy >"$TEST_ROOT/migrate.log" 2>&1 || { sed -E 's#postgres(ql)?://[^[:space:]"'"'"')>]+#[redacted PostgreSQL URL]#g' "$TEST_ROOT/migrate.log" >&2; exit 1; }

VISUTRY_FOOTPRINT_DATABASE_URL="$DATABASE_URL" \
  VISUTRY_FOOTPRINT_EXPECTED_DATABASE_IDENTITY="127.0.0.1/${DATABASE}" \
  VISUTRY_FOOTPRINT_READ_ONLY=1 \
  APP_ENV=local \
  npx tsx scripts/postgres-footprint-audit.ts >"$TEST_ROOT/audit.log" 2>&1 || {
    sed -E 's#postgres(ql)?://[^[:space:]"'"'"')>]+#[redacted PostgreSQL URL]#g' "$TEST_ROOT/audit.log" >&2
    exit 1
  }
rg -q '"result": "PASS"' "$TEST_ROOT/audit.log"
rg -q '"readOnly": true' "$TEST_ROOT/audit.log"

echo "FOOTPRINT_AUDIT_REHEARSAL: PASS"
echo "FOOTPRINT_AUDIT_READ_ONLY: PASS"
