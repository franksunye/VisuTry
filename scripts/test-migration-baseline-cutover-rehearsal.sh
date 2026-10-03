#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
source scripts/migration-baseline-contract.sh
assert_canonical_baseline_contract "$PWD"

TEST_DATABASE_URL="${VISUTRY_DB2_CUTOVER_TEST_DATABASE_URL:-}"
if [[ -z "$TEST_DATABASE_URL" ]]; then
  echo "❌ Set VISUTRY_DB2_CUTOVER_TEST_DATABASE_URL to a fresh disposable loopback PostgreSQL database." >&2
  exit 1
fi

TEST_DATABASE_NAME="$(node - "$TEST_DATABASE_URL" <<'NODE'
const url = new URL(process.argv[2])
const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '')
const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''))
if (!['127.0.0.1', 'localhost', '::1'].includes(hostname)) {
  throw new Error('Refusing a non-loopback DB2 cutover rehearsal database.')
}
if (!databaseName.startsWith('visutry_db1b_cutover_')) {
  throw new Error('Disposable database name must start with visutry_db1b_cutover_.')
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
  echo "❌ Refusing a non-empty database; the cutover rehearsal requires a fresh disposable database." >&2
  exit 1
fi

BASELINE_SQL="prisma/migrations/$CANONICAL_BASELINE_MIGRATION/migration.sql"
BASELINE_CHECKSUM="$(node -e 'const {createHash}=require("node:crypto"); const {readFileSync}=require("node:fs"); process.stdout.write(createHash("sha256").update(readFileSync(process.argv[1])).digest("hex"))' "$BASELINE_SQL")"
EXPECTED_BASELINE_CHECKSUM="17c88907cfc8c162497c215878d5255473632ccfc7534018f5b9f1a83cf729cf"
if [[ "$BASELINE_CHECKSUM" != "$EXPECTED_BASELINE_CHECKSUM" ]]; then
  echo "❌ Final baseline bytes differ from the DB2-approved frozen candidate." >&2
  echo "   expected=$EXPECTED_BASELINE_CHECKSUM actual=$BASELINE_CHECKSUM" >&2
  exit 1
fi

FUTURE_MIGRATION="20261003010000_db2_rehearsal_future_delta"
FUTURE_DIR="$PWD/prisma/migrations/$FUTURE_MIGRATION"
FUTURE_CREATED=0
cleanup() {
  if [[ "$FUTURE_CREATED" == "1" ]]; then
    rm -rf "$FUTURE_DIR"
  fi
}
trap cleanup EXIT
if [[ -e "$FUTURE_DIR" ]]; then
  echo "❌ Refusing to overwrite an existing future migration path: $FUTURE_DIR" >&2
  exit 1
fi

echo "→ Applying the exact frozen baseline SQL to a fresh disposable database to model the pre-cutover schema"
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 -f "$BASELINE_SQL" >/dev/null
psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE "_prisma_migrations" (
  "id" VARCHAR(36) NOT NULL PRIMARY KEY,
  "checksum" VARCHAR(64) NOT NULL,
  "finished_at" TIMESTAMPTZ,
  "migration_name" VARCHAR(255) NOT NULL,
  "logs" TEXT,
  "rolled_back_at" TIMESTAMPTZ,
  "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "applied_steps_count" INTEGER NOT NULL DEFAULT 0
);
SQL

LEDGER_ORDINAL=0
insert_ledger_row() {
  local migration_name="$1"
  local checksum="$2"
  local state="$3"
  local id_digest=""
  local row_id=""

  if [[ ! "$migration_name" =~ ^[A-Za-z0-9_]+$ ]]; then
    echo "❌ Invalid migration name in rehearsal inventory: $migration_name" >&2
    exit 1
  fi
  if [[ ! "$checksum" =~ ^([0-9a-f]{64}|0)$ ]]; then
    echo "❌ Invalid migration checksum in rehearsal inventory: $migration_name" >&2
    exit 1
  fi
  id_digest="$(printf '%s:%s' "$migration_name" "$state" | shasum -a 256 | cut -c1-32)"
  row_id="db2-${id_digest}"
  LEDGER_ORDINAL=$((LEDGER_ORDINAL + 1))

  if [[ "$state" == "rolled-back" ]]; then
    psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 \
      -c "INSERT INTO \"_prisma_migrations\" (id, checksum, migration_name, started_at, finished_at, rolled_back_at, applied_steps_count) VALUES ('$row_id', '$checksum', '$migration_name', TIMESTAMPTZ '2025-01-01 00:00:00+00' + $LEDGER_ORDINAL * INTERVAL '1 minute', NULL, TIMESTAMPTZ '2025-01-01 00:00:00+00' + $LEDGER_ORDINAL * INTERVAL '1 minute' + INTERVAL '10 seconds', 0)" \
      >/dev/null
  else
    psql "$TEST_DATABASE_URL" -X -v ON_ERROR_STOP=1 \
      -c "INSERT INTO \"_prisma_migrations\" (id, checksum, migration_name, started_at, finished_at, rolled_back_at, applied_steps_count) VALUES ('$row_id', '$checksum', '$migration_name', TIMESTAMPTZ '2025-01-01 00:00:00+00' + $LEDGER_ORDINAL * INTERVAL '1 minute', TIMESTAMPTZ '2025-01-01 00:00:00+00' + $LEDGER_ORDINAL * INTERVAL '1 minute' + INTERVAL '5 seconds', NULL, 1)" \
      >/dev/null
  fi
}

LEGACY_DIRECTORY_COUNT=0
while IFS= read -r migration_directory; do
  migration_name="$(basename "$migration_directory")"
  migration_sql="$migration_directory/migration.sql"
  if [[ "$migration_name" == "20260805180000_store_gate_a1_four_epics" ]]; then
    migration_sql="prisma/migrations-archive/production-applied-variants/$migration_name/migration.sql"
  fi
  if [[ ! -s "$migration_sql" ]]; then
    echo "❌ Missing historical source SQL for $migration_name" >&2
    exit 1
  fi
  migration_checksum="$(shasum -a 256 "$migration_sql" | awk '{print $1}')"
  insert_ledger_row "$migration_name" "$migration_checksum" finished
  if [[ "$migration_name" == "20260605120000_add_face_analysis_task" ]]; then
    insert_ledger_row "$migration_name" "$migration_checksum" rolled-back
  fi
  LEGACY_DIRECTORY_COUNT=$((LEGACY_DIRECTORY_COUNT + 1))
done < <(find prisma/migrations-archive/legacy -mindepth 1 -maxdepth 1 -type d | sort)

if [[ "$LEGACY_DIRECTORY_COUNT" -ne 53 ]]; then
  echo "❌ Expected 53 archived legacy migration directories, found $LEGACY_DIRECTORY_COUNT." >&2
  exit 1
fi

OLD_BASELINE_SQL="prisma/migrations-archive/production-ledger-only/00000000000000_canonical_baseline/migration.sql"
OLD_BASELINE_CHECKSUM="$(shasum -a 256 "$OLD_BASELINE_SQL" | awk '{print $1}')"
if [[ "$OLD_BASELINE_CHECKSUM" != "f9a2b98a7ec4fc519bbd38edcb95c76d29ecddeacbf4eb55a6eb2d8f01d2326e" ]]; then
  echo "❌ Archived Production-only baseline bytes do not match DB0 provenance." >&2
  exit 1
fi
insert_ledger_row "00000000000000_canonical_baseline" "$OLD_BASELINE_CHECKSUM" finished
insert_ledger_row "20241121_add_try_on_type" "0" finished

OLD_ROW_COUNT="$(psql "$TEST_DATABASE_URL" -X -Atc 'SELECT COUNT(*) FROM "_prisma_migrations"')"
UNIQUE_OLD_NAME_COUNT="$(psql "$TEST_DATABASE_URL" -X -Atc 'SELECT COUNT(DISTINCT migration_name) FROM "_prisma_migrations"')"
ROLLED_BACK_OLD_COUNT="$(psql "$TEST_DATABASE_URL" -X -Atc 'SELECT COUNT(*) FROM "_prisma_migrations" WHERE rolled_back_at IS NOT NULL')"
FINISHED_OLD_COUNT="$(psql "$TEST_DATABASE_URL" -X -Atc 'SELECT COUNT(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL')"
if [[ "$OLD_ROW_COUNT" != "56" || "$UNIQUE_OLD_NAME_COUNT" != "55" || "$ROLLED_BACK_OLD_COUNT" != "1" || "$FINISHED_OLD_COUNT" != "55" ]]; then
  echo "❌ Rehearsal ledger does not match DB0's 56-row / 55-name shape." >&2
  printf 'rows=%s unique_names=%s finished=%s rolled_back=%s\n' \
    "$OLD_ROW_COUNT" "$UNIQUE_OLD_NAME_COUNT" "$FINISHED_OLD_COUNT" "$ROLLED_BACK_OLD_COUNT" >&2
  exit 1
fi

OLD_ROW_SNAPSHOT="$(psql "$TEST_DATABASE_URL" -X -Atc "SELECT COALESCE(jsonb_agg(to_jsonb(m) ORDER BY id)::text, '[]') FROM \"_prisma_migrations\" m")"
snapshot_hash() { printf '%s' "$1" | shasum -a 256 | awk '{print $1}'; }
OLD_ROW_HASH="$(snapshot_hash "$OLD_ROW_SNAPSHOT")"
echo "PRODUCTION_LIKE_LEDGER rows=$OLD_ROW_COUNT unique_names=$UNIQUE_OLD_NAME_COUNT finished=$FINISHED_OLD_COUNT rolled_back=$ROLLED_BACK_OLD_COUNT sha256=$OLD_ROW_HASH"
echo "NOTE: IDs/timestamps are stable synthetic values; names, row/status shape, known Production-only entries, and the known applied SQL variant/checksums derive from DB0 provenance. No Production ledger was read during this rehearsal."

