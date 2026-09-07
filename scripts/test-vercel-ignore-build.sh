#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_SCRIPT="$SCRIPT_DIR/vercel-ignore-build.sh"
TEST_ROOT="$(mktemp -d)"
trap 'rm -rf "$TEST_ROOT"' EXIT

git -C "$TEST_ROOT" init -q
git -C "$TEST_ROOT" config user.email test@example.invalid
git -C "$TEST_ROOT" config user.name "Vercel Ignore Build Test"
printf '%s\n' baseline > "$TEST_ROOT/README.md"
git -C "$TEST_ROOT" add README.md
git -C "$TEST_ROOT" commit -q -m baseline

printf '%s\n' runtime > "$TEST_ROOT/src.ts"
git -C "$TEST_ROOT" add src.ts
git -C "$TEST_ROOT" commit -q -m runtime

if ! (cd "$TEST_ROOT" && VERCEL_ENV=preview bash "$BUILD_SCRIPT" >/dev/null); then
  echo "preview runtime change must skip the build (exit 0)" >&2
  exit 1
fi

if (cd "$TEST_ROOT" && VERCEL_ENV=production bash "$BUILD_SCRIPT" >/dev/null); then
  echo "production runtime change must continue the build (exit 1)" >&2
  exit 1
fi

mkdir -p "$TEST_ROOT/docs"
printf '%s\n' docs > "$TEST_ROOT/docs/audit.md"
git -C "$TEST_ROOT" add docs/audit.md
git -C "$TEST_ROOT" commit -q -m docs

if ! (cd "$TEST_ROOT" && VERCEL_ENV=production bash "$BUILD_SCRIPT" >/dev/null); then
  echo "production docs-only change must skip the build (exit 0)" >&2
  exit 1
fi

echo "vercel-ignore-build: PASS"
