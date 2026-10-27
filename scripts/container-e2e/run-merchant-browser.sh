#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

[[ "$(uname -s)" == Linux ]] || { echo 'Use the workstation native-PostgreSQL runner outside Linux.' >&2; exit 1; }
[[ -z "${VERCEL:-}" && -z "${VERCEL_ENV:-}" ]] || { echo 'Refusing to run against Vercel.' >&2; exit 1; }
[[ -d node_modules && -x node_modules/.bin/next ]] || { echo 'Run npm ci first.' >&2; exit 1; }
[[ ! -e .env && ! -e .env.local ]] || {
  echo 'Use a disposable checkout without .env or .env.local; Next.js would reload those secrets.' >&2
  exit 1
}

# Never reuse a configured remote production/staging datasource, even if the
# test would otherwise override it. Runtime credentials remain fail-closed.
node -e '
  for (const name of ["DATABASE_URL", "DATABASE_URL_UNPOOLED", "DIRECT_URL"]) {
    if (!process.env[name]) continue;
    const url = new URL(process.env[name]);
    if (!["postgres:", "postgresql:"].includes(url.protocol) ||
        !["127.0.0.1", "localhost", "[::1]"].includes(url.hostname)) {
      throw new Error("Refusing configured non-local datasource: " + name);
    }
  }
'

# Fail before bootstrapping if anything already listens on the local test ports.
node -e '
  const net = require("node:net");
  async function assertFree(port) {
    await new Promise((resolve, reject) => {
      const client = net.connect({ host: "127.0.0.1", port });
      client.once("connect", () => { client.destroy(); reject(new Error("Local test port occupied: " + port)); });
      client.once("error", (error) => {
        if (error.code === "ECONNREFUSED") resolve();
        else reject(error);
      });
    });
  }
  (async () => { await assertFree(5439); await assertFree(3003); })()
    .catch((error) => { console.error(error.message); process.exitCode = 1 });
'

cache_dir="${VISUTRY_CONTAINER_E2E_CACHE_DIR:-$ROOT/.local/container-e2e}"
mkdir -p "$cache_dir/runs"
run_dir="$(mktemp -d "$cache_dir/runs/run.XXXXXXXX")"
export VISUTRY_CONTAINER_PGLITE_DEPS_DIR="${VISUTRY_CONTAINER_PGLITE_DEPS_DIR:-$cache_dir/deps}"
export VISUTRY_CONTAINER_PGDATA="$run_dir/pgdata"
export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$cache_dir/browsers}"

db_pid=''
app_pid=''
cleanup() {
  if [[ -n "$app_pid" ]]; then
    kill "$app_pid" 2>/dev/null || true
    wait "$app_pid" 2>/dev/null || true
  fi
  if [[ -n "$db_pid" ]]; then
    kill "$db_pid" 2>/dev/null || true
    wait "$db_pid" 2>/dev/null || true
  fi
  echo "Local-only diagnostic logs: $run_dir"
}
trap cleanup EXIT

if ! node -e '
  const root = process.env.VISUTRY_CONTAINER_PGLITE_DEPS_DIR;
  const fs = require("fs");
  const path = require("path");
  const pairs = [["@electric-sql/pglite", "0.5.11"], ["@electric-sql/pglite-socket", "0.2.14"]];
  for (const [name, version] of pairs) {
    const pkg = JSON.parse(fs.readFileSync(path.join(root, "node_modules", name, "package.json")));
    if (pkg.version !== version) process.exit(1);
  }
' 2>/dev/null; then
  npm install --prefix "$VISUTRY_CONTAINER_PGLITE_DEPS_DIR" \
    --no-save --no-package-lock --ignore-scripts --no-audit --no-fund \
    @electric-sql/pglite@0.5.11 @electric-sql/pglite-socket@0.2.14
fi

bash scripts/container-e2e/install-headless-shell.sh

# All child processes run within this shell's loopback network namespace.
# This matters when the host isolates networking separately per shell command.
node scripts/container-e2e/pglite-server.mjs > "$run_dir/pglite.log" 2>&1 &
db_pid=$!

