#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
source scripts/migration-baseline-contract.sh
assert_canonical_baseline_contract "$PWD"

TEST_DATABASE_URL="${VISUTRY_MIGRATION_ANCHOR_TEST_DATABASE_URL:-}"
if [[ -z "$TEST_DATABASE_URL" ]]; then
  echo "❌ Set VISUTRY_MIGRATION_ANCHOR_TEST_DATABASE_URL to a fresh disposable loopback PostgreSQL database." >&2
  exit 1
fi

TEST_DATABASE_NAME="$(node - "$TEST_DATABASE_URL" <<'NODE'
const url = new URL(process.argv[2])
const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''))
if (!['127.0.0.1', 'localhost', '::1'].includes(hostname)) {
  throw new Error('Refusing a non-loopback migration anchor test database.')
}
if (!databaseName.startsWith('visutry_db1b_anchor_')) {
  throw new Error('Disposable database name must start with visutry_db1b_anchor_.')
}
process.stdout.write(databaseName)
NODE
 )"

CONNECTED_DATABASE_NAME="$(psql "$TEST_DATABASE_URL" -X -Atc 'SELECT current_database()')"
if [[ "$CONNECTED_DATABASE_NAME" != "$TEST_DATABASE_NAME" ]]; then
  echo "❌ Connected database name does not match the loopback disposable URL." >&2
  exit 1
fi

MIGRATIONS_TABLE_EXISTS="$(psql "$TEST_DATABASE_URL" -X -Atc "SELECT to_regclass('public._prisma_migrations') IS NOT NULL")"
PUBLIC_RELATION_COUNT="$(psql "$TEST_DATABASE_URL" -X -Atc "SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p', 'v', 'm', 'S')")"
if [[ "$MIGRATIONS_TABLE_EXISTS" != "f" || "$PUBLIC_RELATION_COUNT" != "0" ]]; then
  echo "❌ Refusing a non-empty database; this test only initializes a fresh disposable PostgreSQL database." >&2
  exit 1
fi

echo "→ Applying the canonical baseline to a fresh disposable PostgreSQL database"
DATABASE_URL="$TEST_DATABASE_URL" DATABASE_URL_UNPOOLED="$TEST_DATABASE_URL" \
  npx prisma migrate deploy

ANCHOR_OUTPUT="$(DATABASE_URL="$TEST_DATABASE_URL" DATABASE_URL_UNPOOLED="$TEST_DATABASE_URL" \
  npx tsx scripts/check-migration-baseline-anchor.ts "$CANONICAL_BASELINE_MIGRATION")"
if [[ "$ANCHOR_OUTPUT" != "MIGRATION_BASELINE_ANCHOR=applied" ]]; then
  echo "❌ Real PostgreSQL anchor check returned an unexpected result:" >&2
  echo "$ANCHOR_OUTPUT" >&2
  exit 1
fi

BASELINE_CHECKSUM="$(node -e 'const {createHash}=require("node:crypto"); const {readFileSync}=require("node:fs"); process.stdout.write(createHash("sha256").update(readFileSync(process.argv[1])).digest("hex"))' \
  "prisma/migrations/$CANONICAL_BASELINE_MIGRATION/migration.sql")"

seed_anchor_row() {
  local row_id="$1"
  local checksum="$2"
  local state="$3"
  local finished_at="NULL"
  local rolled_back_at="NULL"
  local logs="NULL"

  case "$state" in
    applied) finished_at="NOW()" ;;
    rolled-back) rolled_back_at="NOW()" ;;
    failed) logs="'DB2 simulated failed migration attempt'" ;;
    *) echo "❌ Unknown test anchor state: $state" >&2; exit 1 ;;
  esac

  if [[ ! "$row_id" =~ ^[0-9a-f-]{36}$ || ! "$checksum" =~ ^[0-9a-f]{64}$ ]]; then
    echo "❌ Invalid test anchor row id/checksum." >&2
    exit 1
  fi

  psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 \
    -c "INSERT INTO \"_prisma_migrations\" (id, checksum, migration_name, started_at, finished_at, rolled_back_at, logs, applied_steps_count) VALUES ('$row_id', '$checksum', '$CANONICAL_BASELINE_MIGRATION', NOW() - INTERVAL '1 minute', $finished_at, $rolled_back_at, $logs, 1)" \
    >/dev/null
}

run_real_anchor_case() {
  local case_name="$1"
  local expected_exit="$2"
  local expected_output="$3"
  local output=""
  local actual_exit=0

  set +e
  output="$(DATABASE_URL="$TEST_DATABASE_URL" DATABASE_URL_UNPOOLED="$TEST_DATABASE_URL" \
    npx tsx scripts/check-migration-baseline-anchor.ts "$CANONICAL_BASELINE_MIGRATION" 2>&1)"
  actual_exit=$?
  set -e

  if [[ "$actual_exit" -ne "$expected_exit" || "$output" != "$expected_output" ]]; then
    echo "❌ Real PostgreSQL anchor state '$case_name' mismatch." >&2
    echo "   expected exit/output: $expected_exit / $expected_output" >&2
    echo "   actual exit/output:   $actual_exit / $output" >&2
    exit 1
  fi
  echo "✓ real PostgreSQL anchor state: $case_name"
}

reset_anchor_rows() {
  psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 \
    -c "DELETE FROM \"_prisma_migrations\" WHERE migration_name = '$CANONICAL_BASELINE_MIGRATION'" \
    >/dev/null
}

