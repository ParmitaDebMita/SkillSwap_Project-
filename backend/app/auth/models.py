from typing import List, Optional
from pydantic import BaseModel, EmailStr, field_validator


class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 2:
            raise ValueError("Name must be at least 2 characters.")
        return v

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters.")
        return v


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    avatar: str = "🎓"
    bio: str = ""
    university: str = ""
    skillsOffered: List[str] = []
    skillsWanted: List[str] = []
    category: str = "Technology"
    rating: float = 5.0
    exchanges: int = 0

    # NOTE: password is intentionally excluded from this model


class TokenResponse(BaseModel):
    token: str
    user: UserResponse


def doc_to_user(doc: dict) -> UserResponse:
    """Convert a MongoDB document to a UserResponse, mapping _id -> id."""
    return UserResponse(
        id=str(doc["_id"]),
        name=doc.get("name", ""),
        email=doc.get("email", ""),
        avatar=doc.get("avatar", "🎓"),
        bio=doc.get("bio", ""),
        university=doc.get("university", ""),
        skillsOffered=doc.get("skillsOffered", []),
        skillsWanted=doc.get("skillsWanted", []),
        category=doc.get("category", "Technology"),
        rating=doc.get("rating", 5.0),
        exchanges=doc.get("exchanges", 0),
    )
