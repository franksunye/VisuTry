#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "${VERCEL_ENV:-}" ]]; then
  echo "Refusing Local Demo seed inside a Vercel environment."
  exit 1
fi
if [[ -n "${APP_ENV:-}" && "$APP_ENV" != "local" ]]; then
  echo "Refusing: APP_ENV is set to a non-Local environment."
  exit 1
fi
if [[ "${NODE_ENV:-}" == "production" ]]; then
  echo "Refusing: NODE_ENV=production is not allowed for Local Demo seed."
  exit 1
fi

export APP_ENV=local
export ENABLE_MOCKS=true
export TEST_MODE=true
export DATABASE_URL="${DATABASE_URL:-postgresql://visutry_local@127.0.0.1:5433/visutry_local}"
export DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
export VISUTRY_DATABASE_IDENTITY="${VISUTRY_DATABASE_IDENTITY:-local:127.0.0.1:5433/visutry_local}"
export STRIPE_MERCHANT_BILLING_MODE=test

exec npx tsx scripts/seed-local-demo.ts
