#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "${VERCEL_ENV:-}" || -n "${VERCEL:-}" ]]; then
  echo "Refusing Local Demo bootstrap in a Vercel environment." >&2
  exit 1
fi
if [[ -n "${APP_ENV:-}" && "$APP_ENV" != "local" ]]; then
  echo "Refusing: APP_ENV must be local for Local Demo bootstrap." >&2
  exit 1
fi
if [[ "${NODE_ENV:-}" == "production" ]]; then
  echo "Refusing Local Demo bootstrap with NODE_ENV=production." >&2
  exit 1
fi

pg_port="${VISUTRY_LOCAL_PGPORT:-5433}"
pg_database="${VISUTRY_LOCAL_PGDATABASE:-visutry_local}"
pg_user="${VISUTRY_LOCAL_PGUSER:-visutry_local}"
expected="local:127.0.0.1:${pg_port}/${pg_database}"
default_url="postgresql://${pg_user}@127.0.0.1:${pg_port}/${pg_database}"

for candidate in "${DATABASE_URL:-}" "${DATABASE_URL_UNPOOLED:-}"; do
  [[ -z "$candidate" ]] && continue
  if ! node -e 'const u=new URL(process.argv[1]);const host=u.hostname.toLowerCase().replace(/^\[|\]$/g,"");const db=decodeURIComponent(u.pathname.replace(/^\//,""));if(!["127.0.0.1","localhost","::1"].includes(host)||Number(u.port||5432)!==Number(process.argv[2])||db!==process.argv[3])process.exit(1)' "$candidate" "$pg_port" "$pg_database"; then
    echo "Refusing Local Demo bootstrap: configured PostgreSQL URL is not the expected loopback Local database." >&2
    exit 1
  fi
done

export APP_ENV=local
export ENABLE_MOCKS=true
export TEST_MODE=true
export VISUTRY_LOCAL_DEMO_RUNTIME=1
export VISUTRY_LOCAL_DEMO_PROVIDER_MODE=blocked
export VISUTRY_LOCAL_DEMO_EXECUTION_MODE=PREPARED_DEMO
export P1_M5_LOCAL_DECISION_RESULT_E2E=0
export DATABASE_URL="${DATABASE_URL:-$default_url}"
export DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
export VISUTRY_DATABASE_IDENTITY="$expected"
export NEXTAUTH_URL=http://127.0.0.1:3001
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-local-only-development-secret}"
export NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3001
export NEXT_PUBLIC_MEDIAPIPE_WASM_BASE_URL=http://127.0.0.1:4100/0.10.35/wasm
export NEXT_PUBLIC_MEDIAPIPE_MODEL_URL=http://127.0.0.1:4100/0.10.35/models/face_landmarker.task
export STRIPE_MERCHANT_BILLING_MODE=test

echo "→ Ensure checksum-verified MediaPipe runtime in the shared Local cache"
npm run mediapipe:assets:ensure
echo "→ Guarded Local PostgreSQL, schema, LOCAL marker, and QA identity bootstrap"
npm run merchant:local:bootstrap
echo "→ Reconcile the VisuTry Demo Optical fixture"
npm run demo:local:seed
echo "→ Verify canonical explicit Demo commercial entitlement"
npm run demo:local:entitlement:preflight
echo "→ Verify Local Demo runtime and exact schema parity"
npm run merchant:local:preflight
node scripts/preflight-local-demo.mjs
echo "LOCAL DEMO BOOTSTRAP: READY"
