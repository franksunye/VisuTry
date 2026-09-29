#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

refuse() { echo "Refusing Local sales-demo capture: $1" >&2; exit 1; }

[[ -z "${CI:-}" ]] || refuse "CI environment detected."
[[ -z "${VERCEL:-}${VERCEL_ENV:-}" ]] || refuse "Vercel environment detected."
[[ -z "${APP_ENV:-}" || "${APP_ENV}" == "local" ]] || refuse "APP_ENV is not local."
[[ "${NODE_ENV:-}" != "production" ]] || refuse "NODE_ENV=production is not allowed."
[[ -z "${VISUTRY_LOCAL_DEMO_PROVIDER_MODE:-}" || "${VISUTRY_LOCAL_DEMO_PROVIDER_MODE}" == "blocked" ]] || refuse "Provider mode is armed; this capture requires providers blocked."
[[ -z "${STRIPE_MERCHANT_BILLING_MODE:-}" || "${STRIPE_MERCHANT_BILLING_MODE,,}" == "test" ]] || refuse "Merchant Stripe mode is not TEST."
[[ -z "${STRIPE_SECRET_KEY:-}" || "${STRIPE_SECRET_KEY}" == sk_test_* ]] || refuse "A LIVE Stripe key is present."

assert_loopback_db() {
  local candidate="$1" label="$2"
  [[ -z "$candidate" ]] && return 0
  node -e 'const u=new URL(process.argv[1]);const h=u.hostname.toLowerCase().replace(/^\[|\]$/g,"");const db=decodeURIComponent(u.pathname.replace(/^\//,""));if(!["127.0.0.1","localhost","::1"].includes(h)||Number(u.port||5432)!==5433||db!=="visutry_local")process.exit(1)' "$candidate" \
    || refuse "$label does not target 127.0.0.1:5433/visutry_local."
}
assert_loopback_db "${DATABASE_URL:-}" DATABASE_URL
assert_loopback_db "${DATABASE_URL_UNPOOLED:-}" DATABASE_URL_UNPOOLED
[[ -z "${VISUTRY_DATABASE_IDENTITY:-}" || "${VISUTRY_DATABASE_IDENTITY}" == "local:127.0.0.1:5433/visutry_local" ]] \
  || refuse "The configured database identity is not the canonical Local marker."

port_is_in_use() {
  node -e 'const net=require("node:net");const s=net.connect({host:"127.0.0.1",port:Number(process.argv[1])});s.once("connect",()=>process.exit(0));s.once("error",()=>process.exit(1));setTimeout(()=>process.exit(1),350)' "$1"
}
for port in 3001 4100; do
  if port_is_in_use "$port"; then refuse "loopback port $port is occupied; no process was stopped."; fi
done

export APP_ENV=local
export NODE_ENV=development
export ENABLE_MOCKS=true
export TEST_MODE=true
export VISUTRY_LOCAL_DEMO_RUNTIME=1
export VISUTRY_LOCAL_DEMO_PROVIDER_MODE=blocked
export P1_M5_LOCAL_DECISION_RESULT_E2E=0
export DATABASE_URL="${DATABASE_URL:-postgresql://visutry_local@127.0.0.1:5433/visutry_local}"
export DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
export VISUTRY_DATABASE_IDENTITY=local:127.0.0.1:5433/visutry_local
export NEXTAUTH_URL=http://127.0.0.1:3001
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-local-only-development-secret}"
export NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3001
export NEXT_PUBLIC_GA_ID=""
export NEXT_PUBLIC_GTM_ID=""
export NEXT_PUBLIC_MEDIAPIPE_WASM_BASE_URL=http://127.0.0.1:4100/0.10.35/wasm
export NEXT_PUBLIC_MEDIAPIPE_MODEL_URL=http://127.0.0.1:4100/0.10.35/models/face_landmarker.task
export STRIPE_MERCHANT_BILLING_MODE=test
export P1_M5_LOCAL_DECISION_RESULT_E2E=0

