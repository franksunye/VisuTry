#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/migration-baseline-contract.sh
assert_canonical_baseline_contract "$PWD"

ACTION="${1:-status}"
PGDATA="${VISUTRY_LOCAL_PGDATA:-$PWD/.local/postgres}"
PGPORT="${VISUTRY_LOCAL_PGPORT:-5433}"
PGUSER="${VISUTRY_LOCAL_PGUSER:-visutry_local}"
PGDATABASE="${VISUTRY_LOCAL_PGDATABASE:-visutry_local}"
LOCAL_URL="postgresql://${PGUSER}@127.0.0.1:${PGPORT}/${PGDATABASE}"
export APP_ENV=local
export VISUTRY_DATABASE_IDENTITY="local:127.0.0.1:${PGPORT}/${PGDATABASE}"

refuse_remote() {
  for candidate in "${DATABASE_URL:-}" "${DATABASE_URL_UNPOOLED:-}"; do
    [[ -z "$candidate" ]] && continue
    if ! node -e 'const u = new URL(process.argv[1]); const h = u.hostname.toLowerCase().replace(/^\[|\]$/g, ""); if (!["127.0.0.1", "localhost", "::1"].includes(h)) process.exit(1)' "$candidate" >/dev/null 2>&1; then
      echo "❌ Refusing a non-loopback PostgreSQL URL in Local Postgres command." >&2
      exit 1
    fi
  done
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
    refuse_remote
    refuse_unsafe_pgdata
    mkdir -p "$(dirname "$PGDATA")"
    if pg_ctl -D "$PGDATA" status >/dev/null 2>&1; then
      echo "✓ Local Postgres already running on ${PGPORT}"
    elif pg_isready -h 127.0.0.1 -p "$PGPORT" -U "$PGUSER" -d postgres >/dev/null 2>&1; then
      endpoint="$(psql "$LOCAL_URL" -X -Atc "SELECT host(inet_server_addr()) || '|' || inet_server_port()::text || '|' || current_database()")"
      expected_endpoint="127.0.0.1|${PGPORT}|${PGDATABASE}"
      if [[ "$endpoint" != "$expected_endpoint" ]]; then
        echo "❌ Refusing to reuse unexpected Local PostgreSQL endpoint/database." >&2
        exit 1
      fi
      echo "✓ Reusing verified loopback Local Postgres: ${LOCAL_URL}"
    else
      if [[ ! -f "$PGDATA/PG_VERSION" ]]; then
        initdb -D "$PGDATA" --username="$PGUSER" --auth=trust >/dev/null
      fi
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
    MIGRATIONS_TABLE_EXISTS="$(psql "$LOCAL_URL" -X -Atc "SELECT to_regclass('public._prisma_migrations') IS NOT NULL")"
    if [[ "$MIGRATIONS_TABLE_EXISTS" == "t" ]]; then
      ANCHOR_OUTPUT=""
      ANCHOR_EXIT=0
      set +e
      ANCHOR_OUTPUT=$(DATABASE_URL="$LOCAL_URL" DATABASE_URL_UNPOOLED="$LOCAL_URL" npx tsx scripts/check-migration-baseline-anchor.ts "$CANONICAL_BASELINE_MIGRATION" 2>&1)
      ANCHOR_EXIT=$?
      set -e
      if [[ "$ANCHOR_EXIT" -ne 0 ]] || ! echo "$ANCHOR_OUTPUT" | grep -Fxq "MIGRATION_BASELINE_ANCHOR=applied"; then
        echo "$ANCHOR_OUTPUT" >&2
        echo "❌ Existing Local migration history has no valid canonical baseline anchor; refusing to replay it." >&2
        echo "   Use a separately created disposable database for fresh-baseline verification. Existing Local data was not changed." >&2
        exit 1
      fi
    else
      PUBLIC_RELATION_COUNT="$(psql "$LOCAL_URL" -X -Atc "SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v', 'm', 'S')")"
      if [[ "$PUBLIC_RELATION_COUNT" != "0" ]]; then
        echo "❌ Local database has public relations but no Prisma migration ledger; refusing to apply the baseline over an unknown schema." >&2
        exit 1
      fi
      echo "→ Empty Local database detected; applying the canonical baseline"
    fi
    DATABASE_URL="$LOCAL_URL" DATABASE_URL_UNPOOLED="$LOCAL_URL" npx prisma migrate deploy
    DATABASE_URL="$LOCAL_URL" DATABASE_URL_UNPOOLED="$LOCAL_URL" npx tsx scripts/check-migration-baseline-anchor.ts "$CANONICAL_BASELINE_MIGRATION"
    APP_ENV=local VISUTRY_DATABASE_IDENTITY="$VISUTRY_DATABASE_IDENTITY" DATABASE_URL="$LOCAL_URL" DATABASE_URL_UNPOOLED="$LOCAL_URL" npx tsx scripts/db-environment.ts register
    ;;
  seed)
    refuse_remote
    "$0" migrate >/dev/null
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
