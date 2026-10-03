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

node - "$TEST_DATABASE_URL" <<'NODE'
const url = new URL(process.argv[2])
const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''))
if (!['127.0.0.1', 'localhost', '::1'].includes(hostname)) {
  throw new Error('Refusing a non-loopback migration anchor test database.')
}
if (!databaseName.startsWith('visutry_db1b_anchor_')) {
  throw new Error('Disposable database name must start with visutry_db1b_anchor_.')
}
NODE

DATABASE_IDENTITY="$(psql "$TEST_DATABASE_URL" -X -Atc "SELECT host(inet_server_addr()) || '|' || inet_server_port()::text || '|' || current_database()")"
if [[ "$DATABASE_IDENTITY" != "127.0.0.1|"*"|visutry_db1b_anchor_"* ]]; then
  echo "❌ Connected database identity is not the expected disposable loopback target." >&2
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
  APP_ENV=local VISUTRY_DATABASE_IDENTITY="$DATABASE_IDENTITY" \
  npx prisma migrate deploy

ANCHOR_OUTPUT="$(DATABASE_URL="$TEST_DATABASE_URL" DATABASE_URL_UNPOOLED="$TEST_DATABASE_URL" \
  npx tsx scripts/check-migration-baseline-anchor.ts "$CANONICAL_BASELINE_MIGRATION")"
if [[ "$ANCHOR_OUTPUT" != "MIGRATION_BASELINE_ANCHOR=applied" ]]; then
  echo "❌ Real PostgreSQL anchor check returned an unexpected result:" >&2
  echo "$ANCHOR_OUTPUT" >&2
  exit 1
fi

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
