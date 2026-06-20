#!/usr/bin/env bash
# ============================================================
# DEPRECATED — Initial VPS bootstrap only (Arch/PM2 stack).
# For production updates use: infra/production_deploy.sh (systemd)
#
# SECURITY: Never embed secrets in this script. Provide via:
#   export POSTGRES_PASSWORD='...'  (required on first run)
#   backend/.env copied from backend/.env.example (required)
#
# After any historical secret exposure, follow infra/SECRET_ROTATION.md
# ============================================================
set -euo pipefail

APP_DIR="/home/etedigital/jobsrow/ete-digital"
BACKEND="$APP_DIR/backend"
FRONTEND="$APP_DIR/frontend"
ECOSYSTEM="/home/etedigital/jobsrow/ecosystem.config.js"

echo "===== [1/10] Checking repo ====="
ls "$APP_DIR" || { echo "ERROR: Repo not found at $APP_DIR"; exit 1; }

echo "===== [2/10] Frontend build ====="
if [ ! -d "$FRONTEND/dist" ]; then
  echo "Building frontend..."
  cd "$FRONTEND"
  npm install --silent
  VITE_API_URL=https://jobsrow.com npm run build
else
  echo "dist/ already exists, skipping build."
fi
ls "$FRONTEND/dist/"

echo "===== [3/10] Backend Python deps ====="
cd "$BACKEND"
if [ ! -f ".venv/bin/uvicorn" ]; then
  echo "Setting up virtualenv..."
  python3 -m venv --system-site-packages .venv
  source .venv/bin/activate
  pip install --quiet --upgrade pip
  pip install --quiet -r requirements.txt
else
  echo "Venv already set up."
  source .venv/bin/activate
fi
.venv/bin/uvicorn --version

echo "===== [4/10] PostgreSQL & Redis check ====="
systemctl is-active postgresql && echo "Postgres: OK" || (systemctl start postgresql && echo "Postgres: Started")
redis-cli ping && echo "Redis: OK" || (pacman -S --noconfirm redis && systemctl enable --now redis && echo "Redis: Installed")

echo "===== [5/10] Create DB user and database ====="
if [ -z "${POSTGRES_PASSWORD:-}" ]; then
  echo "ERROR: Set POSTGRES_PASSWORD before running (e.g. export POSTGRES_PASSWORD=\$(openssl rand -hex 24))"
  exit 1
fi
sudo -u postgres psql -c "CREATE USER ete_user WITH PASSWORD '${POSTGRES_PASSWORD}';" 2>/dev/null || \
  sudo -u postgres psql -c "ALTER USER ete_user WITH PASSWORD '${POSTGRES_PASSWORD}';"
sudo -u postgres psql -c "CREATE DATABASE ete_digital OWNER ete_user;" 2>/dev/null || echo "DB already exists"
sudo -u postgres psql -c "\l" | grep ete_digital

echo "===== [6/10] Backend .env (must exist — never auto-write secrets) ====="
if [ ! -f "$BACKEND/.env" ]; then
  if [ -f "$BACKEND/.env.example" ]; then
    cp "$BACKEND/.env.example" "$BACKEND/.env"
    echo "Created $BACKEND/.env from .env.example — EDIT IT before continuing."
    echo "Set JWT_SECRET_KEY, ENCRYPTION_KEY, DATABASE_URL, MINIO keys, etc."
    exit 1
  else
    echo "ERROR: Missing $BACKEND/.env — create it from .env.example"
    exit 1
  fi
fi
# shellcheck source=/dev/null
set -a && source "$BACKEND/.env" && set +a
for var in JWT_SECRET_KEY ENCRYPTION_KEY DATABASE_URL; do
  if [ -z "${!var:-}" ] || [[ "${!var}" == *CHANGE_ME* ]]; then
    echo "ERROR: $var is missing or still placeholder in $BACKEND/.env"
    exit 1
  fi
done
echo "Backend .env present and required vars set."

echo "===== [7/10] Running Alembic migrations ====="
cd "$BACKEND"
source .venv/bin/activate
alembic upgrade head && echo "Migrations: OK" || echo "WARNING: Migrations failed - check DB connection"

echo "===== [8/10] Install serve + PM2 config ====="
npm install -g serve 2>/dev/null || true

cat > "$ECOSYSTEM" << 'PM2EOF'
module.exports = {
  apps: [
    {
      name: 'jobsrow-backend',
      cwd: '/home/etedigital/jobsrow/ete-digital/backend',
      script: '.venv/bin/uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000',
      interpreter: 'none',
      env: {
        DEPLOY_MODE: 'vps',
        PORT: '8000'
      },
      watch: false,
      autorestart: true,
      max_restarts: 5,
      restart_delay: 3000
    },
    {
      name: 'jobsrow-frontend',
      cwd: '/home/etedigital/jobsrow/ete-digital/frontend',
      script: 'serve',
      args: 'dist -p 3000 -s',
      interpreter: 'none',
      watch: false,
      autorestart: true
    }
  ]
}
PM2EOF

echo "===== [9/10] Starting PM2 apps ====="
pm2 delete all 2>/dev/null || true
pm2 start "$ECOSYSTEM"
sleep 6
pm2 list
curl -s http://localhost:8000/health && echo " [backend OK]" || echo " [backend NOT responding yet]"
curl -s -o /dev/null -w "Frontend HTTP: %{http_code}\n" http://localhost:3000

echo "===== [10/10] nginx + SSL ====="
mkdir -p /etc/nginx/conf.d

cat > /etc/nginx/conf.d/jobsrow.conf << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name jobsrow.com www.jobsrow.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 300;
    }

    location /health {
        proxy_pass http://127.0.0.1:8000/health;
    }
}
NGINXEOF

nginx -t && systemctl reload nginx && echo "nginx: OK"

# SSL via certbot
echo "Attempting SSL certificate..."
certbot --nginx \
  -d jobsrow.com \
  -d www.jobsrow.com \
  --non-interactive \
  --agree-tos \
  --email admin@jobsrow.com \
  --redirect \
  && echo "SSL: DONE" \
  || echo "SSL: FAILED (DNS may not have propagated yet — run certbot manually in 5-10 mins)"

# PM2 startup
pm2 save
pm2 startup systemd -u etedigital --hp /home/etedigital 2>/dev/null || pm2 startup

echo ""
echo "========================================="
echo "  DEPLOYMENT COMPLETE"
echo "========================================="
pm2 list
echo ""
echo "Test URLs:"
echo "  http://jobsrow.com"
echo "  http://localhost:8000/health"
echo "  http://localhost:3000"
