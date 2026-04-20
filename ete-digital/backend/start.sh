#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# start.sh — Production startup script for Render
#
# 1. Waits for PostgreSQL to accept connections (up to 60s)
# 2. Prints the current Alembic revision
# 3. Applies pending migrations (alembic upgrade head)
# 4. Starts the FastAPI/Uvicorn server
#
# Exit codes:
#   0  — server started successfully
#   1  — DB unreachable after timeout
#   2  — Alembic migration failed
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Colours (works on Render's log terminal) ──────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'  # No Colour

log()  { echo -e "${GREEN}[start.sh]${NC} $*"; }
warn() { echo -e "${YELLOW}[start.sh] WARN${NC} $*"; }
err()  { echo -e "${RED}[start.sh] ERROR${NC} $*" >&2; }

# ── 1. Wait for DB ────────────────────────────────────────────────────────────
MAX_RETRIES=30
RETRY_DELAY=2
DB_READY=false

log "Waiting for database to be ready (max ${MAX_RETRIES} attempts × ${RETRY_DELAY}s)..."

for i in $(seq 1 "$MAX_RETRIES"); do
    # Use Python to test the connection — avoids needing psql client installed
    if python - <<'EOF' 2>/dev/null
import os, sys, time
import psycopg2
url = os.environ.get("DATABASE_URL", "")
# Convert asyncpg → psycopg2 URL for this check
url = url.replace("+asyncpg", "").replace("?ssl=require", "?sslmode=require").replace("&ssl=require", "&sslmode=require")
try:
    conn = psycopg2.connect(url, connect_timeout=5)
    conn.close()
    sys.exit(0)
except Exception as e:
    sys.exit(1)
EOF
    then
        DB_READY=true
        log "Database is ready after ${i} attempt(s)."
        break
    fi

    warn "Database not ready (attempt ${i}/${MAX_RETRIES}). Retrying in ${RETRY_DELAY}s..."
    sleep "$RETRY_DELAY"
done

if [ "$DB_READY" = false ]; then
    err "Database did not become ready after $((MAX_RETRIES * RETRY_DELAY))s. Aborting."
    exit 1
fi

# ── 2. Show current revision ──────────────────────────────────────────────────
log "Current Alembic revision:"
alembic current || warn "Could not determine current revision (first deploy?)."

# ── 3. Apply migrations ───────────────────────────────────────────────────────
log "Applying pending Alembic migrations..."

if ! alembic upgrade head; then
    err "alembic upgrade head FAILED. Server will NOT start."
    err "Run 'alembic history' and 'alembic current' to diagnose."
    err "To rollback one step: alembic downgrade -1"
    exit 2
fi

log "All migrations applied successfully."

# ── 4. Print final revision ───────────────────────────────────────────────────
log "Active revision after upgrade:"
alembic current

# ── 5. Start server ───────────────────────────────────────────────────────────
PORT="${PORT:-8000}"
log "Starting Uvicorn on 0.0.0.0:${PORT}..."

exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "$PORT" \
    --workers 1 \
    --log-level info \
    --access-log
