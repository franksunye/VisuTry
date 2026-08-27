#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATION_SCRIPT="$SCRIPT_DIR/migrate-deploy.sh"
BUILD_SCRIPT="$(node -p "require('$SCRIPT_DIR/../package.json').scripts.build")"
TEST_ROOT="$(mktemp -d)"
STUB_BIN="$TEST_ROOT/bin"
STUB_LOG="$TEST_ROOT/npx.log"
mkdir -p "$STUB_BIN"
trap 'rm -rf "$TEST_ROOT"' EXIT

if [[ "$BUILD_SCRIPT" == *"migrate-deploy"* ]]; then
  echo "❌ The default build script must not invoke production migrations"
  exit 1
fi

assert_not_contains() {
  local needle="$1"
  local file="$2"
  if [[ -f "$file" ]] && grep -Fq "$needle" "$file"; then
    echo "❌ Unexpected output: $needle"
    exit 1
  fi
}

assert_contains() {
  local needle="$1"
  local file="$2"
  if ! grep -Fq "$needle" "$file"; then
    echo "❌ Missing expected output: $needle"
    exit 1
  fi
}

cat > "$STUB_BIN/npx" <<'STUB'
#!/usr/bin/env bash
set -euo pipefail
case "$*" in
  "tsx scripts/clear-stale-migration-locks.ts") exit 0 ;;
  "prisma migrate status")
    if [[ "${STUB_PENDING:-0}" == "1" ]]; then
      echo "Database schema is not yet been applied"
    else
      echo "Database schema is up to date"
    fi
    ;;
  "prisma migrate deploy")
    echo "deploy" >> "$STUB_LOG"
    ;;
  *)
    echo "unexpected npx invocation: $*" >&2
    exit 1
    ;;
esac
STUB
chmod +x "$STUB_BIN/npx"

PATH="$STUB_BIN:$PATH" VERCEL_ENV=preview bash "$MIGRATION_SCRIPT" > "$TEST_ROOT/preview.log"
assert_contains "skipping production migrations" "$TEST_ROOT/preview.log"
assert_not_contains "prisma migrate deploy" "$STUB_LOG"

if PATH="$STUB_BIN:$PATH" VERCEL_ENV=production bash "$MIGRATION_SCRIPT" > "$TEST_ROOT/unauthorized.log" 2>&1; then
  echo "❌ Unauthorized production migration unexpectedly succeeded"
  exit 1
fi
assert_contains "requires VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1" "$TEST_ROOT/unauthorized.log"
assert_not_contains "deploy" "$STUB_LOG"

PATH="$STUB_BIN:$PATH" \
  VERCEL_ENV=production \
  VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1 \
  DATABASE_URL_UNPOOLED=postgresql://direct.example/db \
  DATABASE_URL=postgresql://pooled.example/db \
  STUB_PENDING=1 \
  STUB_LOG="$STUB_LOG" \
  bash "$MIGRATION_SCRIPT" > "$TEST_ROOT/authorized.log"
assert_contains "Explicit production migration authorization confirmed" "$TEST_ROOT/authorized.log"
assert_contains "deploy" "$STUB_LOG"

PATH="$STUB_BIN:$PATH" VERCEL_ENV=local bash "$MIGRATION_SCRIPT" > "$TEST_ROOT/local.log"
assert_contains "skipping production migrations" "$TEST_ROOT/local.log"

PATH="$STUB_BIN:$PATH" CI=true bash "$MIGRATION_SCRIPT" > "$TEST_ROOT/ci.log"
assert_contains "skipping production migrations" "$TEST_ROOT/ci.log"

echo "Migration deployment boundary tests passed."