run_id="$(date +%Y%m%d-%H%M%S)-$(node -e 'process.stdout.write(require("node:crypto").randomBytes(3).toString("hex"))')"
output_dir="$PWD/.local/sales-demo/$run_id"
private_dir="$PWD/.local/sales-demo/.private"
state_file="$private_dir/$run_id.json"
raw_log="$private_dir/$run_id.server.raw.log"
manifest_log="$output_dir/server.log"
server_pid=""
capture_succeeded=0

mkdir -p "$output_dir" "$private_dir"
chmod 700 "$private_dir"
: > "$raw_log"
chmod 600 "$raw_log"

stop_server() {
  if [[ -n "$server_pid" ]] && kill -0 "$server_pid" 2>/dev/null; then
    kill -TERM "$server_pid" 2>/dev/null || true
    wait "$server_pid" 2>/dev/null || true
  fi
  server_pid=""
}

reset_shopper_state() {
  env -i PATH="$PATH" HOME="${HOME:-/tmp}" bash scripts/reset-local-demo-session.sh
}

on_exit() {
  local status=$?
  stop_server
  if [[ -f "$state_file" ]]; then rm -f "$state_file"; fi
  if [[ -f "$raw_log" ]]; then
    node -e 'const fs=require("node:fs");const input=fs.readFileSync(process.argv[1],"utf8");const safe=input.replace(/sk_(?:test|live)_[A-Za-z0-9]+/g,"[REDACTED_STRIPE_KEY]").replace(/Bearer\s+\S+/gi,"Bearer [REDACTED]").replace(/((?:GRSAI_API_KEY|GEMINI_API_KEY|BLOB_READ_WRITE_TOKEN|NEXTAUTH_SECRET)\s*[=:]\s*)\S+/gi,"$1[REDACTED]").replace(/("(?:merchantSessionId|sessionId|userId|merchantId)"\s*:\s*")[^"]+("\s*[,}])/gi,"$1[REDACTED_ID]$2").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"[REDACTED_EMAIL]");fs.writeFileSync(process.argv[2],safe,{mode:0o600})' "$raw_log" "$manifest_log" || true
    rm -f "$raw_log"
  fi
  if [[ "$status" -ne 0 && "$capture_succeeded" -eq 0 ]]; then
    echo "Capture stopped; bounded Local Demo reset is being attempted." >&2
    reset_shopper_state >/dev/null 2>&1 || echo "Local Demo reset did not complete; preserve this run and rerun the canonical reset after review." >&2
  fi
  exit "$status"
}
trap on_exit EXIT INT TERM

print_sanitized_tail() {
  node -e 'const fs=require("node:fs");const input=fs.readFileSync(process.argv[1],"utf8");const safe=input.replace(/sk_(?:test|live)_[A-Za-z0-9]+/g,"[REDACTED_STRIPE_KEY]").replace(/Bearer\s+\S+/gi,"Bearer [REDACTED]").replace(/((?:GRSAI_API_KEY|GEMINI_API_KEY|BLOB_READ_WRITE_TOKEN|NEXTAUTH_SECRET)\s*[=:]\s*)\S+/gi,"$1[REDACTED]").replace(/("(?:merchantSessionId|sessionId|userId|merchantId)"\s*:\s*")[^"]+("\s*[,}])/gi,"$1[REDACTED_ID]$2").replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,"[REDACTED_EMAIL]");process.stdout.write(safe.split("\n").slice(-60).join("\n"))' "$raw_log"
}

echo "LOCAL SALES DEMO CAPTURE"
echo "environment: LOCAL"
echo "provider mode: BLOCKED"
echo "output: .local/sales-demo/$run_id"

