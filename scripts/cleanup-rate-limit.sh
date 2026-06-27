#!/bin/bash
# Cleanup expired rate limit entries
# Usage: ./scripts/cleanup-rate-limit.sh
# Or schedule via cron: */5 * * * * /path/to/scripts/cleanup-rate-limit.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

if [ -z "${CLEANUP_SECRET:-}" ]; then
  echo "Error: CLEANUP_SECRET env var must be set"
  exit 1
fi

response=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "Authorization: Bearer ${CLEANUP_SECRET}" \
  http://localhost:3000/api/admin/cleanup-rate-limit)

http_code=$(echo "$response" | tail -1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
  deleted=$(echo "$body" | node -e "process.stdin.on('data', d => { const j = JSON.parse(d); console.log(j.data?.deleted ?? 0); })")
  echo "Cleaned up ${deleted} expired rate limit entries"
else
  echo "Cleanup failed (HTTP ${http_code}): ${body}"
  exit 1
fi
