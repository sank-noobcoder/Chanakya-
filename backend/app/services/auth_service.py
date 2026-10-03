import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.security import (
    create_access_token,
    generate_secure_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.db.models import User
from app.db.repositories.user_repo import UserRepository


class AuthService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.user_repo = UserRepository(session)

    async def register(self, email: str, password: str) -> User:
        existing = await self.user_repo.get_by_email(email)
        if existing:
            # Mask existence to prevent user enumeration (Layer 5)
            raise HTTPException(status_code=400, detail="Registration could not be completed.")

        hashed_pw = hash_password(password)
        return await self.user_repo.create(email=email, password_hash=hashed_pw, role="user")

    async def login(self, email: str, password: str) -> Tuple[str, str, int]:
        user = await self.user_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid email or password.")

        if not user.is_active:
            raise HTTPException(status_code=403, detail="Account is disabled.")

        # Generate access token
        access_token = create_access_token(subject=str(user.id), role=user.role)

        # Generate rotating refresh token with family tracking
        raw_refresh_token = generate_secure_token(48)
        token_hash = hash_token(raw_refresh_token)
        family_id = uuid.uuid4()
        expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        await self.user_repo.save_refresh_token(
            user_id=user.id,
            token_hash=token_hash,
            family_id=family_id,
            expires_at=expires_at,
        )

        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        return access_token, raw_refresh_token, expires_in

    async def refresh(self, raw_refresh_token: str) -> Tuple[str, str, int]:
        token_hash = hash_token(raw_refresh_token)
        stored_token = await self.user_repo.get_refresh_token_by_hash(token_hash)

        if not stored_token:
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

        # Token reuse detection: if a revoked token is used, compromise is suspected
        if stored_token.is_revoked:
            await self.user_repo.revoke_family(stored_token.family_id)
            raise HTTPException(status_code=401, detail="Token reuse detected. All sessions revoked.")

        now = datetime.now(timezone.utc)
        if stored_token.expires_at < now:
            raise HTTPException(status_code=401, detail="Refresh token expired.")

        # Invalidate the used refresh token
        stored_token.is_revoked = True

        # Issue new token in same family
        user = await self.user_repo.get_by_id(stored_token.user_id)
        if not user or not user.is_active:
            raise HTTPException(status_code=403, detail="User account inactive.")

        new_access_token = create_access_token(subject=str(user.id), role=user.role)
        new_raw_refresh = generate_secure_token(48)
        new_token_hash = hash_token(new_raw_refresh)
        expires_at = now + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

        await self.user_repo.save_refresh_token(
            user_id=user.id,
            token_hash=new_token_hash,
            family_id=stored_token.family_id,
            expires_at=expires_at,
        )

        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        return new_access_token, new_raw_refresh, expires_in
