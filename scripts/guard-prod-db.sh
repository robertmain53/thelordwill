#!/usr/bin/env bash
set -euo pipefail

ENV_FILE="${ENV_FILE:-.env}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Refusing: $ENV_FILE not found."
  exit 1
fi

db_url="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | head -n1 | cut -d'=' -f2- | tr -d '\r' | sed 's/^"//; s/"$//')"

if [[ -z "$db_url" ]]; then
  echo "Refusing: DATABASE_URL is missing in $ENV_FILE."
  exit 1
fi

if [[ "$db_url" == *"supabase.com"* ]]; then
  echo "Refusing: DATABASE_URL points to Supabase. Use local DB for migrate dev."
  exit 1
fi
