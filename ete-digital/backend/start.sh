#!/usr/bin/env bash
# =============================================================================
# Start script for Render deployment
# Runs Alembic migrations before starting the API server
# =============================================================================
set -e

echo "==> [start.sh] DATABASE_URL: ${DATABASE_URL:0:50}..."

echo "==> [start.sh] Running Alembic migrations..."
alembic upgrade head
echo "==> [start.sh] Migrations complete."

echo "==> [start.sh] Starting uvicorn..."
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}"
