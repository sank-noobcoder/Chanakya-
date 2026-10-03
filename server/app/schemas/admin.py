import uuid
from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, ConfigDict, Field


class UserUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    role: Optional[str] = Field(None, pattern=r"^(user|engineer|admin)$")
    is_active: Optional[bool] = None


class AuditLogResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)

    id: int
    actor_id: Optional[uuid.UUID]
    action: str
    resource: Optional[str]
    ip: Optional[str]
    request_id: Optional[uuid.UUID]
    detail: Optional[Dict[str, Any]]
    at: datetime
