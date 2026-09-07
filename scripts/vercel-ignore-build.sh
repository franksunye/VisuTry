#!/usr/bin/env bash
set -u

# Vercel Ignored Build Step semantics:
#   exit 0 => skip build
#   exit 1 => continue build
#
# Skip only when every changed path is under docs/. Any uncertainty fails safe
# and allows Vercel to build.

# Preview deployments are intentionally excluded from the full build pipeline
# to avoid paying for non-production builds. Production remains fail-safe and
# continues through the docs-only decision below.
if [ "${VERCEL_ENV:-}" != "production" ]; then
  echo "Non-production environment (${VERCEL_ENV:-unknown}); skip Vercel build."
  exit 0
fi

if ! git rev-parse HEAD^ >/dev/null 2>&1; then
  echo "No parent commit available; continue Vercel build."
  exit 1
fi

CHANGED_FILES="$(git diff --name-only HEAD^ HEAD)"

if [ -z "$CHANGED_FILES" ]; then
  echo "No changed files detected; skip Vercel build."
  exit 0
fi

NON_DOCS="$(printf '%s\n' "$CHANGED_FILES" | grep -v '^docs/' || true)"

if [ -n "$NON_DOCS" ]; then
  echo "Runtime/repository changes detected; continue Vercel build:"
  printf '%s\n' "$NON_DOCS"
  exit 1
fi

echo "Docs-only change detected; skip Vercel build."
exit 0
