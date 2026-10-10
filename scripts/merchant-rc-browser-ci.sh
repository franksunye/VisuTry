#!/usr/bin/env bash
# Actual Merchant browser execution, isolated CI-only Postgres, no production writes.
set -euo pipefail
cd "$(dirname "$0")/.."
DIR="$PWD/.local/merchant-rc"
OUT="$DIR/evidence"
SITE="http://127.0.0.1:3003"
EXPECTED="LOCAL|local:127.0.0.1:5432/visutry_merchant_rc"
mkdir -p "$OUT"
pid=""
stop_server() {
  if [[ -n "$pid" ]]; then
    kill "$pid" 2>/dev/null || true
    wait "$pid" 2>/dev/null || true
    pid=""
  fi
}
cleanup() { stop_server; }
trap cleanup EXIT
[[ "${CI:-}" == true && "${APP_ENV:-}" == local && "${NODE_ENV:-}" == test ]] || exit 1
[[ "${ENABLE_MOCKS:-}" == true && "${TEST_MODE:-}" == true ]] || exit 1
[[ -z "${VERCEL:-}" && -z "${VERCEL_ENV:-}" ]] || exit 1
[[ "${VISUTRY_DATABASE_IDENTITY:-}" == "local:127.0.0.1:5432/visutry_merchant_rc" ]] || exit 1
[[ "${PLAYWRIGHT_BASE_URL:-}" == "$SITE" && "${NEXTAUTH_URL:-}" == "$SITE" ]] || exit 1
node - <<'NODE'
for (const key of ['DATABASE_URL','DATABASE_URL_UNPOOLED','DIRECT_URL']) {
  const u = new URL(process.env[key] || '')
  if (u.protocol !== 'postgresql:' || u.hostname !== '127.0.0.1' || u.port !== '5432'
      || u.pathname !== '/visutry_merchant_rc') throw Error('Unexpected DB endpoint: '+key)
}
for (const key of ['BLOB_READ_WRITE_TOKEN','GOOGLE_API_KEY','GRSAI_API_KEY','RESEND_API_KEY']) {
  if (process.env[key]) throw Error('External provider credential forbidden: '+key)
}
NODE
echo "Applying canonical migrations to disposable PostgreSQL"
npx prisma generate
npx prisma migrate deploy
npx tsx scripts/db-environment.ts register
npx tsx scripts/seed-local-qa.ts
npx tsx scripts/merchant-local-preflight.ts
assert_marker() {
  local actual
  actual="$(PGPASSWORD=ci psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atc "SELECT environment || '|' || \"databaseIdentity\" FROM \"EnvironmentMetadata\" WHERE id='primary'")"
  [[ "$actual" == "$EXPECTED" ]] || { echo "DB MARKER MISMATCH" >&2; exit 1; }
}
assert_marker
echo "Verified actual LOCAL test DB marker"
if curl -fsS --max-time 2 "$SITE/en/business" >/dev/null 2>&1; then
  echo "CI test port already occupied" >&2; exit 1
