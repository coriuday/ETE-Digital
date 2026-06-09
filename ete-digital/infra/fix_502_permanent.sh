#!/usr/bin/env bash
# ============================================================
# fix_502_permanent.sh
# Permanent fix: switches from PM2 to systemd services
# Run as: bash fix_502_permanent.sh
# ============================================================

APP_DIR="/home/etedigital/jobsrow/ete-digital"
BACKEND="$APP_DIR/backend"
FRONTEND="$APP_DIR/frontend"

echo "====== Step 1: Kill everything and clean up ======"
pm2 kill 2>/dev/null || true
pkill -f uvicorn 2>/dev/null || true
pkill -f "serve dist" 2>/dev/null || true
sleep 2

echo "====== Step 2: Verify backend & frontend exist ======"
ls "$BACKEND/.venv/bin/uvicorn" || { echo "ERROR: venv missing"; exit 1; }
ls "$FRONTEND/dist/index.html" || { echo "ERROR: frontend dist missing"; exit 1; }
which serve || { echo "ERROR: serve not found"; npm install -g serve; }
echo "All binaries found."

echo "====== Step 3: Write backend .env ======"
cat > "$BACKEND/.env" << 'ENVEOF'
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=INFO
DEPLOY_MODE=vps
DATABASE_URL=postgresql+asyncpg://ete_user:Prav1234@localhost:5432/ete_digital
REDIS_URL=redis://localhost:6379/0
JWT_SECRET_KEY=a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
ENCRYPTION_KEY=b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3
FRONTEND_URL=https://jobsrow.com
CORS_ORIGINS=["https://jobsrow.com","https://www.jobsrow.com","http://localhost:5173"]
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_SECURE=false
MINIO_BUCKET_NAME=ete-digital
EMAIL_ENABLED=false
PORT=8000
ENVEOF
echo ".env written."

echo "====== Step 4: Create systemd service for backend ======"
cat > /etc/systemd/system/jobsrow-backend.service << SVCEOF
[Unit]
Description=Jobsrow FastAPI Backend
After=network.target postgresql.service redis.service
Wants=postgresql.service redis.service

[Service]
Type=simple
User=root
WorkingDirectory=$BACKEND
Environment="PATH=$BACKEND/.venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
EnvironmentFile=$BACKEND/.env
ExecStart=$BACKEND/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 2
Restart=always
RestartSec=5
StartLimitInterval=60
StartLimitBurst=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=jobsrow-backend

[Install]
WantedBy=multi-user.target
SVCEOF

echo "====== Step 5: Create systemd service for frontend ======"
SERVE_BIN=$(which serve)
cat > /etc/systemd/system/jobsrow-frontend.service << SVCEOF
[Unit]
Description=Jobsrow React Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=$FRONTEND
ExecStart=$SERVE_BIN dist -p 3000 -s
Restart=always
RestartSec=5
StartLimitInterval=60
StartLimitBurst=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=jobsrow-frontend

[Install]
WantedBy=multi-user.target
SVCEOF

echo "====== Step 6: Reload systemd and enable services ======"
systemctl daemon-reload
systemctl enable jobsrow-backend jobsrow-frontend
systemctl restart jobsrow-backend jobsrow-frontend
sleep 5

echo "====== Step 7: Check service status ======"
systemctl is-active jobsrow-backend && echo "BACKEND: OK" || echo "BACKEND: FAILED"
systemctl is-active jobsrow-frontend && echo "FRONTEND: OK" || echo "FRONTEND: FAILED"

echo "====== Step 8: Test local endpoints ======"
sleep 5
curl -s --max-time 10 http://localhost:8000/health && echo " [backend OK]" || echo " [backend FAIL]"
curl -s -o /dev/null -w "Frontend HTTP: %{http_code}\n" --max-time 10 http://localhost:3000

echo "====== Step 9: Fix nginx config ======"
cat > /etc/nginx/conf.d/jobsrow.conf << 'NGINXEOF'
server {
    listen 80;
    listen [::]:80;
    server_name jobsrow.com www.jobsrow.com;

    # Increase timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

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

nginx -t && systemctl reload nginx && echo "NGINX: OK"

echo "====== Step 10: SSL Certificate ======"
certbot --nginx \
  -d jobsrow.com \
  -d www.jobsrow.com \
  --non-interactive \
  --agree-tos \
  --email admin@jobsrow.com \
  --redirect \
  && echo "SSL: DONE" \
  || echo "SSL: SKIPPED (already set or DNS issue)"

echo "====== Step 11: Health monitor cron ======"
cat > /usr/local/bin/jobsrow-monitor.sh << 'MONEOF'
#!/bin/bash
LOG=/var/log/jobsrow-monitor.log

check_service() {
  local name=$1
  if ! systemctl is-active --quiet "$name"; then
    echo "$(date '+%Y-%m-%d %H:%M:%S') $name is down, restarting..." >> $LOG
    systemctl restart "$name"
  fi
}

check_service jobsrow-backend
check_service jobsrow-frontend
check_service nginx
MONEOF
chmod +x /usr/local/bin/jobsrow-monitor.sh

# Add to cron every 2 minutes
(crontab -l 2>/dev/null | grep -v jobsrow-monitor; echo "*/2 * * * * /usr/local/bin/jobsrow-monitor.sh") | crontab -

echo "====== FINAL STATUS ======"
systemctl status jobsrow-backend --no-pager | grep -E "Active|Main PID"
systemctl status jobsrow-frontend --no-pager | grep -E "Active|Main PID"
systemctl is-active nginx
curl -s http://localhost:8000/health
echo ""
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:3000

echo ""
echo "============================================"
echo "  DONE - Services are now managed by systemd"
echo "  They auto-restart on crash AND on boot"
echo "  Monitor cron runs every 2 minutes"
echo "============================================"
