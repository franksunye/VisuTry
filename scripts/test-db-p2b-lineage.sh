#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

PG_BIN_DIR="${VISUTRY_P2B_PG_BIN:-$(dirname "$(command -v initdb)")}"
for binary in initdb pg_ctl pg_isready createdb psql; do
  if [[ ! -x "$PG_BIN_DIR/$binary" ]]; then
    echo "❌ Missing PostgreSQL binary: $PG_BIN_DIR/$binary" >&2
    exit 1
  fi
done

PORT="${VISUTRY_P2B_PGPORT:-55434}"
if "$PG_BIN_DIR/pg_isready" -h 127.0.0.1 -p "$PORT" >/dev/null 2>&1; then
  echo "❌ Port $PORT is already in use; choose VISUTRY_P2B_PGPORT" >&2
  exit 1
fi

TEST_ROOT="$(mktemp -d /tmp/visutry-db-p2b.XXXXXX)"
PGDATA="$TEST_ROOT/pgdata"
PGLOG="$TEST_ROOT/postgres.log"
NEW_DATABASE="p2b_new_sim"
PROD_DATABASE="p2b_prod_sim"
NEW_URL="postgresql://p2b_local@127.0.0.1:${PORT}/${NEW_DATABASE}"
PROD_URL="postgresql://p2b_local@127.0.0.1:${PORT}/${PROD_DATABASE}"
TEST_CONFIG="$REPO_ROOT/tests/fixtures/prisma-p2b-test-config.ts"
ACTIVE_MIGRATIONS="$REPO_ROOT/prisma/migrations"
LEGACY_MIGRATIONS="$REPO_ROOT/prisma/migrations_legacy"
BASELINE_NAME="00000000000000_canonical_baseline"
BASELINE_SQL="$ACTIVE_MIGRATIONS/$BASELINE_NAME/migration.sql"

cleanup() {
  "$PG_BIN_DIR/pg_ctl" -D "$PGDATA" status >/dev/null 2>&1 && "$PG_BIN_DIR/pg_ctl" -D "$PGDATA" -m fast stop >/dev/null 2>&1 || true
  rm -rf "$TEST_ROOT"
}
trap cleanup EXIT INT TERM

fail() {
  echo "❌ $1" >&2
  exit 1
}

prisma_with() {
  local database_url="$1"
  local migrations_path="$2"
  shift 2
  env -u DATABASE_URL -u DATABASE_URL_UNPOOLED -u DIRECT_URL \
    APP_ENV=local \
    P2B_TEST_DATABASE_URL="$database_url" \
    P2B_TEST_MIGRATIONS_PATH="$migrations_path" \
    P2B_TEST_SCHEMA_PATH="$REPO_ROOT/prisma/schema.prisma" \
    npx prisma "$@" --config "$TEST_CONFIG"
}

historical_source_commit() {
  local historical_path="$1"
  local candidate_commit
  while IFS= read -r candidate_commit; do
    if git cat-file -e "$candidate_commit:$historical_path" 2>/dev/null; then
      printf '%s' "$candidate_commit"
      return 0
    fi
  done < <(git rev-list --all -- "$historical_path")
  return 1
}

assert_clean_status() {
  local database_url="$1"
  local migrations_path="$2"
  local log_path="$3"
  if ! prisma_with "$database_url" "$migrations_path" migrate status >"$log_path" 2>&1; then
    sed -n '1,120p' "$log_path" >&2
    fail "Prisma migration status was not clean."
  fi
  rg -q "Database schema is up to date!" "$log_path" || fail "Prisma did not report an up-to-date schema."
}

active_directory_count="$(find "$ACTIVE_MIGRATIONS" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
legacy_directory_count="$(find "$LEGACY_MIGRATIONS" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d ' ')"
[[ "$active_directory_count" == 1 ]] || fail "Active migration tree contains more than the canonical baseline."
[[ "$legacy_directory_count" == 48 ]] || fail "Expected 48 archived migration directories."
[[ -f "$ACTIVE_MIGRATIONS/migration_lock.toml" ]] || fail "Active migration_lock.toml is missing."
[[ ! -e "$LEGACY_MIGRATIONS/migration_lock.toml" ]] || fail "migration_lock.toml was duplicated into the archive."
[[ -f "$BASELINE_SQL" ]] || fail "Canonical baseline SQL is missing."

