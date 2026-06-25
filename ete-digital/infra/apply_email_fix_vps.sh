#!/usr/bin/env bash
# Apply email verification fix on VPS: pull, build, unblock stuck users, restart.
set -euo pipefail

REPO="/home/etedigital/jobsrow"
APP="${REPO}/ete-digital"
SCRIPT="${APP}/infra/unblock_unverified_users.sh"

echo "=== [1/3] Git pull + production deploy ==="
bash "${APP}/infra/production_deploy.sh"

echo "=== [2/3] Unblock unverified email/password users ==="
if [[ -f "${SCRIPT}" ]]; then
  bash "${SCRIPT}" --yes
else
  echo "WARN: ${SCRIPT} missing — skipping unblock"
fi

echo "=== [3/3] Health check ==="
curl -sf http://127.0.0.1:8000/health
echo
curl -sf -o /dev/null -w "frontend HTTP %{http_code}\n" http://127.0.0.1:3000/
echo "=== Email fix deployed ==="
