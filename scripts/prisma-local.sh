#!/usr/bin/env bash
set -euo pipefail

unset DATABASE_URL DIRECT_URL SHADOW_DATABASE_URL
set -a
source .env
set +a

exec npx prisma "$@"
