#!/usr/bin/env bash

# Frozen identity for the canonical baseline. This explicit flag is part of
# the cutover contract: once active, a missing or renamed baseline is an error,
# never a signal to fall back to the historical migration tree.
CANONICAL_BASELINE_MIGRATION="20261003000000_canonical_schema_baseline"
CANONICAL_BASELINE_CUTOVER_ACTIVE="1"

assert_canonical_baseline_contract() {
  local repo_root="${1:?repository root is required}"
  local migration_sql="$repo_root/prisma/migrations/$CANONICAL_BASELINE_MIGRATION/migration.sql"

  if [[ "$CANONICAL_BASELINE_CUTOVER_ACTIVE" == "1" && ! -s "$migration_sql" ]]; then
    echo "❌ Canonical migration cutover is active, but $CANONICAL_BASELINE_MIGRATION/migration.sql is missing or empty." >&2
    echo "   Refusing to fall back to legacy migrations; restore the frozen baseline path before continuing." >&2
    return 1
  fi
}
