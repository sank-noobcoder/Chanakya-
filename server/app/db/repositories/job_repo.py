import uuid
from typing import List, Optional
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.models import Job


class JobRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_id_and_owner(self, job_id: uuid.UUID, owner_id: Optional[uuid.UUID] = None) -> Optional[Job]:
        """
        Retrieves a job by ID, strictly enforcing owner_id check unless explicitly bypassed for admin.
        Prevents IDOR/BOLA (Layer 6: Object-Level Authorization).
        """
        stmt = select(Job).where(Job.id == job_id)
        if owner_id is not None:
            stmt = stmt.where(Job.owner_id == owner_id)

        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_by_owner(self, owner_id: uuid.UUID, limit: int = 50, offset: int = 0) -> List[Job]:
        stmt = (
            select(Job)
            .where(Job.owner_id == owner_id)
            .order_by(desc(Job.created_at))
            .limit(limit)
            .offset(offset)
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_active_jobs_for_user(self, owner_id: uuid.UUID) -> int:
        stmt = (
            select(Job)
            .where(Job.owner_id == owner_id)
            .where(Job.status.in_(["queued", "presolving", "solving"]))
        )
        result = await self.session.execute(stmt)
        return len(list(result.scalars().all()))

    async def create(
        self,
        owner_id: uuid.UUID,
        problem_type: str,
        model_uri: str,
        model_sha256: str,
        params: dict,
    ) -> Job:
        job = Job(
            owner_id=owner_id,
            problem_type=problem_type,
            status="queued",
            model_uri=model_uri,
            model_sha256=model_sha256,
            params=params,
        )
        self.session.add(job)
        await self.session.flush()
        return job

    async def update_status(self, job: Job, status: str) -> None:
        job.status = status
        await self.session.flush()
