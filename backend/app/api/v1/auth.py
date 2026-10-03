from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import check_rate_limit, get_client_ip, get_current_user
from app.db.models import User
from app.db.session import get_db_session
from app.schemas.auth import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse, UserResponse
from app.services.audit_service import AuditService
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(check_rate_limit)])
async def register(
    request: Request,
    payload: RegisterRequest,
    session: AsyncSession = Depends(get_db_session),
):
    service = AuthService(session)
    user = await service.register(email=payload.email, password=payload.password)

    # Audit logging
    audit = AuditService(session)
    req_id = getattr(request.state, "request_id", None)
    await audit.record(
        action="user_registered",
        actor_id=user.id,
        resource=f"user:{user.id}",
        ip=get_client_ip(request),
        request_id=req_id,
        detail={"email": payload.email},
    )
    return user


@router.post("/login", response_model=TokenResponse, dependencies=[Depends(check_rate_limit)])
async def login(
    request: Request,
    payload: LoginRequest,
    session: AsyncSession = Depends(get_db_session),
):
    service = AuthService(session)
    access_token, refresh_token, expires_in = await service.login(
        email=payload.email,
        password=payload.password,
    )

    audit = AuditService(session)
    req_id = getattr(request.state, "request_id", None)
    await audit.record(
        action="user_login_success",
        resource="auth",
        ip=get_client_ip(request),
        request_id=req_id,
        detail={"email": payload.email},
    )

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=expires_in,
    )


@router.post("/refresh", response_model=TokenResponse, dependencies=[Depends(check_rate_limit)])
async def refresh_tokens(
    request: Request,
    payload: RefreshRequest,
    session: AsyncSession = Depends(get_db_session),
):
    service = AuthService(session)
    new_access, new_refresh, expires_in = await service.refresh(payload.refresh_token)
    return TokenResponse(
        access_token=new_access,
        refresh_token=new_refresh,
        expires_in=expires_in,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    return current_user
