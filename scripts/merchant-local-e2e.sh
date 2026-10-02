#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

JOURNEY="${1:-}"
case "$JOURNEY" in
  campaign|golden-path) ;;
  *) echo "Usage: $0 campaign|golden-path" >&2; exit 2 ;;
esac

if [[ -n "${VERCEL_ENV:-}" || -n "${VERCEL:-}" ]]; then
  echo "❌ Local Merchant E2E refuses to run inside a Vercel environment." >&2
  exit 1
fi

for variable in DATABASE_URL DATABASE_URL_UNPOOLED; do
  value="${!variable:-}"
  [[ -z "$value" ]] && continue
  if ! node -e 'const u = new URL(process.argv[1]); if (!["127.0.0.1", "localhost", "::1"].includes(u.hostname.toLowerCase().replace(/^\[|\]$/g, ""))) process.exit(1)' "$value" >/dev/null 2>&1; then
    echo "❌ $variable is non-loopback; refusing Local Merchant E2E." >&2
    exit 1
  fi
done

readonly PGHOST="127.0.0.1"
readonly PGPORT="5433"
readonly PGUSER="visutry_local"
readonly PGDATA="$PWD/.local/postgres"
readonly PRIMARY_DB="visutry_local"
readonly TEST_DB="visutry_local_merchant_e2e"
readonly PRIMARY_URL="postgresql://${PGUSER}@${PGHOST}:${PGPORT}/${PRIMARY_DB}"
readonly TEST_URL="postgresql://${PGUSER}@${PGHOST}:${PGPORT}/${TEST_DB}"
readonly MAINTENANCE_URL="postgresql://${PGUSER}@${PGHOST}:${PGPORT}/postgres"
readonly TEST_IDENTITY="local:${PGHOST}:${PGPORT}/${TEST_DB}"
readonly APP_PORT="3003"
readonly BASE_URL="http://${PGHOST}:${APP_PORT}"
readonly LOG_DIR="$PWD/.local/merchant-e2e"
readonly LOCK_DIR="$LOG_DIR/runner.lock"

mkdir -p "$LOG_DIR"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "❌ Another Local Merchant E2E appears to be running ($LOCK_DIR exists)." >&2
  echo "   Confirm no runner is active before removing that stale lock directory." >&2
  exit 1
fi

SERVER_PID=""
cleanup() {
  if [[ -n "$SERVER_PID" ]] && kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    kill "$SERVER_PID" >/dev/null 2>&1 || true
    wait "$SERVER_PID" >/dev/null 2>&1 || true
  fi
  rmdir "$LOCK_DIR" >/dev/null 2>&1 || true
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

# Start or verify only the repository's loopback Local PostgreSQL endpoint.
APP_ENV=local \
VISUTRY_LOCAL_PGPORT="$PGPORT" \
VISUTRY_LOCAL_PGUSER="$PGUSER" \
VISUTRY_LOCAL_PGDATA="$PGDATA" \
VISUTRY_LOCAL_PGDATABASE="$PRIMARY_DB" \
DATABASE_URL="$PRIMARY_URL" \
DATABASE_URL_UNPOOLED="$PRIMARY_URL" \
  npm run db:local:up

endpoint="$(psql "$MAINTENANCE_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT host(inet_server_addr()) || '|' || inet_server_port()::text")"
if [[ "$endpoint" != "127.0.0.1|${PGPORT}" ]]; then
  echo "❌ Refusing unexpected PostgreSQL endpoint: $endpoint" >&2
  exit 1
fi

primary_marker="$(psql "$PRIMARY_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT environment || '|' || \"databaseIdentity\" FROM \"EnvironmentMetadata\" WHERE id='primary'")"
if [[ "$primary_marker" != "LOCAL|local:${PGHOST}:${PGPORT}/${PRIMARY_DB}" ]]; then
  echo "❌ Refusing Local PostgreSQL without the expected primary Local marker." >&2
  exit 1
fi

if node -e 'const net = require("node:net"); const socket = net.connect({ host: process.argv[1], port: Number(process.argv[2]) }); socket.setTimeout(750); socket.once("connect", () => { socket.destroy(); process.exit(1) }); socket.once("error", (error) => process.exit(error.code === "ECONNREFUSED" ? 0 : 1)); socket.once("timeout", () => { socket.destroy(); process.exit(1) })' "$PGHOST" "$APP_PORT"; then
  :
