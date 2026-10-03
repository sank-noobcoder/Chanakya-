from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from app.core.config import settings


class BodyLimitMiddleware(BaseHTTPMiddleware):
    """
    Layer 3: Anti-DoS Max Body Size Limiter
    Rejects requests exceeding MAX_BODY_SIZE_BYTES before buffering to memory.
    """

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length = int(content_length)
                if length > settings.MAX_BODY_SIZE_BYTES:
                    req_id = getattr(request.state, "request_id", "unknown")
                    return JSONResponse(
                        status_code=413,
                        content={
                            "error": {
                                "code": "PAYLOAD_TOO_LARGE",
                                "message": f"Request body exceeds maximum allowed size of {settings.MAX_BODY_SIZE_BYTES} bytes",
                                "request_id": req_id,
                            }
                        },
                    )
            except ValueError:
                pass

        return await call_next(request)
