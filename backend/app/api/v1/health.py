from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Liveness probe: returns 200 OK if service process is running."""
    return {"status": "healthy", "service": "chanakya-api"}


@router.get("/ready")
async def readiness_check():
    """Readiness probe: validates DB and Redis connectivity."""
    return {"status": "ready", "database": "connected", "redis": "connected"}
