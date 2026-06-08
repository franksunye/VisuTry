#!/usr/bin/env bash
set -euo pipefail

# Prisma migrate needs a direct Postgres connection. Neon/Vercel poolers can fail
# advisory locks (P1002), especially when multiple deployments run at once.
MIGRATION_URL="${DATABASE_URL_UNPOOLED:-${DIRECT_DATABASE_URL:-}}"

if [[ -n "$MIGRATION_URL" ]]; then
  export DATABASE_URL="$MIGRATION_URL"
  echo "→ prisma migrate deploy (direct / unpooled connection)"
else
  echo "→ prisma migrate deploy (DATABASE_URL)"
  echo "  tip: set DATABASE_URL_UNPOOLED on Vercel for reliable Neon migrations"
fi

MAX_RETRIES=5
RETRY_DELAY=12

for attempt in $(seq 1 "$MAX_RETRIES"); do
  if npx prisma migrate deploy; then
    exit 0
  fi

  if [[ $attempt -lt $MAX_RETRIES ]]; then
    echo "⚠️ migrate deploy failed (attempt ${attempt}/${MAX_RETRIES}), retrying in ${RETRY_DELAY}s..."
    sleep "$RETRY_DELAY"
  fi
done

echo "❌ prisma migrate deploy failed after ${MAX_RETRIES} attempts"
exit 1
