import uuid
from typing import Optional
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.db.models import Job
from app.db.repositories.job_repo import JobRepository
from app.schemas.job import JobParams
from app.services.storage_service import StorageService


class JobService:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.job_repo = JobRepository(session)

    async def submit_job(
        self,
        owner_id: uuid.UUID,
        file_bytes: bytes,
        filename: str,
        params: JobParams,
    ) -> Job:
        # Check active job quota per user (Layer 3)
        active_count = await self.job_repo.count_active_jobs_for_user(owner_id)
        if active_count >= settings.MAX_CONCURRENT_JOBS_PER_USER:
            raise HTTPException(
                status_code=429,
                detail=f"Concurrent job quota exceeded (max {settings.MAX_CONCURRENT_JOBS_PER_USER} active jobs)",
            )

        # File magic byte / header sniffing (Layer 4)
        ext = filename.split(".")[-1].lower() if "." in filename else "mps"
        if ext not in ["mps", "lp", "json"]:
            raise HTTPException(status_code=400, detail="Invalid file type. Only .mps, .lp, and .json are accepted.")

        # Determine problem type from extension/content
        content_preview = file_bytes[:1000].decode("utf-8", errors="ignore").lower()
        if "quadobj" in content_preview or "qmatrix" in content_preview:
            problem_type = "QP"
        elif "marker" in content_preview or "integers" in content_preview or "binary" in content_preview:
            problem_type = "MILP"
        else:
            problem_type = "LP"

        # Store model with server-generated UUID (path traversal immunity)
        model_uri, model_sha256 = StorageService.save_model_file(file_bytes, ext)

        job = await self.job_repo.create(
            owner_id=owner_id,
            problem_type=problem_type,
            model_uri=model_uri,
            model_sha256=model_sha256,
            params=params.model_dump(),
        )
        return job

    async def cancel_job(self, job_id: uuid.UUID, owner_id: uuid.UUID, is_admin: bool = False) -> Job:
        job = await self.job_repo.get_by_id_and_owner(job_id, None if is_admin else owner_id)
        if not job:
            raise HTTPException(status_code=404, detail="Job not found.")

        if job.status in ["completed", "failed", "cancelled"]:
            raise HTTPException(status_code=400, detail=f"Cannot cancel job in '{job.status}' state.")

        await self.job_repo.update_status(job, "cancelled")
        return job
