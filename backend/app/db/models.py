import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    BigInteger,
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    String,
    Table,
)
from sqlalchemy.dialects.postgresql import ARRAY, BYTEA, CITEXT, JSONB, UUID
from sqlalchemy.orm import relationship
from app.db.session import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(CITEXT, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")
    is_active = Column(Boolean, nullable=False, default=True)
    mfa_secret = Column(BYTEA, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    jobs = relationship("Job", back_populates="owner", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token_hash = Column(String, nullable=False, index=True)
    family_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    is_revoked = Column(Boolean, nullable=False, default=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="refresh_tokens")


class Job(Base):
    __tablename__ = "jobs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    problem_type = Column(String, nullable=False)
    status = Column(String, nullable=False, index=True, default="queued")
    model_uri = Column(String, nullable=False)
    model_sha256 = Column(String(64), nullable=False)
    params = Column(JSONB, nullable=False)
    result_uri = Column(String, nullable=True)
    objective = Column(Float, nullable=True)
    gap = Column(Float, nullable=True)
    stats = Column(JSONB, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    started_at = Column(DateTime(timezone=True), nullable=True)
    finished_at = Column(DateTime(timezone=True), nullable=True)

    owner = relationship("User", back_populates="jobs")


class BenchmarkRun(Base):
    __tablename__ = "benchmark_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    suite = Column(String, nullable=False)
    instance = Column(String, nullable=False)
    solver = Column(String, nullable=False)
    status = Column(String, nullable=False)
    objective = Column(Float, nullable=True)
    time_s = Column(Float, nullable=True)
    nodes = Column(BigInteger, nullable=True)
    run_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    actor_id = Column(UUID(as_uuid=True), nullable=True, index=True)
    action = Column(String, nullable=False)
    resource = Column(String, nullable=True)
    ip = Column(String, nullable=True)
    request_id = Column(UUID(as_uuid=True), nullable=True)
    detail = Column(JSONB, nullable=True)
    at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
