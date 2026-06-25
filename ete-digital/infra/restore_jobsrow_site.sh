#!/usr/bin/env bash
# Restore jobsrow.com public access: start services, open local firewall, health checks.
set -euo pipefail

echo "=== [1/5] Start services ==="
systemctl start postgresql valkey nginx jobsrow-backend jobsrow-frontend 2>/dev/null || true
systemctl enable nginx jobsrow-backend jobsrow-frontend 2>/dev/null || true

echo "=== [2/5] Open local firewall (if active) ==="
if command -v firewall-cmd >/dev/null 2>&1 && systemctl is-active firewalld >/dev/null 2>&1; then
  firewall-cmd --permanent --add-service=http || true
  firewall-cmd --permanent --add-service=https || true
  firewall-cmd --permanent --add-service=ssh || true
  firewall-cmd --reload || true
fi
if command -v ufw >/dev/null 2>&1; then
  ufw allow 22/tcp || true
  ufw allow 80/tcp || true
  ufw allow 443/tcp || true
fi

echo "=== [3/5] Service status ==="
systemctl is-active nginx jobsrow-backend jobsrow-frontend || true
ss -tlnp | grep -E ':80|:443|:8000|:3000' || true

echo "=== [4/5] Local health ==="
curl -sf http://127.0.0.1:8000/health && echo " backend OK" || echo " backend FAIL"
curl -sf -o /dev/null -w "frontend HTTP %{http_code}\n" http://127.0.0.1:3000/ || true
curl -sf -o /dev/null -w "nginx HTTP %{http_code}\n" http://127.0.0.1/ || true

echo "=== [5/5] Deploy latest + unblock users (if repo present) ==="
if [[ -f /home/etedigital/jobsrow/ete-digital/infra/apply_email_fix_vps.sh ]]; then
  cd /home/etedigital/jobsrow
  git pull --ff-only || true
  bash ete-digital/infra/apply_email_fix_vps.sh || bash ete-digital/infra/production_deploy.sh
else
  echo "Repo not found — services started only."
fi

echo "=== Done. Test https://jobsrow.com in browser ==="
