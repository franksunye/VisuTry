#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# prisma migrate deploy — Neon/Vercel-safe (P1002 defense in depth)
# ============================================================
# PROBLEM
#   Neon's pooled connection (PgBouncer transaction mode) leaks Prisma's
#   session-level advisory lock (pg_advisory_lock(72707369)). The leaked
#   lock blocks every build until Prisma's hardcoded 10s timeout fires
#   (P1002). The timeout is NOT configurable, so retries alone never help.
#
# FIX LAYERS (defense in depth)
#   1. prisma.config.ts forces the CLI onto a DIRECT (unpooled) connection,
#      so the lock is tied to a real backend that releases it on disconnect.
#   2. Skip `migrate deploy` entirely when `migrate status` reports the
#      schema is up to date — avoids acquiring the lock at all (most builds).
#   3. Clear stale advisory locks held by idle backends (>60s) before
#      migrating — recovers from any pre-existing leaked lock on the first
#      build after this change lands.
#   4. Retry with jitter for transient Neon cold-start failures.
#
# REQUIRED ENV
#   DATABASE_URL_UNPOOLED  — direct Neon connection (Vercel Neon integration
#                             provides this automatically). Falls back to
#                             DIRECT_DATABASE_URL / DIRECT_URL.
#   DATABASE_URL           — pooled connection (only used to verify something
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

DIRECT_URL="${DATABASE_URL_UNPOOLED:-${DIRECT_DATABASE_URL:-${DIRECT_URL:-}}}"

if [[ -z "$DIRECT_URL" ]]; then
  echo "❌ No direct (unpooled) database URL found."
  echo "   Set DATABASE_URL_UNPOOLED on Vercel (the Neon integration provides"
  echo "   this automatically) or DIRECT_DATABASE_URL in your environment."
  echo "   Migrations via the pooled DATABASE_URL will hit P1002 advisory"
  echo "   lock timeouts on Neon/PgBouncer."
  exit 1
fi
echo "→ Migrations will use a direct (unpooled) connection via prisma.config.ts"

# --- Step 1: Clear stale advisory locks held by idle backends ---------------
# Recovers from any leaked lock left by previous pooled-connection builds.
# Non-fatal: if the cleanup itself fails, we still attempt migrate deploy.
echo "→ Checking for stale migration advisory locks..."
if npx tsx scripts/clear-stale-migration-locks.ts; then
  :
else
  echo "  ⚠️ stale lock cleanup reported a failure (continuing anyway)"
fi

# --- Step 2: Skip if no pending migrations ----------------------------------
# `migrate status` only reads the _prisma_migrations table — it does NOT
# acquire the advisory lock, so it cannot itself cause P1002. Skipping the
# deploy when there is nothing to do avoids the lock entirely on most builds.
echo "→ Checking migration status..."
STATUS_OUTPUT=$(npx prisma migrate status 2>&1 || true)
echo "$STATUS_OUTPUT" | sed 's/^/  /'

if echo "$STATUS_OUTPUT" | grep -qi "not yet been applied"; then
  echo "→ Pending migrations detected — proceeding to migrate deploy"
elif echo "$STATUS_OUTPUT" | grep -qi "up to date"; then
  echo "✓ Schema is up to date — skipping migrate deploy"
  exit 0
else
  echo "→ Migration status inconclusive (possibly an error above) —"
  echo "  attempting migrate deploy with retries"
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
echo "     1. Confirm DATABASE_URL_UNPOOLED is set on Vercel (Neon integration)."
echo "     2. Run: npx tsx scripts/clear-stale-migration-locks.ts"
echo "     3. Check the Neon console for long-running idle sessions."
exit 1
