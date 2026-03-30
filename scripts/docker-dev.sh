#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Starting services..."
docker compose up -d --build

echo "==> Waiting for postgres to be ready..."
docker compose exec postgres sh -c 'until pg_isready -U meta_tsundr; do sleep 1; done'

echo "==> Running database migrations..."
docker compose exec web npx prisma migrate deploy 2>/dev/null \
  || docker compose exec web npx prisma db push --accept-data-loss

echo "==> All services running. Tailing logs (Ctrl+C to stop)..."
docker compose logs -f
