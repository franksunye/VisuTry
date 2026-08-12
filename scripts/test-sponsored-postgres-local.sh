#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@16/bin}"
PORT="${VISUTRY_SPONSORED_PG_PORT:-55432}"

if [[ ! -x "$PG_BIN/initdb" ]]; then
  echo "PostgreSQL 16 is not installed at $PG_BIN" >&2
  exit 1
fi

if "$PG_BIN/pg_isready" -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; then
  echo "Port $PORT is already in use; choose VISUTRY_SPONSORED_PG_PORT" >&2
  exit 1
fi

PG_ROOT="$(mktemp -d /tmp/visutry-sponsored-pg.XXXXXX)"
PG_DATA="$PG_ROOT/data"
PG_LOG="$PG_ROOT/postgres.log"
DATABASE_NAME="visutry_sponsored_local"
DATABASE_URL="postgresql://${USER}@127.0.0.1:${PORT}/${DATABASE_NAME}"

cleanup() {
  "$PG_BIN/pg_ctl" -D "$PG_DATA" -m fast stop >/dev/null 2>&1 || true
  rm -rf "$PG_ROOT"
}
trap cleanup EXIT INT TERM

echo "→ init temporary PostgreSQL cluster: $PG_ROOT"
"$PG_BIN/initdb" --no-locale --encoding=UTF8 -A trust "$PG_DATA" >/dev/null
"$PG_BIN/pg_ctl" -D "$PG_DATA" -l "$PG_LOG" -o "-p $PORT -h 127.0.0.1" start >/dev/null
"$PG_BIN/createdb" -h 127.0.0.1 -p "$PORT" "$DATABASE_NAME"

export DATABASE_URL
export DATABASE_URL_UNPOOLED="$DATABASE_URL"
export DIRECT_URL="$DATABASE_URL"
export PRISMA_LOCAL_PG=true
export MERCHANT_SPONSORED_USAGE_ENABLED=true
export NODE_ENV=test

echo "→ generate Prisma Client"
npx prisma generate

# The repository's historical migrations predate the current init migration and
# are not replayable from an empty database. Production still uses migrate deploy;
# this disposable local harness bootstraps the exact current schema instead.
echo "→ bootstrap current Prisma schema in empty PostgreSQL database"
npx prisma db push

echo "→ run PostgreSQL sponsored usage smoke"
npx tsx scripts/sponsored-postgres-smoke.ts

echo "→ run local entitlement contracts"
npx jest \
  tests/unit/modules/store/merchant-sponsored-consumer-fallback.test.ts \
  tests/unit/modules/store/merchant-sponsored-usage.test.ts \
  tests/unit/lib/quota-settlement.test.ts \
  --runInBand --testTimeout=30000

echo "✓ local sponsored PostgreSQL verification complete; temporary database removed on exit"
