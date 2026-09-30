#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "${VERCEL_ENV:-}" ]]; then
  echo "Refusing Local Demo startup inside a Vercel environment."
  exit 1
fi
if [[ -n "${APP_ENV:-}" && "$APP_ENV" != "local" ]]; then
  echo "Refusing: APP_ENV is set to a non-Local environment."
  exit 1
fi
if [[ "${NODE_ENV:-}" == "production" ]]; then
  echo "Refusing: NODE_ENV=production is not allowed for Local Demo."
  exit 1
fi

demo_mode="${1:-blocked}"
case "$demo_mode" in
  blocked)
    export VISUTRY_LOCAL_DEMO_PROVIDER_MODE=blocked
    export VISUTRY_LOCAL_DEMO_EXECUTION_MODE=PREPARED_DEMO
    export P1_M5_LOCAL_DECISION_RESULT_E2E=0
    ;;
  --prepared-demo)
    export VISUTRY_LOCAL_DEMO_PROVIDER_MODE=blocked
    export VISUTRY_LOCAL_DEMO_EXECUTION_MODE=PREPARED_DEMO
    export P1_M5_LOCAL_DECISION_RESULT_E2E=0
    ;;
  --deterministic-tryon-fixture)
    # Compatibility alias for older local commands. The canonical journey now
    # uses the shared PREPARED_DEMO result contract, never fake TryOnTask rows.
    export VISUTRY_LOCAL_DEMO_PROVIDER_MODE=blocked
    export VISUTRY_LOCAL_DEMO_EXECUTION_MODE=PREPARED_DEMO
    export P1_M5_LOCAL_DECISION_RESULT_E2E=0
    ;;
  --arm-grsai)
    export VISUTRY_LOCAL_DEMO_PROVIDER_MODE=grsai
    export VISUTRY_LOCAL_DEMO_EXECUTION_MODE=LIVE_PROVIDER
    export P1_M5_LOCAL_DECISION_RESULT_E2E=0
    ;;
  *)
    echo "Usage: $0 [--prepared-demo|--arm-grsai]" >&2
    exit 2
    ;;
esac

export APP_ENV=local
export VISUTRY_LOCAL_DEMO_RUNTIME=1
export ENABLE_MOCKS=true
export TEST_MODE=true
export NEXTAUTH_URL=http://127.0.0.1:3001
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-local-only-development-secret}"
export NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3001
export DATABASE_URL="${DATABASE_URL:-postgresql://visutry_local@127.0.0.1:5433/visutry_local}"
export DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
export VISUTRY_DATABASE_IDENTITY="${VISUTRY_DATABASE_IDENTITY:-local:127.0.0.1:5433/visutry_local}"
export STRIPE_MERCHANT_BILLING_MODE=test
export NEXT_PUBLIC_MEDIAPIPE_WASM_BASE_URL=http://127.0.0.1:4100/0.10.35/wasm
export NEXT_PUBLIC_MEDIAPIPE_MODEL_URL=http://127.0.0.1:4100/0.10.35/models/face_landmarker.task

asset_root=".local/mediapipe-assets/0.10.35"
for asset in \
  "$asset_root/wasm/vision_wasm_internal.js" \
  "$asset_root/wasm/vision_wasm_internal.wasm" \
  "$asset_root/models/face_landmarker.task"; do
  if [[ ! -s "$asset" ]]; then
    echo "Missing local MediaPipe asset: $asset"
    echo "Run npm run mediapipe:assets:download once, then retry."
    exit 1
  fi
done

npm run merchant:local:preflight
node scripts/preflight-local-demo.mjs

node scripts/serve-mediapipe-assets.mjs &
asset_pid=$!
app_pid=""
cleanup() {
  if [[ -n "$app_pid" ]] && kill -0 "$app_pid" 2>/dev/null; then
    kill "$app_pid" 2>/dev/null || true
    wait "$app_pid" 2>/dev/null || true
  fi
  if kill -0 "$asset_pid" 2>/dev/null; then
    kill "$asset_pid" 2>/dev/null || true
    wait "$asset_pid" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

for attempt in {1..40}; do
  if ! kill -0 "$asset_pid" 2>/dev/null; then
    echo "Local MediaPipe asset host exited before becoming ready (port 4100 may be occupied)."
    exit 1
  fi
  if curl --fail --silent --head "$NEXT_PUBLIC_MEDIAPIPE_WASM_BASE_URL/vision_wasm_internal.wasm" >/dev/null 2>&1 \
    && curl --fail --silent --head "$NEXT_PUBLIC_MEDIAPIPE_MODEL_URL" >/dev/null 2>&1; then
    break
  fi
  if [[ "$attempt" == 40 ]]; then
    echo "Local MediaPipe host did not serve the pinned WASM/model assets."
    exit 1
  fi
  sleep 0.25
done

echo "Local Demo runtime ready — app :3001, MediaPipe assets :4100."
bash scripts/dev-local.sh &
app_pid=$!
wait "$app_pid"