lock_source_commit="$(historical_source_commit prisma/migrations/migration_lock.toml)"
[[ -n "$lock_source_commit" ]] || fail "Could not locate the historical migration_lock.toml in Git history."
git show "$lock_source_commit:prisma/migrations/migration_lock.toml" | cmp -s - "$ACTIVE_MIGRATIONS/migration_lock.toml" || fail "migration_lock.toml changed."
while IFS= read -r legacy_directory; do
  migration_name="$(basename "$legacy_directory")"
  source_commit="$(historical_source_commit "prisma/migrations/$migration_name/migration.sql")"
  [[ -n "$source_commit" ]] || fail "Could not locate historical migration in Git history: $migration_name"
  git show "$source_commit:prisma/migrations/$migration_name/migration.sql" | cmp -s - "$legacy_directory/migration.sql" || fail "Historical migration content changed: $migration_name"
done < <(find "$LEGACY_MIGRATIONS" -mindepth 1 -maxdepth 1 -type d | sort)

for invariant in \
  'try_on_task_actor_check' \
  'Merchant_maxCompareFrames_check' \
  'Experience_one_active_store_per_merchant_idx' \
  'StoreAsset_deletedAt_deleteFailCount_lastDeleteAttemptAt_idx' \
  'MerchantUsageLedger_merchantId_kind_createdAt_idx' \
  'Merchant_commercialStatus_idx' \
  'MerchantSession_merchantId_billableAICommerceSession_idx'; do
  rg -Fq "$invariant" "$BASELINE_SQL" || fail "Baseline is missing raw-SQL invariant: $invariant"
done

if rg -ni 'neon|pg_neon|neondatabase|neon\.tech|ep-[a-z0-9-]+' "$BASELINE_SQL"; then
  fail "Canonical baseline contains provider-specific Neon SQL."
fi

if rg -n '_prisma_migrations' scripts/preview-db-bootstrap.ts; then
  fail "Preview bootstrap still references the migration ledger."
fi
if rg -n '20250918030414|20250116|20250118|db push --accept-data-loss' scripts/db-local.sh; then
  fail "Local bootstrap still contains historical or db-push workarounds."
fi
if rg -n 'migrate resolve --applied|canonical_baseline' scripts/migrate-deploy.sh; then
  fail "Production deployment script contains automatic baseline adoption."
fi

mkdir -p "$PGDATA"
"$PG_BIN_DIR/initdb" -D "$PGDATA" --username=p2b_local --auth=trust >/dev/null
"$PG_BIN_DIR/pg_ctl" -D "$PGDATA" -o "-p $PORT -h 127.0.0.1" -l "$PGLOG" start >/dev/null
for _ in $(seq 1 30); do
  if "$PG_BIN_DIR/pg_isready" -h 127.0.0.1 -p "$PORT" -U p2b_local -d postgres >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
"$PG_BIN_DIR/pg_isready" -h 127.0.0.1 -p "$PORT" -U p2b_local -d postgres >/dev/null 2>&1 || fail "Temporary PostgreSQL did not become ready."
"$PG_BIN_DIR/createdb" -h 127.0.0.1 -p "$PORT" -U p2b_local "$NEW_DATABASE"
"$PG_BIN_DIR/createdb" -h 127.0.0.1 -p "$PORT" -U p2b_local "$PROD_DATABASE"

# NEW_SIM: the actual active repository path must work from empty PostgreSQL.
prisma_with "$NEW_URL" "$ACTIVE_MIGRATIONS" migrate deploy >"$TEST_ROOT/new-baseline-deploy.log" 2>&1 || {
  sed -n '1,160p' "$TEST_ROOT/new-baseline-deploy.log" >&2
  fail "Fresh canonical baseline deployment failed."
}
assert_clean_status "$NEW_URL" "$ACTIVE_MIGRATIONS" "$TEST_ROOT/new-baseline-status.log"

new_tables="$(psql -X -w "$NEW_URL" -Atc "SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename <> '_prisma_migrations'")"
new_checks="$(psql -X -w "$NEW_URL" -Atc "SELECT count(*) FROM pg_constraint WHERE contype='c' AND conname IN ('try_on_task_actor_check', 'Merchant_maxCompareFrames_check')")"
new_partial="$(psql -X -w "$NEW_URL" -Atc "SELECT count(*) FROM pg_indexes WHERE indexname='Experience_one_active_store_per_merchant_idx' AND indexdef ILIKE '% WHERE %'")"
[[ "$new_tables" == 42 ]] || fail "Fresh baseline produced $new_tables application tables instead of 42."
[[ "$new_checks" == 2 ]] || fail "Fresh baseline did not preserve both CHECK invariants."
[[ "$new_partial" == 1 ]] || fail "Fresh baseline did not preserve the partial index."
for index_name in \
  StoreAsset_deletedAt_deleteFailCount_lastDeleteAttemptAt_idx \
  MerchantUsageLedger_merchantId_kind_createdAt_idx \
  Merchant_commercialStatus_idx \
  MerchantSession_merchantId_billableAICommerceSession_idx; do
  index_count="$(psql -X -w "$NEW_URL" -Atc "SELECT count(*) FROM pg_indexes WHERE indexname='$index_name'")"
  [[ "$index_count" == 1 ]] || fail "Fresh baseline is missing raw index: $index_name"