assert_old_rows_untouched() {
  local current_snapshot=""
  local current_hash=""
  local current_count=""
  current_snapshot="$(psql "$TEST_DATABASE_URL" -X -Atc "SELECT COALESCE(jsonb_agg(to_jsonb(m) ORDER BY id)::text, '[]') FROM \"_prisma_migrations\" m WHERE migration_name NOT IN ('$CANONICAL_BASELINE_MIGRATION', '$FUTURE_MIGRATION')")"
  current_hash="$(snapshot_hash "$current_snapshot")"
  current_count="$(psql "$TEST_DATABASE_URL" -X -Atc "SELECT COUNT(*) FROM \"_prisma_migrations\" WHERE migration_name NOT IN ('$CANONICAL_BASELINE_MIGRATION', '$FUTURE_MIGRATION')")"
  if [[ "$current_count" != "56" || "$current_hash" != "$OLD_ROW_HASH" ]]; then
    echo "❌ Historical ledger rows changed during the cutover rehearsal." >&2
    echo "   expected count/hash: 56/$OLD_ROW_HASH; actual: $current_count/$current_hash" >&2
    exit 1
  fi
}

assert_baseline_anchor() {
  local row=""
  row="$(psql "$TEST_DATABASE_URL" -X -At -F '|' -c "SELECT COUNT(*), COUNT(*) FILTER (WHERE checksum = '$BASELINE_CHECKSUM' AND finished_at IS NOT NULL AND rolled_back_at IS NULL) FROM \"_prisma_migrations\" WHERE migration_name = '$CANONICAL_BASELINE_MIGRATION'")"
  if [[ "$row" != "1|1" ]]; then
    echo "❌ Expected exactly one finished checksum-matching baseline adoption row; got $row." >&2
    exit 1
  fi
}

