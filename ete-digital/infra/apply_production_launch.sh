#!/usr/bin/env bash
# Apply production launch settings on jobsrow VPS
set -euo pipefail

ENV="/home/etedigital/jobsrow/ete-digital/backend/.env"
cp "$ENV" "${ENV}.backup.launch.$(date +%Y%m%d_%H%M%S)"

REDIS_PASS="$(python3 -c 'import secrets; print(secrets.token_hex(24))')"

# Set Valkey/Redis password
if grep -q '^requirepass ' /etc/valkey/valkey.conf; then
  sed -i "s/^requirepass .*/requirepass ${REDIS_PASS}/" /etc/valkey/valkey.conf
elif grep -q '^# requirepass' /etc/valkey/valkey.conf; then
  sed -i "s/^# requirepass .*/requirepass ${REDIS_PASS}/" /etc/valkey/valkey.conf
else
  echo "requirepass ${REDIS_PASS}" >> /etc/valkey/valkey.conf
fi

systemctl restart valkey
sleep 2
redis-cli -a "${REDIS_PASS}" ping | grep -q PONG

# Production env
sed -i 's/^ENVIRONMENT=.*/ENVIRONMENT=production/' "$ENV"
sed -i 's/^DEBUG=.*/DEBUG=false/' "$ENV"

if grep -q '^REDIS_URL=' "$ENV"; then
  sed -i "s|^REDIS_URL=.*|REDIS_URL=redis://:${REDIS_PASS}@localhost:6379/0|" "$ENV"
else
  echo "REDIS_URL=redis://:${REDIS_PASS}@localhost:6379/0" >> "$ENV"
fi

systemctl restart jobsrow-backend
sleep 5

echo "=== Verification ==="
grep -E '^(ENVIRONMENT|DEBUG|REDIS_URL)=' "$ENV" | sed 's/REDIS_URL=redis:\/\/:[^@]*/REDIS_URL=redis:\/\/:***REDACTED/'
curl -sf http://127.0.0.1:8000/health
echo
curl -sf https://jobsrow.com/health
echo
systemctl is-active valkey jobsrow-backend jobsrow-frontend
echo "=== Launch config applied ==="