done

# Future migration rehearsal uses the actual baseline copied into a temporary
# future path; the active repository tree is not modified by this test.
FUTURE_MIGRATIONS="$TEST_ROOT/future-migrations"
mkdir -p "$FUTURE_MIGRATIONS/$BASELINE_NAME" "$FUTURE_MIGRATIONS/00000000000001_lineage_future_rehearsal"
cp "$BASELINE_SQL" "$FUTURE_MIGRATIONS/$BASELINE_NAME/migration.sql"
cp tests/fixtures/db-p2b-future-migration.sql "$FUTURE_MIGRATIONS/00000000000001_lineage_future_rehearsal/migration.sql"
prisma_with "$NEW_URL" "$FUTURE_MIGRATIONS" migrate deploy >"$TEST_ROOT/new-future-deploy.log" 2>&1 || fail "Fresh future migration deployment failed."
assert_clean_status "$NEW_URL" "$FUTURE_MIGRATIONS" "$TEST_ROOT/new-future-status.log"
new_marker="$(psql -X -w "$NEW_URL" -Atc "SELECT EXISTS (SELECT 1 FROM pg_class WHERE relname='DbP2bLineageRehearsalMarker' AND relkind='r')")"
[[ "$new_marker" == t ]] || fail "Fresh future migration marker is missing."

# PROD_SIM: reconstruct the current schema and historical 48-row ledger using
# the archived files, then perform cutover with Prisma-supported operations.
psql -X -w -v ON_ERROR_STOP=1 "$PROD_URL" -f "$LEGACY_MIGRATIONS/20250918030414_init/migration.sql" >/dev/null
psql -X -w -v ON_ERROR_STOP=1 "$PROD_URL" -f "$LEGACY_MIGRATIONS/20250116_add_premium_usage_count/migration.sql" >/dev/null
psql -X -w -v ON_ERROR_STOP=1 "$PROD_URL" -f "$LEGACY_MIGRATIONS/20250118_add_promo_product_types/migration.sql" >/dev/null
prisma_with "$PROD_URL" "$LEGACY_MIGRATIONS" migrate resolve --applied 20250918030414_init >/dev/null
prisma_with "$PROD_URL" "$LEGACY_MIGRATIONS" migrate resolve --applied 20250116_add_premium_usage_count >/dev/null
prisma_with "$PROD_URL" "$LEGACY_MIGRATIONS" migrate resolve --applied 20250118_add_promo_product_types >/dev/null
prisma_with "$PROD_URL" "$LEGACY_MIGRATIONS" migrate deploy >/dev/null
prisma_with "$PROD_URL" "$LEGACY_MIGRATIONS" db push --accept-data-loss >/dev/null
psql -X -w -v ON_ERROR_STOP=1 "$PROD_URL" -c 'CREATE INDEX IF NOT EXISTS "StoreAsset_deletedAt_deleteFailCount_lastDeleteAttemptAt_idx" ON "StoreAsset"("deletedAt", "deleteFailCount", "lastDeleteAttemptAt"); CREATE INDEX IF NOT EXISTS "MerchantUsageLedger_merchantId_kind_createdAt_idx" ON "MerchantUsageLedger"("merchantId", "kind", "createdAt"); CREATE INDEX IF NOT EXISTS "Merchant_commercialStatus_idx" ON "Merchant"("commercialStatus"); CREATE INDEX IF NOT EXISTS "MerchantSession_merchantId_billableAICommerceSession_idx" ON "MerchantSession"("merchantId", "billableAICommerceSession");' >/dev/null
historical_ledger_rows="$(psql -X -w "$PROD_URL" -Atc 'SELECT count(*) FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL')"
[[ "$historical_ledger_rows" == 48 ]] || fail "PROD_SIM did not reconstruct the 48-row historical ledger."

