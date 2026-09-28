#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "${VERCEL_ENV:-}" || -n "${VERCEL:-}" ]]; then
  echo "Refusing Local Demo journey E2E inside a Vercel environment." >&2
  exit 1
fi
if [[ -n "${APP_ENV:-}" && "$APP_ENV" != "local" ]]; then
  echo "Refusing: APP_ENV must be local for the Demo journey E2E." >&2
  exit 1
fi
if [[ "${NODE_ENV:-}" == "production" ]]; then
  echo "Refusing Local Demo journey E2E with NODE_ENV=production." >&2
  exit 1
fi

assert_port_free() {
  local port="$1"
  if node -e 'const net=require("node:net");const s=net.connect({host:"127.0.0.1",port:Number(process.argv[1])});s.once("connect",()=>process.exit(0));s.once("error",()=>process.exit(1));setTimeout(()=>process.exit(1),300)' "$port"; then
    echo "Refusing: loopback port ${port} is already in use; no process was stopped." >&2
    exit 1
  fi
}

port_is_in_use() {
  node -e 'const net=require("node:net");const s=net.connect({host:"127.0.0.1",port:Number(process.argv[1])});s.once("connect",()=>process.exit(0));s.once("error",()=>process.exit(1));setTimeout(()=>process.exit(1),300)' "$1"
}

assert_port_free 3001
assert_port_free 4100

mkdir -p .local/logs
token_dir="$(mktemp -d "$PWD/.local/demo-result-token.XXXXXX")"
chmod 700 "$token_dir"
token_file="$token_dir/result-token"
server_pid=""
server_log=".local/logs/demo-journey-$(date +%Y%m%d-%H%M%S)-$$.log"

cleanup() {
  if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then
    kill -TERM "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  rm -f "$token_file"
  rmdir "$token_dir" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

start_server() {
  assert_port_free 3001
  assert_port_free 4100
  echo "Starting guarded Local Demo app (log: ${server_log})"
  env NODE_ENV=development bash scripts/dev-local-demo.sh --deterministic-tryon-fixture >"$server_log" 2>&1 &
  server_pid=$!
  for attempt in $(seq 1 180); do
    if ! kill -0 "$server_pid" 2>/dev/null; then
      echo "Local Demo server exited before readiness; last log lines:" >&2
      tail -n 100 "$server_log" >&2 || true
      exit 1
    fi
    if curl --fail --silent --output /dev/null http://127.0.0.1:3001/en/store/visutry-demo-optical; then
      echo "Local Demo app ready on 127.0.0.1:3001"
      return 0
    fi
    sleep 1
  done
  echo "Local Demo app did not become ready within 180 seconds; last log lines:" >&2
  tail -n 100 "$server_log" >&2 || true
  exit 1
}

stop_server() {
  if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then
    kill -TERM "$server_pid"
    wait "$server_pid" 2>/dev/null || true
  fi
  server_pid=""
  for attempt in $(seq 1 30); do
    if port_is_in_use 3001 || port_is_in_use 4100; then sleep 1; else return 0; fi
  done
  echo "Owned Local Demo server did not release both ports; refusing to start another instance." >&2
  exit 1
}

export NODE_ENV=test
export APP_ENV=local
export ENABLE_MOCKS=true
export TEST_MODE=true
export DATABASE_URL="${DATABASE_URL:-postgresql://visutry_local@127.0.0.1:5433/visutry_local}"
export DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
export VISUTRY_DATABASE_IDENTITY="${VISUTRY_DATABASE_IDENTITY:-local:127.0.0.1:5433/visutry_local}"
export NEXTAUTH_URL="${NEXTAUTH_URL:-http://127.0.0.1:3001}"
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-local-only-development-secret}"
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-http://127.0.0.1:3001}"
export NEXT_PUBLIC_MEDIAPIPE_WASM_BASE_URL="${NEXT_PUBLIC_MEDIAPIPE_WASM_BASE_URL:-http://127.0.0.1:4100/0.10.35/wasm}"
export NEXT_PUBLIC_MEDIAPIPE_MODEL_URL="${NEXT_PUBLIC_MEDIAPIPE_MODEL_URL:-http://127.0.0.1:4100/0.10.35/models/face_landmarker.task}"
export STRIPE_MERCHANT_BILLING_MODE=test
export VISUTRY_LOCAL_DEMO_RUNTIME=1
export VISUTRY_LOCAL_DEMO_PROVIDER_MODE=blocked
export P1_M5_LOCAL_DECISION_RESULT_E2E=1
export PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001
export VISUTRY_LOCAL_DEMO_RESULT_TOKEN_FILE="$token_file"

npm run merchant:local:preflight
node scripts/preflight-local-demo.mjs

run_reset_in_fresh_shell() {
  env -i PATH="$PATH" HOME="${HOME:-/tmp}" bash scripts/reset-local-demo-session.sh
}

echo "Resetting only the dedicated Local Demo shopper state before the journey."
run_reset_in_fresh_shell

start_server
npx playwright test tests/e2e/demo-local-decision-result.spec.ts --project=chromium --grep "completes Store"
if [[ ! -s "$token_file" ]]; then
  echo "Decision Result E2E did not produce a restart-verification token." >&2
  exit 1
fi
result_token="$(<"$token_file")"
if [[ ! "$result_token" =~ ^[A-Za-z0-9_-]{40,}$ ]]; then
  echo "Decision Result restart token has an unexpected format." >&2
  exit 1
fi
rm -f "$token_file"

stop_server
start_server
VISUTRY_LOCAL_DEMO_RESTART_RESULT_TOKEN="$result_token" \
  npx playwright test tests/e2e/demo-local-decision-result.spec.ts --project=chromium --grep "serves the same Decision Result"
unset result_token
stop_server

echo "Resetting again after restart verification; Merchant/Store/catalog must remain and shopper DB/media must be empty."
run_reset_in_fresh_shell

if grep -E 'Submitting task to: https://(grsaiapi\.com|generativelanguage\.googleapis\.com)' "$server_log"; then
  echo "Unexpected real AI provider dispatch was logged during the no-provider journey." >&2
  exit 1
fi

echo "LOCAL DEMO JOURNEY E2E: PASS (including app restart + persisted result media)"
