#!/bin/bash
set -e

echo "Pulling latest code..."
git pull origin main

echo "Building images..."
docker compose -f docker-compose.prod.yml --env-file .env.production build --no-cache

echo "Starting services..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo "Running migrations..."
docker compose -f docker-compose.prod.yml exec -T admin-service alembic upgrade head
docker compose -f docker-compose.prod.yml exec -T auth-service alembic upgrade head
docker compose -f docker-compose.prod.yml exec -T billing-service alembic upgrade head
docker compose -f docker-compose.prod.yml exec -T analytics-service alembic upgrade head
docker compose -f docker-compose.prod.yml exec -T menu-service alembic upgrade head

echo "Checking services..."
docker compose -f docker-compose.prod.yml ps

echo "Done!"
