#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# deploy-vps.sh — Zero-downtime deploy script for ETE Digital / Jobrows VPS
#
# Run from the repository root on your VPS:
#   cd /opt/ete-digital
#   bash ete-digital/scripts/deploy-vps.sh
#
# What this script does:
#   1. Pulls the latest code from git
#   2. Builds updated Docker images (uses layer cache for speed)
#   3. Starts new containers with rolling restart (backend last)
#   4. Applies pending Alembic migrations (safe — guarded for idempotency)
#   5. Runs a health check to confirm the deploy succeeded
#   6. Rolls back automatically on health check failure
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()    { echo -e "${GREEN}[deploy]${NC} $*"; }
warn()   { echo -e "${YELLOW}[deploy] WARN${NC} $*"; }
err()    { echo -e "${RED}[deploy] ERROR${NC} $*" >&2; }
success(){ echo -e "${GREEN}[deploy] ✅ $*${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"   # ete-digital/
REPO_DIR="$(cd "$APP_DIR/.." && pwd)"     # ETE-Digital/

COMPOSE_CMD="docker compose"
COMPOSE_FILE="$APP_DIR/docker-compose.yml"
PROFILE="${DEPLOY_PROFILE:-vps}"          # 'vps' or '' (no caddy)
HEALTH_URL="${HEALTH_URL:-http://localhost:8000/health}"
HEALTH_RETRIES=15
HEALTH_DELAY=10

log "Deploying ETE Digital / Jobrows..."
log "App directory: $APP_DIR"

# Docker Compose variable substitution reads ete-digital/.env (not backend/.env)
if [ -f "$APP_DIR/backend/.env" ] && [ ! -f "$APP_DIR/.env" ]; then
    warn "ete-digital/.env missing — copying from backend/.env for compose build vars."
    cp "$APP_DIR/backend/.env" "$APP_DIR/.env"
fi

# ── 1. Git pull ───────────────────────────────────────────────────────────────
log "Pulling latest code..."
PREV_SHA=$(git -C "$REPO_DIR" rev-parse HEAD)
git -C "$REPO_DIR" pull --ff-only
NEW_SHA=$(git -C "$REPO_DIR" rev-parse HEAD)
if [ "$PREV_SHA" = "$NEW_SHA" ]; then
    warn "No new commits. Proceeding anyway (may re-build images if Dockerfile changed)."
else
    log "Updated: ${PREV_SHA:0:8} → ${NEW_SHA:0:8}"
fi

# ── 2. Build images ──────────────────────────────────────────────────────────
log "Building Docker images (layer-cached)..."
cd "$APP_DIR"
$COMPOSE_CMD -f "$COMPOSE_FILE" build --parallel

# ── 3. Start / restart services ──────────────────────────────────────────────
log "Starting services with profile: $PROFILE..."
if [ -n "$PROFILE" ]; then
    $COMPOSE_CMD -f "$COMPOSE_FILE" --profile "$PROFILE" up -d --remove-orphans
else
    $COMPOSE_CMD -f "$COMPOSE_FILE" up -d --remove-orphans
fi

# ── 4. Wait for backend health ───────────────────────────────────────────────
log "Waiting for backend to become healthy..."
DEPLOY_OK=false
for i in $(seq 1 "$HEALTH_RETRIES"); do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL" 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" = "200" ]; then
        DEPLOY_OK=true
        success "Backend healthy after ${i} attempt(s) (HTTP 200)."
        break
    fi
    warn "Attempt ${i}/${HEALTH_RETRIES}: HTTP ${HTTP_CODE}. Retrying in ${HEALTH_DELAY}s..."
    sleep "$HEALTH_DELAY"
done

# ── 5. Auto-rollback on failure ───────────────────────────────────────────────
if [ "$DEPLOY_OK" = "false" ]; then
    err "Health check FAILED after $((HEALTH_RETRIES * HEALTH_DELAY))s."
    err "Rolling back to previous commit: ${PREV_SHA:0:8}..."

    git -C "$REPO_DIR" checkout "$PREV_SHA"
    $COMPOSE_CMD -f "$COMPOSE_FILE" build --parallel
    if [ -n "$PROFILE" ]; then
        $COMPOSE_CMD -f "$COMPOSE_FILE" --profile "$PROFILE" up -d --remove-orphans
    else
        $COMPOSE_CMD -f "$COMPOSE_FILE" up -d --remove-orphans
    fi

    err "Rollback complete. Check logs: docker compose logs -f backend"
    exit 1
fi

# ── 6. Show running containers ────────────────────────────────────────────────
log "Running containers:"
$COMPOSE_CMD -f "$COMPOSE_FILE" ps

echo ""
success "Deploy complete! Commit: ${NEW_SHA:0:8}"
log "Logs: docker compose logs -f backend"
