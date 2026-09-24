#!/usr/bin/env bash
# Pull the latest code from GitHub and reload the site.
# Postgres and Redis data live in Docker volumes (sajawat_postgres_data,
# sajawat_redis_data). This script never removes those volumes and never
# runs prisma migrate reset or the seed (the seed deletes catalog rows).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

exec 9>/tmp/sajawat-update.lock
if ! flock -n 9; then
  echo "Another update is already running."
  exit 1
fi

if [[ ! -f .env ]]; then
  echo "Missing .env in $ROOT. Create it before updating."
  exit 1
fi

if [[ ! -f deploy/postgres/ssl/server.crt || ! -f deploy/postgres/ssl/server.key ]]; then
  echo "Postgres TLS certificate is missing. Run: bash deploy/init-postgres-ssl.sh"
  exit 1
fi

BEFORE="$(git rev-parse HEAD)"
echo "Pulling latest code..."
git pull --ff-only
AFTER="$(git rev-parse HEAD)"

# Bash reads this file line by line. If git pull replaced it, start over
# so the rest of the update uses the new script.
if [[ "$BEFORE" != "$AFTER" && "${SAJAWAT_UPDATE_REEXEC:-}" != "1" ]]; then
  echo "Update script changed. Continuing with the new copy..."
  export SAJAWAT_UPDATE_REEXEC=1
  exec "$0" "$@"
fi

echo "Starting Postgres and Redis (existing volumes are kept)..."
docker compose -f docker-compose.prod.yml up -d --wait

echo "Installing dependencies..."
npm ci

echo "Generating Prisma client..."
npx prisma generate

echo "Applying migrations (adds new changes only; does not wipe the database)..."
npx prisma migrate deploy

echo "Building the site..."
NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=2048}" npm run build

echo "Reloading the site..."
if pm2 describe sajawat >/dev/null 2>&1; then
  pm2 reload deploy/ecosystem.config.cjs --update-env
else
  pm2 start deploy/ecosystem.config.cjs
fi
pm2 save

echo "Update finished. Database volume sajawat_postgres_data was not removed."
