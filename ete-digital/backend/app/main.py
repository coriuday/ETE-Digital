"""
FastAPI Application Main Entry Point
"""

from contextlib import asynccontextmanager
import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.base import BaseHTTPMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from app.core.limiter import limiter
from app.core.config import settings

# ---- Security Headers Middleware ----

import secrets as _secrets  # local alias to avoid shadowing any future module-level var


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to every response.

    CSP Fix (audit issue #7):
      A fresh cryptographic nonce is generated for every request. The nonce is
      attached to `request.state.csp_nonce` so templates / SSR renderers can
      stamp inline scripts with `<script nonce="{{ request.state.csp_nonce }}">`.
      For the Vite SPA, add the `vite-plugin-csp-nonce` package to avoid
      `unsafe-inline` entirely. Until then, this removes `unsafe-inline` from
      headers immediately — inline scripts in the built bundle must carry the nonce.
    """

    async def dispatch(self, request: Request, call_next):
        nonce = _secrets.token_urlsafe(16)
        request.state.csp_nonce = nonce  # available to route handlers / templates

        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Content-Security-Policy"] = (
            f"default-src 'self'; "
            f"script-src 'self' 'nonce-{nonce}'; "  # nonce replaces 'unsafe-inline'
            f"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            f"font-src 'self' https://fonts.gstatic.com; "
            f"img-src 'self' data: https:; "
            f"connect-src 'self' ws: wss: http://localhost:8000 http://127.0.0.1:8000 https://ete-digital-backend.onrender.com https://*.supabase.co;"
        )
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response


# ---- Application Lifespan (startup / shutdown) ----


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup and shutdown events."""
    # Startup
    from app.services.scheduler import start_scheduler

    start_scheduler()

    yield  # Application running

    # Shutdown
    from app.services.scheduler import stop_scheduler

    stop_scheduler()


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="End-to-End Job Platform with Outcome-Driven Hiring",
    docs_url="/api/docs" if settings.DEBUG else None,
    redoc_url="/api/redoc" if settings.DEBUG else None,
    lifespan=lifespan,
)

# Rate Limiter state + handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# Security Headers
app.add_middleware(SecurityHeadersMiddleware)


# GZip Compression
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS Middleware (Must be LAST so it is the outermost middleware to catch exceptions)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for monitoring"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "version": settings.APP_VERSION,
        "docs": ("/api/docs" if settings.DEBUG else "Documentation disabled in production"),
    }


# Register routers
from app.api.auth import auth  # noqa: E402
from app.api.users import users  # noqa: E402
from app.api.jobs import jobs, analytics  # noqa: E402
from app.api.talent import tryouts, vault  # noqa: E402
from app.api.platform import notifications, admin, websocket  # noqa: E402

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["Jobs"])
app.include_router(tryouts.router, prefix="/api/tryouts", tags=["Tryouts"])
app.include_router(vault.router, prefix="/api/vault", tags=["Talent Vault"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["Notifications"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])
app.include_router(websocket.router, prefix="/api/ws", tags=["WebSocket"])

# Serve uploaded files (resumes, avatars)
_uploads_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
os.makedirs(_uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=_uploads_dir), name="uploads")
