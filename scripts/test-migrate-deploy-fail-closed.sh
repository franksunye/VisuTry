#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_SCRIPT="$SCRIPT_DIR/migrate-deploy.sh"
TEST_ROOT="$(mktemp -d)"
STUB_BIN="$TEST_ROOT/bin"
STUB_LOG="$TEST_ROOT/stub.log"
mkdir -p "$STUB_BIN"
trap 'rm -rf "$TEST_ROOT"' EXIT

cat > "$STUB_BIN/npx" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail

case "$*" in
  "tsx scripts/clear-stale-migration-locks.ts")
    exit 0
    ;;
  "prisma migrate status")
    case "${STUB_STATUS_STATE:-unknown}" in
      up-to-date)
        echo "Database schema is up to date!"
        ;;
      pending)
        echo "Following migration have not yet been applied:"
        echo "20260831120000_test_pending_migration"
        ;;
      divergent)
        echo "The database schema is not in sync with the migration history."
        exit 1
        ;;
      status-error)
        echo "Error: could not connect to database" >&2
        exit 1
        ;;
      unknown)
        echo "Migration status unavailable"
        ;;
      *)
        echo "unexpected test status state: ${STUB_STATUS_STATE}" >&2
        exit 1
        ;;
    esac
    ;;
  "prisma migrate deploy")
    echo "deploy" >> "${STUB_LOG:?}"
    ;;
  *)
    echo "unexpected npx invocation: $*" >&2
    exit 1
    ;;
esac
STUB
chmod +x "$STUB_BIN/npx"

run_case() {
  local name="$1"
  local state="$2"
  local expected_exit="$3"
  local expected_deploy="$4"
  local output_file="$TEST_ROOT/${name}.log"
  local actual_exit=0

  : > "$STUB_LOG"
  set +e
  PATH="$STUB_BIN:$PATH" \
    STUB_LOG="$STUB_LOG" \
    STUB_STATUS_STATE="$state" \
    VERCEL_ENV=production \
    VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1 \
    DATABASE_URL_UNPOOLED=postgresql://direct.example/db \
    bash "$MIGRATION_SCRIPT" > "$output_file" 2>&1
  actual_exit=$?
  set -e

  if [[ "$actual_exit" -ne "$expected_exit" ]]; then
    echo "❌ ${name}: expected exit ${expected_exit}, got ${actual_exit}"
    sed 's/^/  /' "$output_file"
    exit 1
  fi

  if [[ "$expected_deploy" == "yes" ]]; then
    if ! grep -Fxq "deploy" "$STUB_LOG"; then
      echo "❌ ${name}: expected migrate deploy to run"
      exit 1
    fi
  elif grep -Fxq "deploy" "$STUB_LOG"; then
    echo "❌ ${name}: migrate deploy ran unexpectedly"
    exit 1
  fi
}

run_case "up-to-date" "up-to-date" 0 no
run_case "pending" "pending" 0 yes
run_case "divergent" "divergent" 1 no
run_case "status-error" "status-error" 1 no
run_case "unknown" "unknown" 1 no

echo "Fail-closed migration deployment tests passed."
