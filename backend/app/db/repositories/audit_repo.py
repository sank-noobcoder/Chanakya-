import uuid
from typing import Any, Dict, List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import AuditLog


class AuditRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def log_event(
        self,
        action: str,
        actor_id: Optional[uuid.UUID] = None,
        resource: Optional[str] = None,
        ip: Optional[str] = None,
        request_id: Optional[uuid.UUID] = None,
        detail: Optional[Dict[str, Any]] = None,
    ) -> AuditLog:
        # Parameterized insert into immutable audit table
        entry = AuditLog(
            actor_id=actor_id,
            action=action,
            resource=resource,
            ip=ip,
            request_id=request_id,
            detail=detail,
        )
        self.session.add(entry)
        await self.session.flush()
        return entry

    async def list_recent(self, limit: int = 100) -> List[AuditLog]:
        stmt = select(AuditLog).order_by(desc(AuditLog.at)).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
