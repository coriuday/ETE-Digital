#!/usr/bin/env bash
# One-time VPS secret rotation for jobsrow.com — run as root on VPS.
# Does NOT rotate Stripe (confirm only) or Google OAuth (requires Google Console).
set -euo pipefail

ENV="/home/etedigital/jobsrow/ete-digital/backend/.env"
BACKUP="${ENV}.backup.$(date +%Y%m%d_%H%M%S)"
MINIO_IMAGE="minio/minio:RELEASE.2024-11-07T00-52-20Z"
BUCKET="ete-digital"

echo "=== Backing up .env ==="
cp "$ENV" "$BACKUP"
echo "Backup: $BACKUP"

gen_hex() { python3 -c "import secrets; print(secrets.token_hex(32))"; }
gen_pass() { python3 -c "import secrets; print(secrets.token_urlsafe(32))"; }

NEW_JWT="$(gen_hex)"
NEW_ENC="$(gen_hex)"
NEW_PG="$(gen_pass)"
NEW_MINIO_USER="jr$(python3 -c 'import secrets; print(secrets.token_hex(8))')"
NEW_MINIO_PASS="$(gen_pass)"

echo "=== Rotating PostgreSQL password ==="
sudo -u postgres psql -c "ALTER USER ete_user WITH PASSWORD '${NEW_PG}';"

echo "=== Updating .env (JWT, ENCRYPTION_KEY, POSTGRES, DATABASE_URL, MinIO) ==="
python3 <<PY
import re
from urllib.parse import quote_plus

env_path = "${ENV}"
with open(env_path) as f:
    content = f.read()

def set_var(name, value):
    global content
    pattern = rf"^{re.escape(name)}=.*$"
    replacement = f"{name}={value}"
    if re.search(pattern, content, re.M):
        content = re.sub(pattern, replacement, content, flags=re.M)
    else:
        content += f"\n{replacement}\n"

set_var("JWT_SECRET_KEY", "${NEW_JWT}")
set_var("ENCRYPTION_KEY", "${NEW_ENC}")
set_var("POSTGRES_PASSWORD", "${NEW_PG}")
pg_enc = quote_plus("${NEW_PG}")
set_var(
    "DATABASE_URL",
    f"postgresql+asyncpg://ete_user:{pg_enc}@localhost:5432/ete_digital",
)
set_var("MINIO_ACCESS_KEY", "${NEW_MINIO_USER}")
set_var("MINIO_SECRET_KEY", "${NEW_MINIO_PASS}")

with open(env_path, "w") as f:
    f.write(content)
print("Updated .env")
PY

echo "=== Recreating MinIO container with new root credentials ==="
docker stop jobsrow-minio >/dev/null 2>&1 || true
docker rm jobsrow-minio >/dev/null 2>&1 || true
docker run -d \
  --name jobsrow-minio \
  --restart unless-stopped \
  --network host \
  -v jobsrow_minio_data:/data \
  -e "MINIO_ROOT_USER=${NEW_MINIO_USER}" \
  -e "MINIO_ROOT_PASSWORD=${NEW_MINIO_PASS}" \
  "$MINIO_IMAGE" \
  server /data --console-address :9001

echo "=== Waiting for MinIO ==="
for i in $(seq 1 30); do
  if docker exec jobsrow-minio mc alias set local http://localhost:9000 "${NEW_MINIO_USER}" "${NEW_MINIO_PASS}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "=== Ensuring bucket exists and is private ==="
docker exec jobsrow-minio mc mb --ignore-existing "local/${BUCKET}" >/dev/null 2>&1 || true
docker exec jobsrow-minio mc anonymous set none "local/${BUCKET}"

POLICY="$(docker exec jobsrow-minio mc anonymous get "local/${BUCKET}" 2>&1 || true)"
echo "Bucket policy: $POLICY"

echo "=== Restarting backend ==="
systemctl restart jobsrow-backend
sleep 5

echo "=== Health checks ==="
curl -sf http://127.0.0.1:8000/health && echo " backend /health OK"
curl -sf https://jobsrow.com/api/health && echo " public /api/health OK" || \
  curl -sf https://jobsrow.com/health && echo " public /health OK"

echo "=== Rotation complete ==="
echo "Skipped (manual): STRIPE_*, GOOGLE_CLIENT_SECRET, REDIS (not configured in .env)"
echo "All users must log in again (JWT rotated)."