echo "→ Confirming active baseline with no adoption anchor fails closed against real disposable PostgreSQL"
set +e
ANCHOR_ABSENT_OUTPUT="$(VERCEL_ENV=production VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1 \
  DATABASE_URL="$TEST_DATABASE_URL" DATABASE_URL_UNPOOLED="$TEST_DATABASE_URL" \
  bash scripts/migrate-deploy.sh 2>&1)"
ANCHOR_ABSENT_EXIT=$?
set -e
if [[ "$ANCHOR_ABSENT_EXIT" -eq 0 ]] || ! grep -Fq "Canonical baseline adoption is required" <<<"$ANCHOR_ABSENT_OUTPUT"; then
  echo "❌ Real wrapper did not fail closed for the absent baseline anchor." >&2
  echo "$ANCHOR_ABSENT_OUTPUT" >&2
  exit 1
fi
if [[ "$(psql "$TEST_DATABASE_URL" -X -Atc 'SELECT COUNT(*) FROM "_prisma_migrations"')" != "56" ]]; then
  echo "❌ Anchor-absent wrapper attempt changed the 56-row history." >&2
  exit 1
fi
assert_old_rows_untouched
echo "✓ absent anchor failed before deployment; old ledger unchanged"

echo "→ Adopting only the exact frozen baseline via Prisma-supported resolve on the disposable database"
DATABASE_URL="$TEST_DATABASE_URL" DATABASE_URL_UNPOOLED="$TEST_DATABASE_URL" \
  npx prisma migrate resolve --applied "$CANONICAL_BASELINE_MIGRATION"
