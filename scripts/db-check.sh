#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "Set DATABASE_URL before running this script."
  exit 1
fi

cat <<'SQL' >/tmp/prisma-health.sql
SELECT 1;
SQL

npx prisma db execute --url "$DATABASE_URL" --file /tmp/prisma-health.sql
