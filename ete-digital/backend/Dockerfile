# ── Stage 1: Builder — install deps in a throwaway layer ──────────────────────
FROM python:3.11-slim AS builder

# Prevent .pyc files and enable stdout/stderr flushing
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# System deps required for building Python packages (asyncpg, cryptography, argon2-cffi)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (layer-cached unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --upgrade pip==24.3.1 && \
    pip install --no-cache-dir -r requirements.txt

# ── Stage 2: Runtime — lean final image ───────────────────────────────────────
FROM python:3.11-slim AS production

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Runtime-only system deps (libpq for asyncpg, postgresql-client for healthchecks)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder (no gcc/build tools in final image)
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Create non-root user before copying code
RUN useradd -m -u 1000 -s /bin/bash appuser

# Copy application code (excludes .env — use docker-compose env_file or secrets)
COPY --chown=appuser:appuser . .

# Drop to non-root
USER appuser

EXPOSE 8000

# Default: run start.sh which:
#   1. Waits for DB to be ready
#   2. Applies Alembic migrations (alembic upgrade head)
#   3. Starts the server in the appropriate mode:
#      - DEPLOY_MODE=render → uvicorn single-worker (default, Render-compatible)
#      - DEPLOY_MODE=vps    → gunicorn multi-worker (VPS production)
#
# Override CMD in docker-compose for custom entrypoints (e.g. worker processes).
CMD ["bash", "start.sh"]
