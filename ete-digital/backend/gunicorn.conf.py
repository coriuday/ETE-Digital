"""
gunicorn.conf.py — Production Gunicorn configuration for VPS deployment.

Usage (from ete-digital/backend/):
    gunicorn app.main:app -c gunicorn.conf.py

Environment variables that override these defaults:
    PORT           — TCP port to bind (default 8000)
    WORKERS        — number of worker processes (default: 2*CPU+1, max 8)
    WORKER_TIMEOUT — seconds before a worker is killed (default 120)
    LOG_LEVEL      — gunicorn log level (default info)
"""

import multiprocessing
import os

# ── Binding ───────────────────────────────────────────────────────────────────
port = os.environ.get("PORT", "8000")
bind = f"0.0.0.0:{port}"

# ── Workers ───────────────────────────────────────────────────────────────────
# Formula: (2 × CPU cores + 1), capped at 8 to prevent RAM exhaustion on small VPS.
# A 2-core VPS → 5 workers; 4-core → 8 workers (capped).
_cpu_count = multiprocessing.cpu_count()
_default_workers = min((2 * _cpu_count) + 1, 8)
workers = int(os.environ.get("WORKERS", _default_workers))

# ── Worker class ─────────────────────────────────────────────────────────────
# uvicorn.workers.UvicornWorker: async-compatible worker for FastAPI/Starlette.
# Each worker runs its own event loop — fully independent, crash-safe.
worker_class = "uvicorn.workers.UvicornWorker"

# ── Timeouts ─────────────────────────────────────────────────────────────────
# Render/Render-equivalent: set high enough to cover DB cold-start on first request.
# VPS: Alembic migrations run in start.sh BEFORE gunicorn starts, so no cold-start.
timeout = int(os.environ.get("WORKER_TIMEOUT", "120"))
keepalive = 5  # seconds — matches nginx upstream keepalive_timeout

# ── Connection limits ────────────────────────────────────────────────────────
worker_connections = 1000  # per worker; nginx handles the external rate-limiting

# ── Logging ──────────────────────────────────────────────────────────────────
loglevel = os.environ.get("LOG_LEVEL", "info").lower()
accesslog = "-"  # stdout — Docker/systemd captures it
errorlog = "-"  # stdout
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)sμs'

# ── Process management ────────────────────────────────────────────────────────
# Graceful shutdown: give workers 30 s to finish in-flight requests before SIGKILL.
graceful_timeout = 30
preload_app = False  # False: each worker imports app independently — safer for async code

# ── Security ─────────────────────────────────────────────────────────────────
# Limit request line + header size to mitigate oversized-header attacks.
limit_request_line = 8190
limit_request_fields = 100
limit_request_field_size = 8190