for asset in \
  .local/mediapipe-assets/0.10.35/wasm/vision_wasm_internal.js \
  .local/mediapipe-assets/0.10.35/wasm/vision_wasm_internal.wasm \
  .local/mediapipe-assets/0.10.35/models/face_landmarker.task; do
  if [[ ! -s "$asset" ]]; then
    echo "Preparing the repository-pinned Local MediaPipe runtime asset: ${asset##*/}"
    npm run mediapipe:assets:download
    break
  fi
done

npm run demo:local:bootstrap
npx tsx scripts/preflight-local-sales-demo-capture.ts
node scripts/preflight-local-demo.mjs
reset_shopper_state

git_sha="$(git rev-parse HEAD)"
export VISUTRY_LOCAL_SALES_DEMO_CAPTURE=1
export PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001
export VISUTRY_LOCAL_SALES_DEMO_OUTPUT_DIR="$output_dir"
export VISUTRY_LOCAL_SALES_DEMO_STATE_FILE="$state_file"
export VISUTRY_LOCAL_SALES_DEMO_RUN_ID="$run_id"
export VISUTRY_LOCAL_SALES_DEMO_GIT_SHA="$git_sha"

for port in 3001 4100; do
  if port_is_in_use "$port"; then refuse "loopback port $port became occupied during bootstrap; no process was stopped."; fi
done
command -v lsof >/dev/null 2>&1 || refuse "lsof is required to verify that the capture owns its local listeners."

listener_belongs_to_capture() {
  local port="$1" listener_pid parent_pid
  listener_pid="$(lsof -nP -iTCP:"$port" -sTCP:LISTEN -t 2>/dev/null | head -n 1 || true)"
  [[ -n "$listener_pid" ]] || return 1
  for _ in $(seq 1 24); do
    [[ "$listener_pid" == "$server_pid" ]] && return 0
    parent_pid="$(ps -o ppid= -p "$listener_pid" 2>/dev/null | tr -d '[:space:]' || true)"
    [[ -n "$parent_pid" && "$parent_pid" != "1" && "$parent_pid" != "0" ]] || return 1
    listener_pid="$parent_pid"
  done
  return 1
}

bash scripts/dev-local-demo.sh >"$raw_log" 2>&1 &
server_pid=$!
ready=0
for attempt in $(seq 1 180); do
  if ! kill -0 "$server_pid" 2>/dev/null; then
    echo "Local Demo server exited before readiness." >&2
    print_sanitized_tail >&2 || true
    exit 1
  fi
  if curl --fail --silent --output /dev/null http://127.0.0.1:3001/en/store/visutry-demo-optical \
    && listener_belongs_to_capture 3001 && listener_belongs_to_capture 4100; then
    ready=1
    break
  fi
  sleep 1
done
[[ "$ready" == 1 ]] || { print_sanitized_tail >&2 || true; refuse "Local Demo server did not become ready."; }

npx playwright test --config=playwright.local-sales-demo.config.cjs --project=local-sales-demo-chromium
stop_server

if grep -Eiq 'Submitting task to:.*(grsaiapi\.com|generativelanguage\.googleapis\.com)|https?://[^[:space:]]*generativelanguage\.googleapis\.com' "$raw_log"; then
  refuse "server logs show an unexpected GrsAI/Gemini dispatch."
fi
if grep -Eiq 'blob\.vercel-storage\.com|vercel\.blob\.storage' "$raw_log"; then
  refuse "server logs show a Vercel Blob access in Local mock mode."
fi

VISUTRY_LOCAL_SALES_DEMO_RAW_LOG="$raw_log" \
  npx tsx scripts/verify-local-sales-demo-capture.ts

reset_shopper_state
capture_succeeded=1
rm -f "$state_file"
echo "LOCAL SALES DEMO CAPTURE: PASS"
echo "run directory: .local/sales-demo/$run_id"
echo "shopper DB/media: reset and verified; Merchant/Store/10-product fixture preserved"
echo "GrsAI=0 Gemini=0 Production=0 LiveStripe=0 VercelBlob=0"
