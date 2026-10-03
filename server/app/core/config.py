import json
from typing import List, Optional, Union
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )

    # General
    APP_NAME: str = "Chanakya"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "production"
    DEBUG: bool = False
    API_V1_PREFIX: str = "/api/v1"
    PUBLIC_URL: str = "http://localhost:8080"

    # Layer 2: Transport & Security Headers
    SECRET_KEY: str = Field(
        default="chanakya-super-secret-cryptographically-random-key-64-bytes-minimum-length-required-for-production",
        min_length=32,
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALLOWED_ORIGINS: Union[List[str], str] = ["http://localhost:3000", "http://localhost:8080"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, str):
            return json.loads(v)
        return v

    # Layer 3: Traffic Control & Anti-DoS
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_PER_MINUTE: int = 60
    AUTH_RATE_LIMIT_PER_MINUTE: int = 5
    MAX_BODY_SIZE_BYTES: int = 50 * 1024 * 1024  # 50 MB
    MAX_CONCURRENT_JOBS_PER_USER: int = 5

    # Layer 7: Database Configuration
    POSTGRES_SERVER: str = "postgres"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "chanakya_app"
    POSTGRES_PASSWORD: str = "chanakya_secure_pass_change_in_prod"
    POSTGRES_DB: str = "chanakya_db"
    DATABASE_URL: Optional[str] = None
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_STATEMENT_TIMEOUT_MS: int = 15000

    # Redis Queue & Rate Limit
    REDIS_HOST: str = "redis"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = "chanakya_redis_pass_change_in_prod"
    REDIS_URL: Optional[str] = None

    def model_post_init(self, __context) -> None:
        if not self.DATABASE_URL:
            self.DATABASE_URL = f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        if not self.REDIS_URL:
            self.REDIS_URL = f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/0"

    # Storage (S3 / MinIO)
    S3_ENDPOINT: str = "http://minio:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin_secure_change_me"
    S3_BUCKET_MODELS: str = "chanakya-models"
    S3_BUCKET_RESULTS: str = "chanakya-results"
    S3_REGION: str = "ap-south-1"
    S3_USE_SSL: bool = False


settings = Settings()
