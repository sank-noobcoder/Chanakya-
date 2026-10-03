from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import admin, auth, benchmarks, health, jobs
from app.core.config import settings
from app.core.logging import setup_logging
from app.middleware.body_limit import BodyLimitMiddleware
from app.middleware.error_handler import (
    http_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
)
from app.middleware.request_id import RequestIdMiddleware
from app.middleware.security_headers import SecurityHeadersMiddleware

# Initialize structured logging with secret masking
setup_logging()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Auto-seed initial accounts on startup if not present
    try:
        import uuid
        import logging
        from sqlalchemy import text
        from app.db.session import AsyncSessionLocal
        from app.core.security import hash_password

        async with AsyncSessionLocal() as session:
            admin_pass = hash_password("ChanakyaAdmin2026!Secure")
            engineer_pass = hash_password("ChanakyaEngineer2026!")
            user_pass = hash_password("ChanakyaUser2026!Standard")

            await session.execute(
                text("""
                    INSERT INTO users (id, email, password_hash, role, is_active)
                    VALUES 
                      (:admin_id, 'admin@chanakya.gov.in', :admin_pass, 'admin', true),
                      (:eng_id, 'engineer@iit.ac.in', :eng_pass, 'engineer', true),
                      (:user_id, 'analyst@iocl.in', :user_pass, 'user', true)
                    ON CONFLICT (email) DO NOTHING;
                """),
                {
                    "admin_id": uuid.uuid4(),
                    "admin_pass": admin_pass,
                    "eng_id": uuid.uuid4(),
                    "eng_pass": engineer_pass,
                    "user_id": uuid.uuid4(),
                    "user_pass": user_pass,
                },
            )
            await session.commit()
            logging.getLogger("chanakya").info("Default sovereign users verified in database.")
    except Exception as e:
        import logging
        logging.getLogger("chanakya").warning(f"Startup user seeding notice: {e}")

    yield
    # Application shutdown: cleanup pools


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Sovereign Mathematical Optimization Solver (LP / MILP / QP) API",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url=None,
    lifespan=lifespan,
)

# ------------------------------------------------------------------------------
# 7-Layer OSI Middleware Pipeline
# ------------------------------------------------------------------------------
# 1. Anti-DoS Body Size Limiter (Streaming rejection)
app.add_middleware(BodyLimitMiddleware)

# 2. Request ID Tracing (UUIDv4)
app.add_middleware(RequestIdMiddleware)

# 3. Security Headers (HSTS, CSP, X-Frame-Options: DENY, nosniff)
app.add_middleware(SecurityHeadersMiddleware)

# 4. Strict CORS policy
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS if isinstance(settings.ALLOWED_ORIGINS, list) else ["*"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    max_age=86400,
)

# ------------------------------------------------------------------------------
# Exception Handlers (Masking database and internal details)
# ------------------------------------------------------------------------------
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler)
app.add_exception_handler(Exception, unhandled_exception_handler)

# ------------------------------------------------------------------------------
# API Route Registration
# ------------------------------------------------------------------------------
app.include_router(health.router)
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(jobs.router, prefix=settings.API_V1_PREFIX)
app.include_router(benchmarks.router, prefix=settings.API_V1_PREFIX)
app.include_router(admin.router, prefix=settings.API_V1_PREFIX)
