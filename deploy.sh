#!/bin/bash
set -euo pipefail

COMPOSE="docker compose -f docker-compose.prod.yml --env-file .env.production"

echo "▶ Pulling latest code..."
git pull origin main

echo "▶ Building images (no cache)..."
$COMPOSE build --no-cache

echo "▶ Starting services..."
$COMPOSE up -d

echo "▶ Service status:"
$COMPOSE ps
