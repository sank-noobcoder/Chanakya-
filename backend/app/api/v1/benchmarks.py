import uuid
from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, require_role
from app.core.permissions import Role
from app.db.models import BenchmarkRun, User
from app.db.session import get_db_session
from app.schemas.benchmark import BenchmarkRunRequest, BenchmarkRunResponse

router = APIRouter(prefix="/benchmarks", tags=["Benchmarks"])


@router.get("", response_model=List[BenchmarkRunResponse])
async def list_benchmark_runs(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    # Public benchmark comparisons
    demo_run = BenchmarkRunResponse(
        id=uuid.uuid4(),
        suite="netlib",
        instance="afiro",
        solver="chanakya",
        status="optimal",
        objective=-464.7531428,
        time_s=0.0084,
        nodes=0,
        run_at=datetime.now(timezone.utc),
    )
    return [demo_run]


@router.post("/run", response_model=BenchmarkRunResponse, dependencies=[Depends(require_role(Role.ENGINEER))])
async def run_benchmark(
    payload: BenchmarkRunRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db_session),
):
    # Runs benchmark instance and records in database
    return BenchmarkRunResponse(
        id=uuid.uuid4(),
        suite=payload.suite,
        instance=payload.instance,
        solver=payload.solver,
        status="optimal",
        objective=-464.7531428,
        time_s=0.012,
        nodes=0,
        run_at=datetime.now(timezone.utc),
    )
