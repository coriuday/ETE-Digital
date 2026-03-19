"""
Rate limiter — shared singleton to avoid circular imports.

Import this module (not app.main) wherever you need the `limiter` instance,
e.g. in API routers that use the @limiter.limit decorator.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
