#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/migration-baseline-contract.sh"
BASELINE_MIGRATION_SQL="$REPO_ROOT/prisma/migrations/$CANONICAL_BASELINE_MIGRATION/migration.sql"
assert_canonical_baseline_contract "$REPO_ROOT"

# ============================================================
# prisma migrate deploy — pooled/direct PostgreSQL safety checks
# ============================================================
# SAFETY BOUNDARY
#   This script is always on the Vercel `npm run build` path, but it is a
#   no-op outside an explicitly authorized production build. Preview, CI, and
#   local builds therefore remain safe while production releases fail closed.
# ============================================================
# PROBLEM
#   A transaction-mode pooler can leak Prisma's session-level advisory lock
#   (pg_advisory_lock(72707369)). The leaked
#   lock blocks every build until Prisma's hardcoded 10s timeout fires
#   (P1002). The timeout is NOT configurable, so retries alone never help.
#
# FIX LAYERS (defense in depth)
#   1. prisma.config.ts forces the CLI onto a DIRECT (unpooled) connection,
#      so the lock is tied to a real backend that releases it on disconnect.
#   2. Classify `migrate status` strictly. If a future baseline is active,
#      require its successful adoption row before permitting any deploy.
#      Skip `migrate deploy` when up to date, deploy only for explicit pending
#      migrations, and fail closed for every other result.
#   3. Clear stale advisory locks held by idle backends (>60s) before
#      migrating — recovers from any pre-existing leaked lock on the first
#      build after this change lands.
#   4. Retry with jitter for transient provider connection failures.
#
# REQUIRED ENV
#   DATABASE_URL_UNPOOLED  — direct PostgreSQL connection (a deployment
#                             integration may provide this automatically. Falls back to
#                             DIRECT_DATABASE_URL / DIRECT_URL.
#   DATABASE_URL           — runtime/pooled connection (only used to verify something
#                             is configured; actual migration URL comes from
#                             prisma.config.ts).
# ============================================================

# Load .env for local dev. On Vercel, env vars are already in the process
# environment and .env does not exist, so this block is a no-op there.
# We only set vars that are NOT already exported (never override Vercel).
if [[ -f .env ]]; then
  while IFS='=' read -r key value; do
    [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]] && continue
    # Strip surrounding whitespace
    key="${key// /}"
    # Strip surrounding quotes from the value
    value="${value#\"}" ; value="${value%\"}"
    value="${value#\'}" ; value="${value%\'}"
    # Only export if not already set in the environment
    if [[ -z "${!key:-}" ]]; then
      export "$key=$value"
    fi
  done < .env
fi

if [[ "${VERCEL_ENV:-}" != "production" ]]; then
  echo "✓ Non-production environment (${VERCEL_ENV:-local}) — skipping production migrations"
  exit 0
fi

if [[ "${VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED:-}" != "1" ]]; then
  echo "❌ Production migration requires VISUTRY_PRODUCTION_MIGRATION_AUTHORIZED=1"
  echo "   Use the explicitly authorized production release path; refusing to migrate."
  exit 1
fi

echo "✓ Explicit production migration authorization confirmed"

DIRECT_URL="${DATABASE_URL_UNPOOLED:-${DIRECT_DATABASE_URL:-${DIRECT_URL:-}}}"

if [[ -z "$DIRECT_URL" ]]; then
  echo "❌ No direct (unpooled) database URL found."
  echo "   Set DATABASE_URL_UNPOOLED in the deployment environment"
  echo "   or DIRECT_DATABASE_URL / DIRECT_URL."
  echo "   Migrations via a transaction-pooled DATABASE_URL may hit P1002"
  echo "   advisory-lock timeouts."
  exit 1
fi
echo "→ Migrations will use a direct (unpooled) connection via prisma.config.ts"

# --- Step 1: Classify migration status fail-closed --------------------------
# `migrate status` only reads the _prisma_migrations table — it does NOT
# acquire the advisory lock, so it cannot itself cause P1002. Skipping the
# deploy when there is nothing to do avoids the lock entirely on most builds.
echo "→ Checking migration status..."
STATUS_OUTPUT=""
STATUS_EXIT=0
set +e
STATUS_OUTPUT=$(npx prisma migrate status 2>&1)
STATUS_EXIT=$?
set -e
echo "$STATUS_OUTPUT" | sed 's/^/  /'

