#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env.local ]]; then
  echo "❌ 缺少 .env.local，请从 .env.local.example 复制并填入本地配置" >&2
  exit 1
fi

export NODE_ENV=test
export APP_ENV=local
export ENABLE_MOCKS=true
export TEST_MODE=true
export NEXTAUTH_URL=http://127.0.0.1:3001
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-local-only-development-secret}"
export NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3001
export DATABASE_URL="${DATABASE_URL:-postgresql://visutry_local@127.0.0.1:5433/visutry_local}"
export DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
export VISUTRY_DATABASE_IDENTITY="${VISUTRY_DATABASE_IDENTITY:-local:127.0.0.1:5433/visutry_local}"
export STRIPE_MERCHANT_BILLING_MODE=test
export PORT=3001

# Deliberately valid-looking IDs prove the resolver, rather than clean env
# configuration, is what prevents Local telemetry from leaving the machine.
export NEXT_PUBLIC_GA_ID=G-LOCALSHOULDNOTSEND
export NEXT_PUBLIC_GTM_ID=GTM-LOCALSHOULDNOTSEND

npm run merchant:local:preflight

server_log="$(mktemp -t visutry-local-analytics.XXXXXX.log)"
server_pid=""
cleanup() {
  if [[ -n "$server_pid" ]]; then
    kill "$server_pid" >/dev/null 2>&1 || true
    wait "$server_pid" >/dev/null 2>&1 || true
  fi
  rm -f "$server_log"
}
trap cleanup EXIT INT TERM

npx next dev --hostname 127.0.0.1 --port 3001 >"$server_log" 2>&1 &
server_pid=$!

for _ in $(seq 1 60); do
  if curl --silent --fail http://127.0.0.1:3001/en/business >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! curl --silent --fail http://127.0.0.1:3001/en/business >/dev/null 2>&1; then
  cat "$server_log" >&2
  echo "❌ Local analytics test server did not become ready." >&2
  exit 1
fi

P0_L1_LOCAL_ANALYTICS_E2E=1 \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3001 \
npx playwright test tests/e2e/p0-l1-local-analytics-isolation.spec.ts --project=chromium