export APP_ENV=local NODE_ENV=test ENABLE_MOCKS=true TEST_MODE=true
export NEXT_TELEMETRY_DISABLED=1 SKIP_ENV_VALIDATION=1
export NEXTAUTH_URL=http://127.0.0.1:3003
export NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3003
export NEXTAUTH_SECRET=container-only-nextauth-secret
export DATABASE_URL=postgresql://postgres@127.0.0.1:5439/visutry_local_container_e2e
export DATABASE_URL_UNPOOLED="$DATABASE_URL" DIRECT_URL="$DATABASE_URL"
export VISUTRY_DATABASE_IDENTITY=local:127.0.0.1:5439/visutry_local_container_e2e
export STRIPE_MERCHANT_BILLING_MODE=test STRIPE_SECRET_KEY=sk_test_container_placeholder
# The local no-cost output fixture is server-guarded by all six runtime
# conditions. It can never dispatch to an external image provider.
export VISUTRY_LOCAL_DEMO_RUNTIME=1
export VISUTRY_LOCAL_DEMO_PROVIDER_MODE=blocked
export P1_M5_LOCAL_DECISION_RESULT_E2E=1
export STORE_SEED_CONFIRM=local-test-only
unset BLOB_READ_WRITE_TOKEN GOOGLE_API_KEY GRSAI_API_KEY RESEND_API_KEY
unset AXIOM_TOKEN AXIOM_DATASET AXIOM_ORG_ID STRIPE_WEBHOOK_SECRET

ready=false
for _ in $(seq 1 35); do
  if node -e '
    const {Client}=require("pg");
    (async () => {
      const client = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 1000 });
      await client.connect();
      const result = await client.query("SELECT current_database() AS db");
      await client.end();
      if (result.rows[0]?.db !== "visutry_local_container_e2e") process.exit(1);
    })().catch(() => process.exit(1));
  ' >/dev/null 2>&1; then ready=true; break; fi
  if ! kill -0 "$db_pid" 2>/dev/null; then break; fi
  sleep 1
done
[[ "$ready" == true ]] || { echo 'Local PGlite failed to start'; tail -50 "$run_dir/pglite.log"; exit 1; }

echo 'Applying canonical migrations to a fresh disposable PGlite test database'
npx prisma migrate deploy
node --import tsx scripts/db-environment.ts register
node --import tsx scripts/seed-local-qa.ts
node --import tsx scripts/seed-store-pilot.ts pilot/ello-sunglasses
node --import tsx scripts/merchant-local-preflight.ts

./node_modules/.bin/next dev --hostname 127.0.0.1 --port 3003 > "$run_dir/next.log" 2>&1 &
app_pid=$!

ready=false
for _ in $(seq 1 90); do
  response="$(curl --silent --output /dev/null --write-out '%{http_code}' --max-time 4 \
    http://127.0.0.1:3003/en/store/ello-sunglasses || true)"
  if [[ "$response" == 200 ]]; then ready=true; break; fi
  if ! kill -0 "$app_pid" 2>/dev/null; then break; fi
  sleep 2
done
[[ "$ready" == true ]] || { echo 'Merchant SSR failed to serve HTTP 200'; tail -90 "$run_dir/next.log"; exit 1; }

echo 'Running Chromium against real Next SSR + seeded local DB + mocked shopper APIs'
export PLAYWRIGHT_BASE_URL=http://127.0.0.1:3003
./node_modules/.bin/playwright test tests/e2e/store-pilot.spec.ts \
  --project=chromium --workers=1 --retries=0 \
  --grep 'configured merchant route|campaign experience route|applies the merchant compare|keeps a real provider failure|turns Store/Campaign AUTH_REQUIRED|presentation modes remain usable at mobile width|Store and Campaign landing actions remain usable at mobile width'

echo 'Running M1b v2 real Store/Campaign API, fixture Try-On and billing ledger gate'
node --import tsx scripts/seed-merchant-ai-v2-container.ts
./node_modules/.bin/playwright test tests/e2e/merchant-ai-v2-local.spec.ts \
  --project=chromium --workers=1 --retries=0

echo 'Running M2 real Store/Campaign configuration save, reload and shopper limits'
./node_modules/.bin/playwright test tests/e2e/merchant-m2-session-config-local.spec.ts \
  --project=chromium --workers=1 --retries=0
