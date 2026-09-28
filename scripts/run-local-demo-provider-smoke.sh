#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ "${1:-}" != "--authorized" ]]; then
  echo "Refusing real-provider smoke without explicit owner authorization." >&2
  echo "Run: npm run demo:local:provider-smoke -- --authorized" >&2
  exit 2
fi
if [[ -n "${CI:-}" ]]; then
  echo "Refusing real-provider smoke in CI." >&2
  exit 1
fi
if [[ -n "${VERCEL_ENV:-}" || -n "${VERCEL:-}" ]]; then
  echo "Refusing real-provider smoke in a Vercel environment." >&2
  exit 1
fi
if [[ -n "${APP_ENV:-}" && "${APP_ENV}" != "local" ]]; then
  echo "Refusing: APP_ENV must be local." >&2
  exit 1
fi
if [[ "${NODE_ENV:-}" == "production" ]]; then
  echo "Refusing real-provider smoke with NODE_ENV=production." >&2
  exit 1
fi

port_in_use() {
  node -e 'const net=require("node:net");const s=net.connect({host:"127.0.0.1",port:Number(process.argv[1])});s.once("connect",()=>process.exit(0));s.once("error",()=>process.exit(1));setTimeout(()=>process.exit(1),300)' "$1"
}
assert_ports_free() {
  for port in 3001 4100; do
    if port_in_use "$port"; then
      echo "Refusing: loopback port ${port} is already in use. Stop the existing Local Demo first." >&2
      exit 1
    fi
  done
}

assert_ports_free

run_id="$(date +%Y%m%d-%H%M%S)-$$"
evidence_dir="$PWD/.local/demo-evidence/provider-smoke-${run_id}"
state_file="${evidence_dir}/state.json"
server_log="${evidence_dir}/server.log"
mkdir -p "$evidence_dir"
chmod 700 "$evidence_dir"

server_pid=""
cleanup() {
  if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then
    kill -TERM "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

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
export VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE=1
export VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE_AUTHORIZED=1
export VISUTRY_LOCAL_DEMO_EVIDENCE_DIR="$evidence_dir"
export VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE_STATE_FILE="$state_file"
export PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001

echo "→ Bootstrap canonical Local Demo"
VISUTRY_LOCAL_DEMO_PROVIDER_MODE=blocked npm run demo:local:bootstrap

echo "→ Reset dedicated Demo shopper state"
env -i PATH="$PATH" HOME="${HOME:-/tmp}" bash scripts/reset-local-demo-session.sh

start_server() {
  local mode="$1"
  : > "$server_log"
  if [[ "$mode" == "grsai" ]]; then
    echo "→ Start Local Demo with explicit GrsAI arm"
    env NODE_ENV=development VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE=1       VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE_AUTHORIZED=1       bash scripts/dev-local-demo.sh --arm-grsai >"$server_log" 2>&1 &
  else
    echo "→ Restart Local Demo with provider blocked"
    env NODE_ENV=development VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE=1       VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE_AUTHORIZED=0       bash scripts/dev-local-demo.sh >"$server_log" 2>&1 &
  fi
  server_pid=$!

  for attempt in $(seq 1 180); do
    if ! kill -0 "$server_pid" 2>/dev/null; then
      echo "Local Demo exited before readiness:" >&2
      tail -n 120 "$server_log" >&2 || true
      exit 1
    fi
    if curl --fail --silent --output /dev/null http://127.0.0.1:3001/en/store/visutry-demo-optical; then
      return 0
    fi
    sleep 1
  done
  echo "Local Demo did not become ready." >&2
  tail -n 120 "$server_log" >&2 || true
  exit 1
}

stop_server() {
  if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then
    kill -TERM "$server_pid"
    wait "$server_pid" 2>/dev/null || true
  fi
  server_pid=""
  for attempt in $(seq 1 30); do
    if port_in_use 3001 || port_in_use 4100; then sleep 1; else return 0; fi
  done
  echo "Owned Local Demo process did not release ports 3001/4100." >&2
  exit 1
}

start_server grsai
echo "→ Playwright real-provider shopper journey (Rowan then Lane, max 2 submits)"
APP_ENV=local VISUTRY_LOCAL_DEMO_RUNTIME=1 VISUTRY_LOCAL_DEMO_PROVIDER_MODE=grsai   VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE=1 VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE_AUTHORIZED=1   npx playwright test tests/e2e/demo-local-provider-smoke.spec.ts --project=chromium --grep "real provider smoke"

stop_server

echo "→ Verify DB telemetry: exactly two GrsAI requests / two attempts"
VISUTRY_LOCAL_DEMO_PROVIDER_MODE=grsai npx tsx scripts/verify-local-demo-provider-smoke.ts

if grep -E 'generativelanguage\.googleapis\.com|Starting Gemini .*Generation' "$server_log" >/dev/null 2>&1; then
  echo "Unexpected Gemini generation evidence in Local provider smoke." >&2
  exit 1
fi

start_server blocked
echo "→ Verify persisted Decision Result after app restart"
APP_ENV=local VISUTRY_LOCAL_DEMO_RUNTIME=1 VISUTRY_LOCAL_DEMO_PROVIDER_MODE=blocked   VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE=1 VISUTRY_LOCAL_DEMO_PROVIDER_SMOKE_AUTHORIZED=0   npx playwright test tests/e2e/demo-local-provider-smoke.spec.ts --project=chromium --grep "restart durability"
stop_server

echo "→ Final scoped reset (DB + durable shopper media)"
env -i PATH="$PATH" HOME="${HOME:-/tmp}" bash scripts/reset-local-demo-session.sh

cat > "${evidence_dir}/run-summary.txt" <<EOF
LOCAL DEMO REAL-PROVIDER SMOKE: PASS
run_id=${run_id}
grsai_submissions=2
gemini_submissions=0
production_preview_access=0
final_reset=PASS
EOF

echo
echo "LOCAL DEMO REAL-PROVIDER SMOKE: PASS"
echo "Evidence: ${evidence_dir}"
echo "GrsAI submissions: exactly 2 (Rowan then Lane)"
echo "Gemini submissions: 0"
echo "Final scoped reset: PASS"
