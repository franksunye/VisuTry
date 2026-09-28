#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -n "${VERCEL_ENV:-}" || -n "${VERCEL:-}" ]]; then
  echo "❌ Refusing Local Next.js development startup inside a Vercel environment."
  exit 1
fi

if [[ ! -f .env.local ]] && ! [[ "${APP_ENV:-}" == "local" && "${VISUTRY_LOCAL_DEMO_RUNTIME:-}" == "1" ]]; then
  echo "❌ 缺少 .env.local，请从 .env.local.example 复制并填入本地配置"
  exit 1
fi

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

echo "→ prisma generate"
npx prisma generate --no-hints 2>/dev/null || npx prisma generate

echo "→ http://127.0.0.1:3001"
exec npx next dev --hostname 127.0.0.1 --port 3001
