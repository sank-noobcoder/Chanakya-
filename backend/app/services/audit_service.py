import uuid
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.repositories.audit_repo import AuditRepository


class AuditService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.audit_repo = AuditRepository(session)

    async def record(
        self,
        action: str,
        actor_id: Optional[uuid.UUID] = None,
        resource: Optional[str] = None,
        ip: Optional[str] = None,
        request_id: Optional[uuid.UUID] = None,
        detail: Optional[Dict[str, Any]] = None,
    ) -> None:
        await self.audit_repo.log_event(
            action=action,
            actor_id=actor_id,
            resource=resource,
            ip=ip,
            request_id=request_id,
            detail=detail,
        )