else
  echo "❌ Refusing to start: ${BASE_URL} already has a listener." >&2
  exit 1
fi

database_exists="$(psql "$MAINTENANCE_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT 1 FROM pg_database WHERE datname='${TEST_DB}'")"
if [[ "$database_exists" == "1" ]]; then
  if ! test_marker="$(psql "$TEST_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT environment || '|' || \"databaseIdentity\" FROM \"EnvironmentMetadata\" WHERE id='primary'" 2>/dev/null)"; then
    echo "❌ The reserved E2E database exists without a readable ownership marker; refusing to reset it." >&2
    exit 1
  fi
  if [[ "$test_marker" != "LOCAL|${TEST_IDENTITY}" ]]; then
    echo "❌ The reserved E2E database has an unexpected marker ($test_marker); refusing to reset it." >&2
    exit 1
  fi
  echo "→ Resetting only the marked Local E2E database: ${TEST_DB}"
  psql "$MAINTENANCE_URL" -X -v ON_ERROR_STOP=1 -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='${TEST_DB}' AND pid <> pg_backend_pid()" >/dev/null
  dropdb --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" "$TEST_DB"
fi

createdb --host="$PGHOST" --port="$PGPORT" --username="$PGUSER" --template=template0 "$TEST_DB"

export APP_ENV=local
export NODE_ENV=test
export ENABLE_MOCKS=true
export TEST_MODE=true
export STRIPE_MERCHANT_BILLING_MODE=test
export NEXTAUTH_URL="$BASE_URL"
export NEXTAUTH_SECRET=local-only-development-secret
export NEXT_PUBLIC_SITE_URL="$BASE_URL"
export VISUTRY_LOCAL_PGPORT="$PGPORT"
export VISUTRY_LOCAL_PGUSER="$PGUSER"
export VISUTRY_LOCAL_PGDATABASE="$TEST_DB"
export VISUTRY_DATABASE_IDENTITY="$TEST_IDENTITY"
export DATABASE_URL="$TEST_URL"
export DATABASE_URL_UNPOOLED="$TEST_URL"
export PLAYWRIGHT_BASE_URL="$BASE_URL"

echo "→ Applying schema and registering the isolated test database"
npm run db:local:migrate
echo "→ Seeding deterministic Local QA identities and TEST Merchants"
npm run db:local:seed
echo "→ Checking Local Merchant safety preflight"
npm run merchant:local:preflight

mkdir -p "$LOG_DIR"
server_log="$LOG_DIR/${JOURNEY}-server.log"
echo "→ Starting isolated Local Next.js server at ${BASE_URL}"
./node_modules/.bin/next dev --hostname "$PGHOST" --port "$APP_PORT" >"$server_log" 2>&1 &
SERVER_PID=$!

server_ready=false
for _ in $(seq 1 180); do
  if curl --fail --silent "$BASE_URL/en/business" >/dev/null 2>&1; then
    server_ready=true
    break
  fi
  if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    echo "❌ Local Next.js server exited before becoming ready. Log: $server_log" >&2
    tail -80 "$server_log" >&2 || true
    exit 1
  fi
  sleep 1
done
if [[ "$server_ready" != "true" ]]; then
  echo "❌ Local Next.js server did not become ready within 180 seconds. Log: $server_log" >&2
  tail -80 "$server_log" >&2 || true
  exit 1
fi

case "$JOURNEY" in
  campaign)
    P1_M2_5_LOCAL_CAMPAIGN_E2E=1 npm exec -- playwright test tests/e2e/p1-m2-5-local-campaign-workspace.spec.ts --project=chromium
    ;;
  golden-path)
    P0_L1_LOCAL_MERCHANT_E2E=1 npm exec -- playwright test tests/e2e/p0-l1-local-merchant-growth-lab.spec.ts --project=chromium
    npm exec -- tsx scripts/merchant-local-activation-report.ts
    ;;
esac

echo "✓ ${JOURNEY} Local Merchant E2E passed against ${TEST_IDENTITY}"
