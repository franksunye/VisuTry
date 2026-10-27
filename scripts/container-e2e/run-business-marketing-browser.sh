#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

[[ "$(uname -s)" == Linux ]] || { echo 'This container gate supports Linux only.' >&2; exit 1; }
[[ -d node_modules && -x node_modules/.bin/next ]] || { echo 'Run npm ci first.' >&2; exit 1; }
[[ ! -e .env && ! -e .env.local ]] || {
  echo 'Use a disposable checkout without .env or .env.local.' >&2
  exit 1
}

export PLAYWRIGHT_BROWSERS_PATH="${PLAYWRIGHT_BROWSERS_PATH:-$ROOT/.local/container-e2e/browsers}"
export NEXT_TELEMETRY_DISABLED=1
export APP_ENV=local NODE_ENV=test ENABLE_MOCKS=true TEST_MODE=true
export NEXTAUTH_URL=http://127.0.0.1:3001
export NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3001
export NEXTAUTH_SECRET=container-only-nextauth-secret
export VISUTRY_LOCAL_DEMO_PROVIDER_MODE=blocked
unset DATABASE_URL DATABASE_URL_UNPOOLED DIRECT_URL BLOB_READ_WRITE_TOKEN GOOGLE_API_KEY GRSAI_API_KEY RESEND_API_KEY

# Browser setup, Next.js and Playwright share a local process/network context.
# No database, external AI provider, or Production write is needed.
bash scripts/container-e2e/install-headless-shell.sh

./node_modules/.bin/playwright test tests/e2e/business.spec.ts \
  --project=chromium --workers=1 --retries=0 \
  --grep 'Merchant pricing page|Merchant pricing comparison'