set +e
prisma_with "$PROD_URL" "$ACTIVE_MIGRATIONS" migrate status >"$TEST_ROOT/prod-before-resolve-status.log" 2>&1
prod_before_status=$?
set -e
[[ "$prod_before_status" != 0 ]] || fail "PROD_SIM unexpectedly reported clean before baseline adoption."
rg -q 'local migration history and the migrations table.*different' "$TEST_ROOT/prod-before-resolve-status.log" || fail "PROD_SIM did not report historical/active lineage divergence before adoption."

# The production wrapper must fail closed on this pre-adoption divergence. The
# wrapper runs only against the disposable PROD_SIM URL; the npx shim makes an
# accidental deploy attempt observable without allowing any database mutation.
WRAPPER_BIN="$TEST_ROOT/wrapper-bin"
WRAPPER_LOG="$TEST_ROOT/prod-before-resolve-wrapper-deploy.log"
WRAPPER_OUTPUT="$TEST_ROOT/prod-before-resolve-wrapper.log"
mkdir -p "$WRAPPER_BIN"
REAL_NPX="$(command -v npx)"
printf '%s\n' \
  '#!/usr/bin/env bash' \
  'set -euo pipefail' \
  'if [[ "$*" == "prisma migrate deploy" ]]; then' \
  '  echo "deploy" >> "${P2B_WRAPPER_LOG:?}"' \
  '  exit 99' \
  'fi' \
  'exec "$P2B_REAL_NPX" "$@"' > "$WRAPPER_BIN/npx"
chmod +x "$WRAPPER_BIN/npx"
: > "$WRAPPER_LOG"
set +e
P2B_REAL_NPX="$REAL_NPX" \
  P2B_WRAPPER_LOG="$WRAPPER_LOG" \
  PATH="$WRAPPER_BIN:$PATH" \
  VERCEL_ENV=production \
  VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1 \
  DATABASE_URL="$PROD_URL" \
  DATABASE_URL_UNPOOLED="$PROD_URL" \
  DIRECT_DATABASE_URL="$PROD_URL" \
  DIRECT_URL="$PROD_URL" \
  bash scripts/migrate-deploy.sh >"$WRAPPER_OUTPUT" 2>&1
prod_wrapper_exit=$?
set -e
[[ "$prod_wrapper_exit" != 0 ]] || fail "Production migration wrapper unexpectedly succeeded before baseline adoption."
[[ ! -s "$WRAPPER_LOG" ]] || fail "Production migration wrapper attempted deploy before baseline adoption."
rg -q 'refusing to run migrate deploy' "$WRAPPER_OUTPUT" || fail "Production migration wrapper did not fail closed before baseline adoption."

prisma_with "$PROD_URL" "$ACTIVE_MIGRATIONS" migrate resolve --applied "$BASELINE_NAME" >/dev/null
assert_clean_status "$PROD_URL" "$ACTIVE_MIGRATIONS" "$TEST_ROOT/prod-after-baseline-status.log"
prisma_with "$PROD_URL" "$FUTURE_MIGRATIONS" migrate deploy >"$TEST_ROOT/prod-future-deploy.log" 2>&1 || fail "PROD_SIM future migration deployment failed."
assert_clean_status "$PROD_URL" "$FUTURE_MIGRATIONS" "$TEST_ROOT/prod-final-status.log"
prod_marker="$(psql -X -w "$PROD_URL" -Atc "SELECT EXISTS (SELECT 1 FROM pg_class WHERE relname='DbP2bLineageRehearsalMarker' AND relkind='r')")"
[[ "$prod_marker" == t ]] || fail "PROD_SIM future migration marker is missing."
final_ledger_rows="$(psql -X -w "$PROD_URL" -Atc 'SELECT count(*) FROM "_prisma_migrations" WHERE "finished_at" IS NOT NULL')"
[[ "$final_ledger_rows" == 50 ]] || fail "PROD_SIM ledger does not contain 48 historical + baseline + future rows."

echo "DB-P2B lineage tests passed."
echo "ACTIVE_BASELINE=PASS"
echo "HISTORICAL_ARCHIVE=PASS"
echo "NEW_SIM=PASS"
echo "PROD_SIM=PASS"
echo "PROD_SIM_PRE_RESOLVE_FAIL_CLOSED=PASS"
echo "PROD_SIM_POST_RESOLVE_CLEAN=PASS"
echo "RAW_INVARIANTS=PASS"
echo "PROVIDER_NEUTRALITY=PASS"
