#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "❌ 缺少 .env，请从 .env.example 复制并填入配置"
  exit 1
fi

echo "→ prisma generate"
npx prisma generate --no-hints 2>/dev/null || npx prisma generate

if [[ -n "${PORT:-}" ]]; then
  echo "→ http://localhost:${PORT}"
  exec npx next dev --port "$PORT"
fi

echo "→ http://localhost:3000 (占用时自动换端口)"
exec npx next dev
