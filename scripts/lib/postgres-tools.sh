#!/usr/bin/env bash

# Resolve PostgreSQL tooling explicitly for DB-P3 rehearsals. Homebrew's
# versioned PostgreSQL formulae are keg-only, so PATH alone is not reliable.

resolve_p3_pg_bin_dir() {
  if [[ -n "${P3_PG_BIN_DIR:-}" ]]; then
    printf '%s\n' "$P3_PG_BIN_DIR"
    return 0
  fi

  local candidate
  for candidate in \
    "/opt/homebrew/opt/postgresql@17/bin" \
    "/usr/local/opt/postgresql@17/bin"; do
    if [[ -x "$candidate/pg_config" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done

  local initdb_path
  initdb_path="$(command -v initdb 2>/dev/null || true)"
  if [[ -n "$initdb_path" ]]; then
    dirname "$initdb_path"
    return 0
  fi

  echo "❌ No PostgreSQL tooling found; set P3_PG_BIN_DIR explicitly." >&2
  return 1
}

p3_pg_major() {
  local binary="$1"
  local version
  version="$($binary --version 2>/dev/null | sed -E 's/.* ([0-9]+)\.[0-9]+.*/\1/')"
  if [[ ! "$version" =~ ^[0-9]+$ ]]; then
    echo "❌ Could not determine PostgreSQL major version for $binary." >&2
    return 1
  fi
  printf '%s\n' "$version"
}

require_p3_pg_tools() {
  local bin_dir="$1"
  shift

  local binary
  local major
  local reference_major=""
  for binary in "$@"; do
    if [[ ! -x "$bin_dir/$binary" ]]; then
      echo "❌ Missing PostgreSQL binary: $bin_dir/$binary" >&2
      return 1
    fi
    major="$(p3_pg_major "$bin_dir/$binary")"
    if [[ -z "$reference_major" ]]; then
      reference_major="$major"
    elif [[ "$major" != "$reference_major" ]]; then
      echo "❌ PostgreSQL tooling major versions do not match in $bin_dir." >&2
      return 1
    fi
  done

  if [[ -n "${P3_SOURCE_POSTGRES_MAJOR:-}" ]] &&
    [[ "$reference_major" -lt "$P3_SOURCE_POSTGRES_MAJOR" ]]; then
    echo "❌ PostgreSQL tooling major $reference_major is older than source major $P3_SOURCE_POSTGRES_MAJOR; set P3_PG_BIN_DIR to compatible tooling." >&2
    return 1
  fi

  printf '%s\n' "$reference_major"
}