fi
start_server() {
  if curl -fsS --max-time 2 "$SITE/en/business" >/dev/null 2>&1; then
    echo "CI test port already occupied" >&2; exit 1
  fi
  ./node_modules/.bin/next dev --hostname 127.0.0.1 --port 3003 > "$DIR/next.log" 2>&1 &
  pid=$!
  local ready=false
  for i in $(seq 1 150); do
    if curl -fsS --max-time 3 "$SITE/en/business" >/dev/null 2>&1; then ready=true; break; fi
    if ! kill -0 "$pid" 2>/dev/null; then break; fi
    sleep 2
  done
  [[ "$ready" == true ]] || { echo "Merchant RC app not ready" >&2; exit 1; }
}
start_server
reset_own_disposable_db_for_next_scenario() {
  # The Golden Path creates the clean QA identity. A subsequent Merchant test
  # MUST start from a fresh fixture, not reuse a now-activated Merchant.
  assert_marker
  stop_server
  echo "→ Clean second browser fixture only inside marked ephemeral RC database"
  PGPASSWORD=ci psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1     -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" >/dev/null
  npx prisma migrate deploy
  npx tsx scripts/db-environment.ts register
  npx tsx scripts/seed-local-qa.ts
  npx tsx scripts/merchant-local-preflight.ts
  assert_marker
  start_server
}
started="$(date +%s)"
run_scenario() {
  local label="$1" flag="$2" file="$3" report="$4"
  echo "EXECUTING $label in Chromium; zero retries"
  if env "$flag=1" PLAYWRIGHT_JSON_OUTPUT_FILE="$OUT/$report" \
    ./node_modules/.bin/playwright test "$file" --project=chromium --workers=1 --retries=0 \
      --reporter=json --output="$DIR/browser-output"; then
    echo "$label process exit 0; ledger must still confirm PASS"
  else
    echo "$label process FAILED; ledger must mark BLOCKED" >&2
  fi
  [[ -s "$OUT/$report" ]] || echo '{"suites":[]}' > "$OUT/$report"
  # Reporter metadata only: no cookies, user data, screenshots or raw output.
  node - "$OUT/$report" <<'NODE'
const fs = require('node:fs')
const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
const selected = []
function walk(s) {
  for (const spec of s.specs || []) for (const item of spec.tests || []) {
    selected.push({ file: spec.file || s.file || '', title: spec.title, project: item.projectName, status: item.status, attempts: item.results?.length })
  }
  for (const nested of s.suites || []) walk(nested)
}
for (const suite of report.suites || []) walk(suite)
console.log(JSON.stringify({ reporterSuiteCount: report.suites?.length ?? 0, testSelectors: selected }))
NODE
}
run_scenario "First Value" P0_L1_LOCAL_MERCHANT_E2E tests/e2e/p0-l1-local-merchant-growth-lab.spec.ts first.json
reset_own_disposable_db_for_next_scenario
run_scenario "Campaign" P1_M2_5_LOCAL_CAMPAIGN_E2E tests/e2e/p1-m2-5-local-campaign-workspace.spec.ts campaign.json
reset_own_disposable_db_for_next_scenario
run_scenario "Native Photo + Real Catalog" G1F_CATALOG_NATIVE_PHOTO_E2E tests/e2e/merchant-catalog-native-photo-local.spec.ts photo.json
reset_own_disposable_db_for_next_scenario
run_scenario "Unsafe URL -> CSV Real Catalog" G1F_REAL_CATALOG_CSV_E2E tests/e2e/merchant-catalog-csv-recovery-local.spec.ts csv.json
assert_marker
set +e
node scripts/merchant-release-scenario-ledger.mjs \
  --manifest docs/engineering/merchant-rc-foundation.v1.json \
  --report "$OUT/first.json" --report "$OUT/campaign.json" --report "$OUT/photo.json" --report "$OUT/csv.json" \
  --source-sha "$(git rev-parse HEAD)" --database-marker "$EXPECTED" \
  --mode MOCK --provider-requests 0 --external-cost-usd 0 --output "$OUT/ledger.json"
status=$?
set -e
duration="$(($(date +%s)-started))"
echo "Executed subset wall time: ${duration}s, ledger exit: $status"
if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
  {
    echo "### G1-F: four executed Merchant browser scenarios (NOT G2)"
    echo "Verified exact SHA: $(git rev-parse HEAD)"
    echo "Verified database marker: $EXPECTED"
    echo "Browser wall time: ${duration}s, mode MOCK, no production credentials"
    echo "Provider count/cost: reported zero only, NOT independently measured"
    echo "Ledger: $([[ $status -eq 0 ]] && echo PASS || echo BLOCKED)"
    echo "Unexecuted: successful external URL intake, actual Blob, Kiosk, Result, Brand and complete G2 matrix"
  } >> "$GITHUB_STEP_SUMMARY"
fi
exit "$status"
