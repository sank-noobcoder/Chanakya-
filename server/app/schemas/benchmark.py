import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class BenchmarkRunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    suite: str = Field(pattern=r"^(netlib|miplib|mittelmann|indian_industry)$")
    instance: str = Field(min_length=1, max_length=64)
    solver: str = Field(default="chanakya", pattern=r"^(chanakya|highs)$")


class BenchmarkRunResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    id: uuid.UUID
    suite: str
    instance: str
    solver: str
    status: str
    objective: Optional[float]
    time_s: Optional[float]
    nodes: Optional[int]
    run_at: datetime
