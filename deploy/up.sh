#!/usr/bin/env bash
# Build and start the production stack. Re-run after every `git pull`.
set -euo pipefail
cd "$(dirname "$0")/.."

for v in SITE_DOMAIN ADMIN_PASSWORD SECRET_KEY POSTGRES_PASSWORD; do
  grep -qE "^${v}=.+" .env || { echo "!! ${v} is not set in .env — see DEPLOY.md"; exit 1; }
done

# Refuse to publish the database to the world. This is the one mistake that
# turns a pitch site into an incident.
for v in DB_BIND API_BIND WEB_BIND; do
  grep -qE "^${v}=127\.0\.0\.1:" .env || { echo "!! ${v}=127.0.0.1: must be set in .env — see DEPLOY.md"; exit 1; }
done

COMPOSE="docker compose -f docker-compose.yml -f deploy/docker-compose.prod.yml"
mkdir -p deploy/backups

echo "==> Building (this takes a few minutes on a small server)"
$COMPOSE build
echo "==> Starting"
$COMPOSE up -d
echo "==> Waiting for health"
sleep 10
$COMPOSE ps
echo
echo "==> Public surface (only caddy should be 0.0.0.0):"
$COMPOSE config | grep -E 'host_ip|published' | paste - - | sed 's/^/    /'
