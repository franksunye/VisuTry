#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT

BASELINE_NAME="20261003000000_canonical_schema_baseline"
REPO="$TEST_ROOT/repo"
STUB_BIN="$TEST_ROOT/bin"
STUB_LOG="$TEST_ROOT/stub.log"
mkdir -p "$REPO/scripts" "$REPO/prisma/migrations" "$STUB_BIN"
cp "$SCRIPT_DIR/migrate-deploy.sh" "$SCRIPT_DIR/migration-baseline-contract.sh" "$REPO/scripts/"

cat > "$STUB_BIN/npx" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
BASELINE_NAME="20261003000000_canonical_schema_baseline"
echo "npx $*" >> "${STUB_LOG:?}"

case "$*" in
  "tsx scripts/clear-stale-migration-locks.ts") exit 0 ;;
  "tsx scripts/check-migration-baseline-anchor.ts 20261003000000_canonical_schema_baseline")
    case "${STUB_ANCHOR_STATE:-query-error}" in
      applied) echo "MIGRATION_BASELINE_ANCHOR=applied" ;;
      absent) echo "MIGRATION_BASELINE_ANCHOR=absent"; exit 2 ;;
      rolled-back) echo "MIGRATION_BASELINE_ANCHOR=invalid total=1 finished=0 rolledBack=1 unfinished=0"; exit 3 ;;
      failed) echo "MIGRATION_BASELINE_ANCHOR=invalid total=1 finished=0 rolledBack=0 unfinished=1"; exit 3 ;;
      duplicate) echo "MIGRATION_BASELINE_ANCHOR=invalid total=2 finished=2 rolledBack=0 unfinished=0"; exit 3 ;;
      query-error) echo "MIGRATION_BASELINE_ANCHOR=check-error ledger unavailable"; exit 1 ;;
      *) echo "unexpected anchor state: ${STUB_ANCHOR_STATE}" >&2; exit 1 ;;
    esac
    ;;
  "prisma migrate status")
    case "${STUB_STATUS_STATE:-unknown}" in
      up-to-date)
        echo "Database schema is up to date!"
        ;;
      legacy-pending)
        echo "Following migration have not yet been applied:"
        echo "20260928090000_legacy_pending_delta"
        exit 1
        ;;
      baseline-missing-anchor)
        # Prisma 7.1 output class observed in DB0 before --applied anchor
        # adoption: the new baseline is pending and all legacy names are only
        # present in the database ledger.
        echo "Your local migration history and the migrations table from your database are different!"
        echo "The last common migration is: null"
        echo "The migration have not yet been applied:"
        echo "$BASELINE_NAME"
        echo "The migrations from the database are not found locally in prisma/migrations:"
        echo "20260805180000_store_gate_a1_four_epics"
        echo "00000000000000_canonical_baseline"
        exit 1
        ;;
      baseline-future-pending)
        echo "Your local migration history and the migrations table from your database are different!"
        echo "The last common migration is: $BASELINE_NAME"
        echo "The migration have not yet been applied:"
        echo "20261004120000_test_future_delta"
        exit 1
        ;;
      baseline-future-pending-with-archive)
        echo "Your local migration history and the migrations table from your database are different!"
        echo "The last common migration is: $BASELINE_NAME"
        echo "The migration have not yet been applied:"
        echo "20261004120000_test_future_delta"
        echo "The migrations from the database are not found locally in prisma/migrations:"
        echo "20260805180000_store_gate_a1_four_epics"
        echo "20260605120000_add_face_analysis_task"
        echo "00000000000000_canonical_baseline"
        exit 1
        ;;
      divergent)
        echo "The database schema is not in sync with the migration history."
        exit 1
        ;;
      checksum-failure)
        echo "Migration checksum mismatch for 20261003000000_canonical_schema_baseline"
        exit 1
        ;;
      pending-interrupted)
        echo "Following migration have not yet been applied:"
        echo "20261004120000_test_future_delta"
        exit 130
        ;;
      pending-unexpected)
        echo "Following migration have not yet been applied:"
        echo "20261004120000_test_future_delta"
        exit 2
        ;;
      status-error)
        echo "Error: could not connect to database" >&2
        exit 1
        ;;
      *) echo "unexpected status state: ${STUB_STATUS_STATE}" >&2; exit 1 ;;
    esac
    ;;
  "prisma migrate deploy") echo "deploy" >> "$STUB_LOG" ;;
  *) echo "unexpected npx invocation: $*" >&2; exit 1 ;;
esac
STUB
chmod +x "$STUB_BIN/npx"