reset_anchor_rows
run_real_anchor_case absent 2 "MIGRATION_BASELINE_ANCHOR=absent"

seed_anchor_row "00000000-0000-4000-8000-000000000001" "$BASELINE_CHECKSUM" applied
run_real_anchor_case applied 0 "MIGRATION_BASELINE_ANCHOR=applied"

reset_anchor_rows
seed_anchor_row "00000000-0000-4000-8000-000000000002" \
  "0000000000000000000000000000000000000000000000000000000000000000" applied
run_real_anchor_case checksum-mismatch 3 \
  "MIGRATION_BASELINE_ANCHOR=invalid total=1 finished=1 rolledBack=0 unfinished=0 checksumMatches=0"

reset_anchor_rows
seed_anchor_row "00000000-0000-4000-8000-000000000003" "$BASELINE_CHECKSUM" rolled-back
run_real_anchor_case rolled-back 3 \
  "MIGRATION_BASELINE_ANCHOR=invalid total=1 finished=0 rolledBack=1 unfinished=0 checksumMatches=1"

reset_anchor_rows
seed_anchor_row "00000000-0000-4000-8000-000000000004" "$BASELINE_CHECKSUM" failed
run_real_anchor_case unfinished-failed 3 \
  "MIGRATION_BASELINE_ANCHOR=invalid total=1 finished=0 rolledBack=0 unfinished=1 checksumMatches=1"

reset_anchor_rows
seed_anchor_row "00000000-0000-4000-8000-000000000005" "$BASELINE_CHECKSUM" applied
seed_anchor_row "00000000-0000-4000-8000-000000000006" "$BASELINE_CHECKSUM" applied
run_real_anchor_case duplicate 3 \
  "MIGRATION_BASELINE_ANCHOR=invalid total=2 finished=2 rolledBack=0 unfinished=0 checksumMatches=2"

reset_anchor_rows
seed_anchor_row "00000000-0000-4000-8000-000000000007" "$BASELINE_CHECKSUM" applied
run_real_anchor_case restored-applied 0 "MIGRATION_BASELINE_ANCHOR=applied"

ARRAY_NOT_NULL_COUNT="$(psql "$TEST_DATABASE_URL" -X -Atc "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = 'public' AND is_nullable = 'NO' AND (table_name, column_name) IN (('Merchant', 'commercialAddOns'), ('MerchantAgentCredential', 'scopes'), ('MerchantFrame', 'collectionTags'), ('MerchantOAuthAuthorization', 'scopes'), ('MerchantOAuthAuthorizationCode', 'scopes'), ('MerchantOAuthAuthorizationRequest', 'scopes'), ('MerchantOAuthClient', 'redirectUris'))")"
CHECK_CONSTRAINT_COUNT="$(psql "$TEST_DATABASE_URL" -X -Atc "SELECT COUNT(*) FROM pg_constraint WHERE conname IN ('Merchant_maxCompareFrames_check', 'try_on_task_actor_check') AND contype = 'c'")"
PARTIAL_UNIQUE_INDEX_COUNT="$(psql "$TEST_DATABASE_URL" -X -Atc "SELECT COUNT(*) FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid WHERE c.relname = 'Experience_one_active_store_per_merchant_idx' AND i.indisunique AND i.indpred IS NOT NULL")"
USER_COLUMN_COMMENT="$(psql "$TEST_DATABASE_URL" -X -Atc "SELECT col_description('public.\"User\"'::regclass, a.attnum) FROM pg_attribute a WHERE a.attrelid = 'public.\"User\"'::regclass AND a.attname = 'premiumUsageCount'")"
RAW_QUERY_INDEX_COUNT="$(psql "$TEST_DATABASE_URL" -X -Atc "SELECT COUNT(*) FROM pg_class WHERE relkind = 'i' AND relname IN ('StoreAsset_deletedAt_deleteFailCount_lastDeleteAttemptAt_idx', 'MerchantUsageLedger_merchantId_kind_createdAt_idx', 'Merchant_commercialStatus_idx', 'MerchantSession_merchantId_billableAICommerceSession_idx')")"
if [[ "$ARRAY_NOT_NULL_COUNT" != "7" || "$CHECK_CONSTRAINT_COUNT" != "2" || "$PARTIAL_UNIQUE_INDEX_COUNT" != "1" || "$USER_COLUMN_COMMENT" != "Premium subscription usage count (resets on billing cycle renewal)" || "$RAW_QUERY_INDEX_COUNT" != "4" ]]; then
  echo "❌ Fresh baseline is missing an accepted database structural contract." >&2
  printf 'arrays_not_null=%s checks=%s partial_unique=%s user_comment=%s raw_indexes=%s\n' \
    "$ARRAY_NOT_NULL_COUNT" "$CHECK_CONSTRAINT_COUNT" "$PARTIAL_UNIQUE_INDEX_COUNT" \
    "$USER_COLUMN_COMMENT" "$RAW_QUERY_INDEX_COUNT" >&2
  exit 1
fi

DATABASE_URL="$TEST_DATABASE_URL" DATABASE_URL_UNPOOLED="$TEST_DATABASE_URL" npx prisma migrate status
echo "$ANCHOR_OUTPUT"
echo "✓ Canonical baseline anchor and all accepted custom structural contracts verified against disposable PostgreSQL."