echo "→ Canonical baseline migration is present: $CANONICAL_BASELINE_MIGRATION"
ANCHOR_OUTPUT=""
ANCHOR_EXIT=0
set +e
ANCHOR_OUTPUT=$(npx tsx scripts/check-migration-baseline-anchor.ts "$CANONICAL_BASELINE_MIGRATION" 2>&1)
ANCHOR_EXIT=$?
set -e
echo "$ANCHOR_OUTPUT" | sed 's/^/  /'

if [[ "$ANCHOR_EXIT" -ne 0 ]] || ! echo "$ANCHOR_OUTPUT" | grep -Fxq "MIGRATION_BASELINE_ANCHOR=applied"; then
  echo "❌ Canonical baseline adoption is required before migrations can deploy."
  echo "   The baseline ledger row must be uniquely finished and not rolled back; refusing to run migrate deploy."
  exit 1
fi

# Match Prisma status-level failure signals, not arbitrary migration names.
# Archived history legitimately includes `...failure_reason` in its name, so
# a broad substring search would reject safe future deltas after the baseline.
UNSAFE_STATUS_PATTERN='(^Error([[:space:]:]|$)|^P[0-9]{4}([:[:space:]]|$)|^The database schema is not in sync|^Migration .*checksum mismatch|^A migration failed to apply|^The following migration.*(failed|rolled back)|^Migration .*rolled back)'
if [[ "$STATUS_EXIT" -eq 0 ]] \
  && echo "$STATUS_OUTPUT" | grep -Eqi "database schema is up to date" \
  && ! echo "$STATUS_OUTPUT" | grep -Eqi "$UNSAFE_STATUS_PATTERN"; then
  echo "✓ Schema is up to date — skipping migrate deploy"
  exit 0
elif [[ "$STATUS_EXIT" -eq 1 ]] \
  && echo "$STATUS_OUTPUT" | grep -Eqi "not yet been applied" \
  && ! echo "$STATUS_OUTPUT" | grep -Eqi "$UNSAFE_STATUS_PATTERN"; then
  # Prisma 7.1 can report intentionally archived pre-baseline ledger names as
  # absent from the active tree. A future delta is safe only when the common
  # migration is exactly the adopted baseline; there is no legacy fallback.
  if ! echo "$STATUS_OUTPUT" | grep -Eqi "^The last common migration is: ${CANONICAL_BASELINE_MIGRATION}[[:space:]]*$"; then
    echo "❌ Pending status does not share the adopted canonical baseline as its last common migration; refusing to deploy."
    exit 1
  fi
  echo "→ Future migration delta detected after the adopted baseline — proceeding to migrate deploy"
else
  echo "❌ Migration status was not a recognized safe state (exit ${STATUS_EXIT}); refusing to run migrate deploy."
  echo "   Resolve the migration state explicitly before retrying."
  exit 1
fi

# --- Step 2: Clear stale advisory locks before an authorized deploy ----------
# Recovers from any leaked lock left by previous pooled-connection builds.
# Non-fatal: if the cleanup itself fails, migrate deploy still has its own
# bounded retries. It is deliberately after the baseline/status guards so an
# unsafe history never causes this cleanup side effect.
echo "→ Checking for stale migration advisory locks..."
if npx tsx scripts/clear-stale-migration-locks.ts; then
  :
else
  echo "  ⚠️ stale lock cleanup reported a failure (continuing anyway)"
fi

# --- Step 3: Run migrate deploy with retries + jitter -----------------------
MAX_RETRIES=3
for attempt in $(seq 1 "$MAX_RETRIES"); do
  echo "→ prisma migrate deploy (attempt ${attempt}/${MAX_RETRIES})"
  if npx prisma migrate deploy; then
    echo "✓ migrate deploy succeeded"
    exit 0
  fi

  if [[ $attempt -lt $MAX_RETRIES ]]; then
    # Jitter (8–15s) so concurrent Vercel builds don't retry in lockstep.
    DELAY=$(( RANDOM % 8 + 8 ))
    echo "⚠️ attempt ${attempt} failed, retrying in ${DELAY}s..."
    sleep "$DELAY"
  fi
done

echo "❌ prisma migrate deploy failed after ${MAX_RETRIES} attempts"
echo "   Diagnostic steps:"
echo "     1. Confirm DATABASE_URL_UNPOOLED is set in the deployment environment."
echo "     2. Run: npx tsx scripts/clear-stale-migration-locks.ts"
echo "     3. Check the configured PostgreSQL provider for long-running idle sessions."
exit 1
