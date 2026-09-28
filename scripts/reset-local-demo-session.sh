#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "${VERCEL_ENV:-}" ]]; then
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
export NEXTAUTH_URL="${NEXTAUTH_URL:-http://127.0.0.1:3001}"
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-http://127.0.0.1:3001}"
export NEXT_PUBLIC_MEDIAPIPE_WASM_BASE_URL=http://127.0.0.1:4100/0.10.35/wasm
export NEXT_PUBLIC_MEDIAPIPE_MODEL_URL=http://127.0.0.1:4100/0.10.35/models/face_landmarker.task
export STRIPE_MERCHANT_BILLING_MODE=test

npm run merchant:local:preflight
node scripts/preflight-local-demo.mjs
exec npx tsx scripts/reset-local-demo-session.ts
