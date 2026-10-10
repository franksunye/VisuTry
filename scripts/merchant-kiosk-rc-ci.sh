#!/usr/bin/env bash
# Strict Kiosk RC on ephemeral marker-owned LOCAL PostgreSQL, never Production.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="$PWD/.local/merchant-kiosk-rc"
mkdir -p "$OUT"
SITE="http://127.0.0.1:3003"
MARKER="LOCAL|local:127.0.0.1:5432/visutry_merchant_rc"
pid=""
clean() { if [[ -n "$pid" ]]; then kill "$pid" 2>/dev/null || true; wait "$pid" 2>/dev/null || true; fi; }
trap clean EXIT
[[ "${CI:-}" == 'true' && "${APP_ENV:-}" == 'local' && "${NODE_ENV:-}" == 'test' ]] || exit 1
[[ "${TEST_MODE:-}" == 'true' && "${ENABLE_MOCKS:-}" == 'true' ]] || exit 1
[[ "${VISUTRY_DATABASE_IDENTITY:-}" == "local:127.0.0.1:5432/visutry_merchant_rc" ]] || exit 1
[[ "${PLAYWRIGHT_BASE_URL:-}" == "$SITE" && "${NEXTAUTH_URL:-}" == "$SITE" ]] || exit 1
[[ -z "${VERCEL:-}" && -z "${VERCEL_ENV:-}" ]] || exit 1
node - <<'NODE'
for (const name of ['DATABASE_URL', 'DATABASE_URL_UNPOOLED', 'DIRECT_URL']) {
  const url = new URL(process.env[name] || '')
  if (url.protocol !== 'postgresql:' || url.hostname !== '127.0.0.1'
    || url.port !== '5432' || url.pathname !== '/visutry_merchant_rc') throw Error('KIOSK_RC_BLOCKED: DB URL '+name)
}
for (const name of [
  'BLOB_READ_WRITE_TOKEN', 'GOOGLE_API_KEY', 'GRSAI_API_KEY', 'RESEND_API_KEY',
  'CLOUDFLARE_BROWSER_RENDERING_API_TOKEN',
]) if (process.env[name]) throw Error('KIOSK_RC_BLOCKED: external credential '+name)
NODE
db_marker() {
  PGPASSWORD=ci psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
    -Atc "SELECT environment || '|' || \"databaseIdentity\" FROM \"EnvironmentMetadata\" WHERE id='primary'"
}
echo "KIOSK RC: canonical migrations + ephemeral seeded merchant"
npx prisma generate
npx prisma migrate deploy
npx tsx scripts/db-environment.ts register
npx tsx scripts/seed-local-qa.ts
[[ "$(db_marker)" == "$MARKER" ]] || { echo "KIOSK_RC_BLOCKED: DB marker" >&2; exit 1; }
npx tsx scripts/seed-local-kiosk-qa.ts
npx tsx scripts/merchant-local-preflight.ts
[[ "$(db_marker)" == "$MARKER" ]] || { echo "KIOSK_RC_BLOCKED: DB marker after seed" >&2; exit 1; }
if curl -fsS --max-time 2 "$SITE/en/business" >/dev/null 2>&1; then
  echo "KIOSK_RC_BLOCKED: server port occupied" >&2; exit 1
fi
./node_modules/.bin/next dev --hostname 127.0.0.1 --port 3003 > "$OUT/next.log" 2>&1 &
pid=$!
ready=false
for i in $(seq 1 150); do
  if curl -fsS --max-time 3 "$SITE/en/business" >/dev/null 2>&1; then ready=true; break; fi
  if ! kill -0 "$pid" 2>/dev/null; then break; fi
  sleep 2
done
[[ "$ready" == true ]] || { echo "KIOSK_RC_BLOCKED: Next server not ready" >&2; exit 1; }
started="$(date +%s)"
echo "EXECUTING original Kiosk A-to-B privacy test in Chromium, single attempt, zero retries"
if env P1_M5_LOCAL_DECISION_RESULT_E2E=1 P1_M6_LOCAL_KIOSK_E2E=1 \
  PLAYWRIGHT_JSON_OUTPUT_FILE="$OUT/kiosk.json" \
  ./node_modules/.bin/playwright test tests/e2e/p1-m6-local-kiosk-shared-device.spec.ts \
    --project=chromium --workers=1 --retries=0 --reporter=json --output="$OUT/browser"; then
  echo "KIOSK_RC: Playwright process exit 0; ledger still enforces no skip"
else
  echo "KIOSK_RC: Playwright failed; ledger must block" >&2
fi
[[ -s "$OUT/kiosk.json" ]] || echo '{"suites":[]}' > "$OUT/kiosk.json"
[[ "$(db_marker)" == "$MARKER" ]] || { echo "KIOSK_RC_BLOCKED: post-test marker changed" >&2; exit 1; }
set +e
node scripts/merchant-release-scenario-ledger.mjs \
  --manifest docs/engineering/merchant-kiosk-rc.v1.json \
  --report "$OUT/kiosk.json" \
  --source-sha "$(git rev-parse HEAD)" --database-marker "$MARKER" \
  --mode MOCK --provider-requests 0 --external-cost-usd 0 --output "$OUT/ledger.json"
exit_code=$?
set -e
elapsed="$(($(date +%s)-started))"
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  {
    echo "### Kiosk A-to-B: original guarded Chromium E2E"
    echo "Exact SHA: $(git rev-parse HEAD)"
    echo "Disposable DB marker: $MARKER"
    echo "Result: $([[ "$exit_code" == 0 ]] && echo PASS || echo BLOCKED)"
    echo "Measured scenario runner wall: ${elapsed}s"
    echo "Provider count/cost NOT independently audited (reported zero)"
    echo "No live storage or Production writes; no browser traces/cookies uploaded"
  } >> "$GITHUB_STEP_SUMMARY"
fi
echo "KIOSK RC runner wall ${elapsed}s; ledger exit ${exit_code}"
exit "$exit_code"
