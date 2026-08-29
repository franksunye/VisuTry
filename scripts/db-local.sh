#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

ACTION="${1:-status}"
PGDATA="${VISUTRY_LOCAL_PGDATA:-$PWD/.local/postgres}"
PGPORT="${VISUTRY_LOCAL_PGPORT:-5433}"
PGUSER="${VISUTRY_LOCAL_PGUSER:-visutry_local}"
PGDATABASE="${VISUTRY_LOCAL_PGDATABASE:-visutry_local}"
LOCAL_URL="postgresql://${PGUSER}@127.0.0.1:${PGPORT}/${PGDATABASE}"
export APP_ENV=local
export VISUTRY_DATABASE_IDENTITY="local:127.0.0.1:${PGPORT}/${PGDATABASE}"

refuse_remote() {
  case "${DATABASE_URL:-}" in
    *ep-wandering-union-ad43rx1s*|*ep-old-frog-adgzp23w*)
      echo "❌ Refusing a known remote Neon URL in Local Postgres command." >&2
      exit 1
      ;;
  esac
}

refuse_unsafe_pgdata() {
  case "$PGDATA" in
    "$PWD/.local/postgres"|"$PWD/.local/postgres/"*) ;;
    *) echo "❌ VISUTRY_LOCAL_PGDATA must remain under $PWD/.local/postgres." >&2; exit 1 ;;
  esac
}

wait_ready() {
  for _ in $(seq 1 30); do
    if pg_isready -h 127.0.0.1 -p "$PGPORT" -U "$PGUSER" -d postgres >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  echo "❌ Local Postgres did not become ready." >&2
  exit 1
}

case "$ACTION" in
  up)
    refuse_unsafe_pgdata
    mkdir -p "$(dirname "$PGDATA")"
    if [[ ! -f "$PGDATA/PG_VERSION" ]]; then
      initdb -D "$PGDATA" --username="$PGUSER" --auth=trust >/dev/null
    fi
    if pg_ctl -D "$PGDATA" status >/dev/null 2>&1; then
      echo "✓ Local Postgres already running on ${PGPORT}"
    else
      pg_ctl -D "$PGDATA" -o "-p ${PGPORT}" -l "$PGDATA/server.log" start >/dev/null
      wait_ready
      if ! psql "postgresql://${PGUSER}@127.0.0.1:${PGPORT}/postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='${PGDATABASE}'" | grep -q 1; then
        createdb -h 127.0.0.1 -p "$PGPORT" -U "$PGUSER" "$PGDATABASE"
      fi
      echo "✓ Local Postgres ready: ${LOCAL_URL}"
    fi
    ;;
  down)
    refuse_unsafe_pgdata
    pg_ctl -D "$PGDATA" status >/dev/null 2>&1 && pg_ctl -D "$PGDATA" stop -m fast || true
    echo "✓ Local Postgres stopped"
    ;;
  migrate)
    refuse_remote
    "$0" up >/dev/null
    if [[ "$(psql "$LOCAL_URL" -Atc "SELECT to_regclass('_prisma_migrations') IS NULL")" == "t" ]]; then
      echo "→ Bootstrapping the historical baseline migrations in dependency order"
      psql "$LOCAL_URL" -f prisma/migrations/20250918030414_init/migration.sql >/dev/null
      psql "$LOCAL_URL" -f prisma/migrations/20250116_add_premium_usage_count/migration.sql >/dev/null
      psql "$LOCAL_URL" -f prisma/migrations/20250118_add_promo_product_types/migration.sql >/dev/null
      DATABASE_URL="$LOCAL_URL" DATABASE_URL_UNPOOLED="$LOCAL_URL" npx prisma migrate resolve --applied 20250918030414_init
      DATABASE_URL="$LOCAL_URL" DATABASE_URL_UNPOOLED="$LOCAL_URL" npx prisma migrate resolve --applied 20250116_add_premium_usage_count
      DATABASE_URL="$LOCAL_URL" DATABASE_URL_UNPOOLED="$LOCAL_URL" npx prisma migrate resolve --applied 20250118_add_promo_product_types
    fi
    DATABASE_URL="$LOCAL_URL" DATABASE_URL_UNPOOLED="$LOCAL_URL" npx prisma migrate deploy
    # The historical repository contains fields that were resolved into the
    # production baseline without a replayable migration. Keep Local usable
    # from an empty cluster by reconciling the schema after the migration run;
    # this path is never used by Vercel/Production.
    DATABASE_URL="$LOCAL_URL" DATABASE_URL_UNPOOLED="$LOCAL_URL" npx prisma db push --accept-data-loss >/dev/null
    APP_ENV=local VISUTRY_DATABASE_IDENTITY="$VISUTRY_DATABASE_IDENTITY" DATABASE_URL="$LOCAL_URL" DATABASE_URL_UNPOOLED="$LOCAL_URL" npx tsx scripts/db-environment.ts register
    ;;
  seed)
    refuse_remote
    "$0" up >/dev/null
    APP_ENV=local VISUTRY_DATABASE_IDENTITY="$VISUTRY_DATABASE_IDENTITY" DATABASE_URL="$LOCAL_URL" DATABASE_URL_UNPOOLED="$LOCAL_URL" npx tsx scripts/seed-local-qa.ts
    ;;
  reset)
    refuse_remote
    refuse_unsafe_pgdata
    "$0" down >/dev/null
    if [[ -d "$PGDATA" ]]; then rm -rf "$PGDATA"; fi
    "$0" up >/dev/null
    "$0" migrate
    "$0" seed
    ;;
  status)
    if ! pg_ctl -D "$PGDATA" status >/dev/null 2>&1; then
      echo "LOCAL POSTGRES: STOPPED"
      exit 0
    fi
    DATABASE_URL="$LOCAL_URL" DATABASE_URL_UNPOOLED="$LOCAL_URL" psql "$LOCAL_URL" -Atc "SELECT 'LOCAL|' || current_database() || '|' || current_user";
    ;;
  *)
    echo "Usage: $0 up|down|migrate|seed|reset|status" >&2
    exit 1
    ;;
esac