assert_baseline_anchor
assert_old_rows_untouched
if [[ "$(psql "$TEST_DATABASE_URL" -X -Atc 'SELECT COUNT(*) FROM "_prisma_migrations"')" != "57" ]]; then
  echo "❌ Expected 56 historical rows plus exactly one new baseline row." >&2
  exit 1
fi
echo "✓ 56 historical rows preserved; one finished baseline adoption row added"

echo "→ Verifying Prisma status after adoption"
DATABASE_URL="$TEST_DATABASE_URL" DATABASE_URL_UNPOOLED="$TEST_DATABASE_URL" \
  npx prisma migrate status
assert_baseline_anchor
assert_old_rows_untouched

echo "→ Running two idempotent Prisma deploys with the frozen baseline tree"
for deploy_attempt in 1 2; do
  echo "   deploy attempt $deploy_attempt"
  DATABASE_URL="$TEST_DATABASE_URL" DATABASE_URL_UNPOOLED="$TEST_DATABASE_URL" \
    npx prisma migrate deploy
  assert_baseline_anchor
  assert_old_rows_untouched
  if [[ "$(psql "$TEST_DATABASE_URL" -X -Atc 'SELECT COUNT(*) FROM "_prisma_migrations"')" != "57" ]]; then
    echo "❌ Baseline deploy was not idempotent; migration ledger row count changed." >&2
    exit 1
  fi
done

echo "→ Adding an ephemeral future delta and exercising the actual fail-closed deployment wrapper"
mkdir "$FUTURE_DIR"
FUTURE_CREATED=1
printf 'CREATE TABLE "Db2CutoverFutureDeltaProbe" ("id" INTEGER NOT NULL PRIMARY KEY);\n' > "$FUTURE_DIR/migration.sql"
VERCEL_ENV=production VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1 \
  DATABASE_URL="$TEST_DATABASE_URL" DATABASE_URL_UNPOOLED="$TEST_DATABASE_URL" \
  bash scripts/migrate-deploy.sh

FUTURE_ROW="$(psql "$TEST_DATABASE_URL" -X -At -F '|' -c "SELECT COUNT(*), COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL) FROM \"_prisma_migrations\" WHERE migration_name = '$FUTURE_MIGRATION'")"
FUTURE_TABLE_EXISTS="$(psql "$TEST_DATABASE_URL" -X -Atc "SELECT to_regclass('public.\"Db2CutoverFutureDeltaProbe\"') IS NOT NULL")"
if [[ "$FUTURE_ROW" != "1|1" || "$FUTURE_TABLE_EXISTS" != "t" ]]; then
  echo "❌ The normal future migration delta did not apply exactly once." >&2
  echo "   ledger=$FUTURE_ROW table_exists=$FUTURE_TABLE_EXISTS" >&2
  exit 1
fi
assert_baseline_anchor
assert_old_rows_untouched
if [[ "$(psql "$TEST_DATABASE_URL" -X -Atc 'SELECT COUNT(*) FROM "_prisma_migrations"')" != "58" ]]; then
  echo "❌ Expected 56 old rows + baseline anchor + one future delta row." >&2
  exit 1
fi

echo "✓ Production-like disposable cutover rehearsal passed: absent anchor fail-closed → resolve --applied → status → idempotent deploy → future delta deploy."
echo "CUTOVER_REHEARSAL rows_before=56 rows_after_anchor=57 rows_after_future_delta=58 old_rows_sha256=$OLD_ROW_HASH baseline_sha256=$BASELINE_CHECKSUM"
