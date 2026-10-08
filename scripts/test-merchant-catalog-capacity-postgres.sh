#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ "${APP_ENV:-}" == "production" || "${VERCEL_ENV:-}" == "production" ]]; then
  echo "Merchant Catalog capacity concurrency test refuses Production" >&2
  exit 1
fi

PG_BIN="${PG_BIN:-/opt/homebrew/opt/postgresql@16/bin}"
PORT="${VISUTRY_CATALOG_CAPACITY_PG_PORT:-55434}"
DATABASE_NAME="visutry_catalog_capacity_test"

if [[ ! -x "$PG_BIN/initdb" ]]; then
  echo "PostgreSQL 16 is not installed at $PG_BIN" >&2
  exit 1
fi

if "$PG_BIN/pg_isready" -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; then
  echo "Port $PORT is already in use; choose VISUTRY_CATALOG_CAPACITY_PG_PORT" >&2
  exit 1
fi

PG_ROOT="$(mktemp -d /tmp/visutry-merchant-catalog-capacity-pg.XXXXXX)"
PG_DATA="$PG_ROOT/data"
PG_LOG="$PG_ROOT/postgres.log"
DATABASE_URL="postgresql://${USER}@127.0.0.1:${PORT}/${DATABASE_NAME}"

cleanup() {
  "$PG_BIN/pg_ctl" -D "$PG_DATA" -m fast stop >/dev/null 2>&1 || true
  case "$PG_ROOT" in
    /tmp/visutry-merchant-catalog-capacity-pg.*)
      if [[ -f "$PG_DATA/PG_VERSION" ]]; then rm -rf -- "$PG_ROOT"; fi
      ;;
    *) echo "Refusing to remove unexpected temporary path: $PG_ROOT" >&2; return 1 ;;
  esac
}
trap cleanup EXIT INT TERM

echo "→ init isolated PostgreSQL cluster on 127.0.0.1:$PORT"
"$PG_BIN/initdb" --no-locale --encoding=UTF8 -A trust "$PG_DATA" >/dev/null
"$PG_BIN/pg_ctl" -D "$PG_DATA" -l "$PG_LOG" -o "-p $PORT -h 127.0.0.1" start >/dev/null
"$PG_BIN/createdb" -h 127.0.0.1 -p "$PORT" "$DATABASE_NAME"

export DATABASE_URL
export DATABASE_URL_UNPOOLED="$DATABASE_URL"
export DIRECT_URL="$DATABASE_URL"
export NODE_ENV=test
export APP_ENV=local
export ENABLE_MOCKS=true
export TEST_MODE=true
export VISUTRY_CATALOG_CAPACITY_PG_TEST=1

echo "→ generate Prisma Client and apply canonical migrations"
npx prisma generate
npx prisma migrate deploy

echo "→ execute real PostgreSQL dual-concurrency contracts for Prisma and Cloudflare SQL batch paths"
npx jest tests/integration/modules/merchant-catalog-capacity-postgres.test.ts --runInBand --testTimeout=30000

echo "✓ Merchant Catalog capacity concurrency contract passed; isolated PostgreSQL cluster will be removed"
