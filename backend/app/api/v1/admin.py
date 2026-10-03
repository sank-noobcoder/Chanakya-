import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import require_role
from app.core.permissions import Role
from app.db.models import User
from app.db.repositories.audit_repo import AuditRepository
from app.db.repositories.user_repo import UserRepository
from app.db.session import get_db_session
from app.schemas.admin import AuditLogResponse, UserUpdateRequest
from app.schemas.auth import UserResponse

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_role(Role.ADMIN))])


@router.get("/users", response_model=List[UserResponse])
async def list_all_users(
    session: AsyncSession = Depends(get_db_session),
):
    from sqlalchemy import select
    result = await session.execute(select(User))
    return list(result.scalars().all())


@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: uuid.UUID,
    payload: UserUpdateRequest,
    session: AsyncSession = Depends(get_db_session),
):
    repo = UserRepository(session)
    user = await repo.get_by_id(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if payload.role:
        user.role = payload.role
    if payload.is_active is not None:
        user.is_active = payload.is_active

    await session.flush()
    return user


@router.get("/audit", response_model=List[AuditLogResponse])
async def get_audit_trail(
    limit: int = 100,
    session: AsyncSession = Depends(get_db_session),
):
    repo = AuditRepository(session)
    entries = await repo.list_recent(limit=limit)
    return entries
