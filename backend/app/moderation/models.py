from typing import Optional
from pydantic import BaseModel, field_validator


class ReportUserRequest(BaseModel):
    reportedUserId: str
    reason: str
    details: Optional[str] = ""

    @field_validator("reason")
    @classmethod
    def validate_reason(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Report reason is required.")
        return trimmed


class BlockUserRequest(BaseModel):
    blockedUserId: str
