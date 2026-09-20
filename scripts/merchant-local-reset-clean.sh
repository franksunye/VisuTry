#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

export APP_ENV=local
export ENABLE_MOCKS=true
export TEST_MODE=true
export NEXTAUTH_URL=http://127.0.0.1:3001
export NEXTAUTH_SECRET="${NEXTAUTH_SECRET:-local-only-development-secret}"
export NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3001
export STRIPE_MERCHANT_BILLING_MODE=test
export DATABASE_URL="${DATABASE_URL:-postgresql://visutry_local@127.0.0.1:5433/visutry_local}"
export DATABASE_URL_UNPOOLED="${DATABASE_URL_UNPOOLED:-$DATABASE_URL}"
export VISUTRY_DATABASE_IDENTITY="${VISUTRY_DATABASE_IDENTITY:-local:127.0.0.1:5433/visutry_local}"

echo "→ Verifying Local-only boundary before reset"
npm run merchant:local:preflight
echo "→ Resetting only the repository-local PostgreSQL cluster"
npm run db:local:reset
npm run merchant:local:preflight
