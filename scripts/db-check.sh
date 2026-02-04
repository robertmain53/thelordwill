#!/usr/bin/env bash
set -euo pipefail

# Use non-pooling URL for direct queries (avoids pgbouncer prepared statement issues)
# Falls back to POSTGRES_PRISMA_URL or DATABASE_URL if non-pooling not set
DB_URL="${POSTGRES_URL_NON_POOLING:-${POSTGRES_PRISMA_URL:-${DATABASE_URL:-}}}"

if [[ -z "$DB_URL" ]]; then
  echo "Set POSTGRES_URL_NON_POOLING, POSTGRES_PRISMA_URL, or DATABASE_URL before running this script."
  exit 1
fi

cat <<'SQL' >/tmp/prisma-health.sql
SELECT 1;
SQL

npx prisma db execute --url "$DB_URL" --file /tmp/prisma-health.sql
