#!/usr/bin/env bash
# vps_apply_security_pins.sh — Install security pins into the app venv (not system Python)
# Run as root on the jobsrow.com VPS:
#   sudo bash /home/etedigital/jobsrow/ete-digital/infra/vps_apply_security_pins.sh
set -euo pipefail

BACKEND="/home/etedigital/jobsrow/ete-digital/backend"
VENV_PY="$BACKEND/.venv/bin/python"
VENV_PIP="$BACKEND/.venv/bin/pip"

if [[ ! -x "$VENV_PY" ]]; then
  echo "ERROR: venv not found at $BACKEND/.venv"
  exit 1
fi

echo "=== Installing security pins into venv ==="
"$VENV_PIP" install --upgrade --force-reinstall --no-cache-dir \
  "PyJWT==2.13.0" \
  "cryptography==49.0.0"

echo "=== Verifying packages load from venv ==="
"$VENV_PY" -c "
import jwt, cryptography
assert '.venv' in jwt.__file__, f'PyJWT not in venv: {jwt.__file__}'
assert '.venv' in cryptography.__file__, f'cryptography not in venv: {cryptography.__file__}'
print('OK', jwt.__version__, cryptography.__version__)
print('  jwt:', jwt.__file__)
print('  cryptography:', cryptography.__file__)
"

echo "=== Restarting backend ==="
systemctl restart jobsrow-backend
sleep 3

echo "=== Health check ==="
curl -sf http://127.0.0.1:8000/health && echo " backend OK"
systemctl is-active jobsrow-backend

echo "=== Security pins applied ==="