run_case() {
  local name="$1" tree="$2" status="$3" anchor="$4" expected_exit="$5" expected_deploy="$6"
  local actual_exit=0
  local output="$TEST_ROOT/$name.log"
  rm -rf "$REPO/prisma/migrations/$BASELINE_NAME"
  if [[ "$tree" == "baseline" ]]; then
    mkdir -p "$REPO/prisma/migrations/$BASELINE_NAME"
    printf 'SELECT 1;\n' > "$REPO/prisma/migrations/$BASELINE_NAME/migration.sql"
  fi
  : > "$STUB_LOG"

  set +e
  (cd "$REPO" && PATH="$STUB_BIN:$PATH" \
    STUB_LOG="$STUB_LOG" STUB_STATUS_STATE="$status" STUB_ANCHOR_STATE="$anchor" \
    VERCEL_ENV=production VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1 \
    DATABASE_URL_UNPOOLED=postgresql://direct.example/db \
    bash scripts/migrate-deploy.sh) > "$output" 2>&1
  actual_exit=$?
  set -e

  if [[ "$actual_exit" -ne "$expected_exit" ]]; then
    echo "❌ $name: expected exit $expected_exit, got $actual_exit"
    sed 's/^/  /' "$output"
    exit 1
  fi

  if [[ "$expected_deploy" == "yes" ]]; then
    grep -Fxq "deploy" "$STUB_LOG" || { echo "❌ $name: expected deploy"; exit 1; }
    grep -Fxq "npx tsx scripts/clear-stale-migration-locks.ts" "$STUB_LOG" || {
      echo "❌ $name: expected stale lock check before deploy"; exit 1;
    }
  elif grep -Fxq "deploy" "$STUB_LOG"; then
    echo "❌ $name: migrate deploy ran unexpectedly"
    exit 1
  elif grep -Fxq "npx tsx scripts/clear-stale-migration-locks.ts" "$STUB_LOG"; then
    echo "❌ $name: unsafe/non-pending state reached stale-lock cleanup"
    exit 1
  fi

  if [[ "$name" == "baseline-anchor-absent" ]] \
    && ! grep -Fq "Canonical baseline adoption is required" "$output"; then
    echo "❌ $name: missing explicit adoption-required error"
    exit 1
  fi
}

# Once DB1B activates the cutover contract, a missing or renamed baseline must
# fail before even asking Prisma for status; it can never select legacy mode.
: > "$STUB_LOG"
set +e
(cd "$REPO" && PATH="$STUB_BIN:$PATH" \
  STUB_LOG="$STUB_LOG" \
  VERCEL_ENV=production VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1 \
  DATABASE_URL_UNPOOLED=postgresql://direct.example/db \
  bash scripts/migrate-deploy.sh) > "$TEST_ROOT/cutover-baseline-missing.log" 2>&1
missing_baseline_exit=$?
set -e
if [[ "$missing_baseline_exit" -eq 0 || -s "$STUB_LOG" ]]; then
  echo "❌ Active cutover with a missing/renamed baseline did not fail before Prisma"
  exit 1
fi
grep -Fq "Refusing to fall back to legacy migrations" "$TEST_ROOT/cutover-baseline-missing.log"

# The adopted anchor gates both clean state and future deltas.
run_case "baseline-anchor-absent" baseline baseline-missing-anchor absent 1 no
run_case "baseline-anchor-up-to-date" baseline up-to-date applied 0 no
run_case "baseline-future-pending" baseline baseline-future-pending applied 0 yes
run_case "baseline-future-pending-archived-history" baseline baseline-future-pending-with-archive applied 0 yes

# Divergence, checksum problems, bad adoption rows, and Prisma's nonstandard
# exit codes remain fail-closed and must never reach deploy.
run_case "baseline-divergent" baseline divergent applied 1 no
run_case "baseline-checksum-failure" baseline checksum-failure applied 1 no
run_case "baseline-anchor-rolled-back" baseline baseline-future-pending rolled-back 1 no
run_case "baseline-anchor-failed" baseline baseline-future-pending failed 1 no
run_case "baseline-anchor-duplicate" baseline baseline-future-pending duplicate 1 no
run_case "baseline-anchor-query-error" baseline baseline-future-pending query-error 1 no
run_case "baseline-status-interrupted" baseline pending-interrupted applied 1 no
run_case "baseline-status-unexpected-exit" baseline pending-unexpected applied 1 no
run_case "baseline-status-error" baseline status-error applied 1 no

# No environment other than an authorized Production build may inspect status,
# inspect the adoption ledger, clean advisory locks, or deploy.
for environment in local preview; do
  : > "$STUB_LOG"
  (cd "$REPO" && PATH="$STUB_BIN:$PATH" STUB_LOG="$STUB_LOG" \
    VERCEL_ENV="$environment" bash scripts/migrate-deploy.sh) > "$TEST_ROOT/$environment.log"
  if [[ -s "$STUB_LOG" ]]; then echo "❌ $environment unexpectedly invoked npx"; exit 1; fi
done
: > "$STUB_LOG"
(cd "$REPO" && PATH="$STUB_BIN:$PATH" STUB_LOG="$STUB_LOG" CI=true bash scripts/migrate-deploy.sh) > "$TEST_ROOT/ci.log"
if [[ -s "$STUB_LOG" ]]; then echo "❌ CI unexpectedly invoked npx"; exit 1; fi

: > "$STUB_LOG"
set +e
(cd "$REPO" && PATH="$STUB_BIN:$PATH" STUB_LOG="$STUB_LOG" \
  VERCEL_ENV=production DATABASE_URL_UNPOOLED=postgresql://direct.example/db \
  bash scripts/migrate-deploy.sh) > "$TEST_ROOT/unauthorized.log" 2>&1
unauthorized_exit=$?
set -e
if [[ "$unauthorized_exit" -eq 0 || -s "$STUB_LOG" ]]; then
  echo "❌ Unauthorized Production invocation did not fail before Prisma"
  exit 1
fi
grep -Fq "requires VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1" "$TEST_ROOT/unauthorized.log"

echo "Migration baseline anchor state matrix passed (13 migration-status cases + missing/renamed cutover contract + 4 environment/authorization gates)."
