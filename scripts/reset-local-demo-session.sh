#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "${VERCEL_ENV:-}" || -n "${VERCEL:-}" ]]; then
  echo "Refusing: Local Demo session reset cannot run in a Vercel environment."
  exit 1
fi
if [[ -n "${APP_ENV:-}" && "$APP_ENV" != "local" ]]; then
  echo "Refusing: APP_ENV is set to a non-Local environment."
  exit 1
fi
if [[ "${NODE_ENV:-}" == "production" ]]; then
  echo "Refusing: NODE_ENV=production is not allowed."
  exit 1
fi

export APP_ENV=local
export ENABLE_MOCKS=true
export TEST_MODE=true
export DATABASE_URL="${DATABASE_URL:-postgresql://visutry_local@127.0.0.1:5433/visutry_local}"
export DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
export VISUTRY_DATABASE_IDENTITY="${VISUTRY_DATABASE_IDENTITY:-local:127.0.0.1:5433/visutry_local}"
local_demo_port="${VISUTRY_LOCAL_DEMO_PORT:-3001}"
if [[ "$local_demo_port" != "3001" && "$local_demo_port" != "3002" ]]; then
  echo "VISUTRY_LOCAL_DEMO_PORT must be 3001 or 3002." >&2
  exit 2
fi
export VISUTRY_LOCAL_DEMO_PORT="$local_demo_port"
export NEXTAUTH_URL="http://127.0.0.1:${local_demo_port}"
export NEXT_PUBLIC_SITE_URL="http://127.0.0.1:${local_demo_port}"
export NEXT_PUBLIC_MEDIAPIPE_WASM_BASE_URL=http://127.0.0.1:4100/0.10.35/wasm
export NEXT_PUBLIC_MEDIAPIPE_MODEL_URL=http://127.0.0.1:4100/0.10.35/models/face_landmarker.task
export STRIPE_MERCHANT_BILLING_MODE=test
export VISUTRY_LOCAL_DEMO_RUNTIME=1
export VISUTRY_LOCAL_DEMO_PROVIDER_MODE=blocked
export VISUTRY_LOCAL_DEMO_EXECUTION_MODE=PREPARED_DEMO
export P1_M5_LOCAL_DECISION_RESULT_E2E=0

npm run merchant:local:preflight
node scripts/preflight-local-demo.mjs
exec npx tsx scripts/reset-local-demo-session.ts
