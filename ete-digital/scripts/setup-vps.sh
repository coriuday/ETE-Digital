#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# setup-vps.sh — Fresh Ubuntu VPS bootstrap for ETE Digital / Jobrows
#
# Run as root (or with sudo) on a clean Ubuntu 22.04 / 24.04 VPS:
#   curl -fsSL https://raw.githubusercontent.com/coriuday/ETE-Digital/main/ete-digital/scripts/setup-vps.sh | bash
#
# What this script does:
#   1. Updates the system
#   2. Installs Docker Engine + Docker Compose plugin (official apt source)
#   3. Enables Docker to start on boot
#   4. Configures UFW firewall (SSH, HTTP, HTTPS only)
#   5. Clones the repository
#   6. Prompts for .env setup
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[setup]${NC} $*"; }
warn() { echo -e "${YELLOW}[setup] WARN${NC} $*"; }
err()  { echo -e "${RED}[setup] ERROR${NC} $*" >&2; }
info() { echo -e "${BLUE}[setup]${NC} $*"; }

REPO_URL="${REPO_URL:-https://github.com/coriuday/ETE-Digital.git}"
INSTALL_DIR="${INSTALL_DIR:-/opt/ete-digital}"

# ── 0. Must run as root ────────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ]; then
    err "This script must be run as root. Try: sudo bash setup-vps.sh"
    exit 1
fi

log "Starting VPS setup for ETE Digital / Jobrows..."

# ── 1. System update ──────────────────────────────────────────────────────────
log "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq \
    curl \
    wget \
    git \
    ufw \
    ca-certificates \
    gnupg \
    lsb-release

# ── 2. Install Docker Engine (official apt source) ────────────────────────────
if ! command -v docker &>/dev/null; then
    log "Installing Docker Engine..."
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg

    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
        | tee /etc/apt/sources.list.d/docker.list > /dev/null

    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    log "Docker Engine installed: $(docker --version)"
else
    log "Docker already installed: $(docker --version)"
fi

# ── 3. Enable Docker on boot ──────────────────────────────────────────────────
log "Enabling Docker to start on system boot..."
systemctl enable docker
systemctl start docker
log "Docker service enabled and running."

# ── 4. Configure UFW firewall ─────────────────────────────────────────────────
log "Configuring UFW firewall..."
ufw --force reset > /dev/null
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh      # Port 22
ufw allow http     # Port 80  — Caddy HTTP challenge
ufw allow https    # Port 443 — Caddy HTTPS + HTTP/3
ufw --force enable
log "UFW configured. Status:"
ufw status

# ── 5. Clone / update repository ─────────────────────────────────────────────
if [ -d "$INSTALL_DIR/.git" ]; then
    log "Repository already exists at $INSTALL_DIR. Pulling latest..."
    git -C "$INSTALL_DIR" pull --ff-only
else
    log "Cloning repository to $INSTALL_DIR..."
    git clone "$REPO_URL" "$INSTALL_DIR"
fi

# ── 6. Setup .env ────────────────────────────────────────────────────────────
ENV_FILE="$INSTALL_DIR/ete-digital/backend/.env"
VPS_EXAMPLE="$INSTALL_DIR/ete-digital/.env.vps.example"

if [ ! -f "$ENV_FILE" ]; then
    log "Copying VPS env template..."
    cp "$VPS_EXAMPLE" "$ENV_FILE"
    warn "IMPORTANT: Edit $ENV_FILE before starting the stack!"
    warn "Set these required values:"
    warn "  POSTGRES_PASSWORD, JWT_SECRET_KEY, ENCRYPTION_KEY"
    warn "  MINIO_ACCESS_KEY, MINIO_SECRET_KEY"
    warn "  CADDY_DOMAIN (your domain)"
    warn "  FRONTEND_URL, GOOGLE_REDIRECT_URI (your domain)"
else
    log ".env already exists at $ENV_FILE — skipping copy."
fi

# ── 7. Done ──────────────────────────────────────────────────────────────────
echo ""
info "═══════════════════════════════════════════════════════════════"
info " VPS bootstrap complete!"
info ""
info " Next steps:"
info "   1. Edit $ENV_FILE"
info "   2. Set CADDY_DOMAIN=yourdomain.com"
info "   3. Point DNS A record for yourdomain.com → $(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_VPS_IP')"
info "   4. cd $INSTALL_DIR/ete-digital"
info "   5. docker compose --profile vps up -d --build"
info "   6. curl https://yourdomain.com/health"
info "═══════════════════════════════════════════════════════════════"
