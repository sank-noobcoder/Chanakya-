import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, ConfigDict, Field


class AlgorithmEnum(str, Enum):
    AUTO = "auto"
    SIMPLEX = "simplex"
    IPM = "ipm"
    BRANCH_AND_CUT = "branch_and_cut"


class JobParams(BaseModel):
    model_config = ConfigDict(extra="forbid")

    time_limit_s: int = Field(default=600, ge=1, le=3600, description="Time limit in seconds (1 to 3600)")
    mip_gap: float = Field(default=0.0001, ge=0.0, le=1.0, description="Relative MIP gap (0.0 to 1.0)")
    threads: int = Field(default=4, ge=1, le=64, description="Threads (1 to 64)")
    seed: int = Field(default=42, ge=0, le=4294967295, description="Random seed")
    algorithm: AlgorithmEnum = Field(default=AlgorithmEnum.AUTO)


class JobSubmitResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_id: uuid.UUID
    status: str
    links: Dict[str, str]


class JobResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    id: uuid.UUID
    problem_type: str
    status: str
    model_sha256: str
    params: Dict[str, Any]
    objective: Optional[float] = None
    gap: Optional[float] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None


class JobResultResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    job_id: uuid.UUID
    status: str
    objective_value: Optional[float]
    verified: bool
    primal_values: Optional[List[float]] = None
    dual_values: Optional[List[float]] = None
    stats: Optional[Dict[str, Any]] = None
    verification_notes: List[str] = []
