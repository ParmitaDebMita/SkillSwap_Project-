import os
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
_env_files = [
    os.path.join(_base_dir, ".env"),
    os.path.join(_base_dir, "..", ".env"),
    ".env",
]

INSECURE_KEYS = {
    "change-this-secret",
    "secret",
    "changeme",
    "default",
    "jwt-secret",
    "secretkey",
    "password",
}


class Settings(BaseSettings):
    mongodb_url: str = "mongodb://localhost:27017"
    database_name: str = "skillswap"
    jwt_secret_key: str  # Required from environment variables or .env — no default
    jwt_algorithm: str = "HS256"
    jwt_expire_minutes: int = 10080  # 7 days
    frontend_origin: str = "http://localhost:5173"

    model_config = SettingsConfigDict(
        env_file=_env_files,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @field_validator("jwt_secret_key")
    @classmethod
    def validate_jwt_secret_key(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("JWT_SECRET_KEY must be provided via environment variables or .env file.")
        val = v.strip()
        if val.lower() in INSECURE_KEYS or len(val) < 16:
            raise ValueError(
                "JWT_SECRET_KEY is insecure. It must not use a default placeholder and must be at least 16 characters long."
            )
        return val


settings = Settings()
