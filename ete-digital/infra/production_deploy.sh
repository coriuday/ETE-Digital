#!/usr/bin/env bash
# production_deploy.sh — Pull, migrate, build, restart (systemd stack on jobsrow.com VPS)
set -euo pipefail

REPO="/home/etedigital/jobsrow"
APP="$REPO/ete-digital"
BACKEND="$APP/backend"
FRONTEND="$APP/frontend"

echo "=== [1/6] Git pull ==="
cd "$REPO"
PREV=$(git rev-parse HEAD)
git pull --ff-only
NEW=$(git rev-parse HEAD)
echo "Updated: ${PREV:0:8} -> ${NEW:0:8}"

echo "=== [2/6] Backend dependencies ==="
cd "$BACKEND"
source .venv/bin/activate
# Always refresh security pins inside venv (never system pip).
# Full `pip install -r requirements.txt` is skipped on Py3.14 venvs because
# pydantic-core may fail to build; targeted pins use pre-built wheels.
.venv/bin/pip install -q --upgrade --force-reinstall --no-cache-dir \
  "PyJWT==2.13.0" "cryptography==49.0.0"

echo "=== [3/6] Alembic migrations ==="
alembic upgrade head

echo "=== [4/6] Frontend build ==="
cd "$FRONTEND"
if [ -f package-lock.json ]; then
  npm ci --silent
else
  npm install --silent
fi
VITE_API_URL=https://jobsrow.com npm run build

echo "=== [5/6] Restart services ==="
systemctl restart jobsrow-backend jobsrow-frontend
sleep 5

echo "=== [6/6] Health checks ==="
curl -sf http://127.0.0.1:8000/health && echo " backend OK"
curl -sf -o /dev/null -w "frontend HTTP %{http_code}\n" http://127.0.0.1:3000/
systemctl is-active jobsrow-backend jobsrow-frontend

echo "=== Deploy complete ==="
