from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.models import LoginRequest, SignupRequest, TokenResponse, UserResponse, doc_to_user
from app.auth.utils import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.database import get_database

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest):
    """Register a new student account."""
    db = get_database()
    clean_email = body.email.strip().lower()

    # Check for duplicate email
    existing = await db.users.find_one({"email": clean_email})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists. Please log in instead.",
        )

    new_user = {
        "name": body.name.strip(),
        "email": clean_email,
        "hashed_password": hash_password(body.password),
        "avatar": "🎓",
        "bio": f"Hello! I am {body.name.strip()}, a student on SkillSwap excited to learn and share skills.",
        "university": "Campus Student",
        "skillsOffered": ["JavaScript", "Web Basics"],
        "skillsWanted": ["Python", "Graphic Design"],
        "category": "Technology",
        "rating": 5.0,
        "exchanges": 0,
    }

    result = await db.users.insert_one(new_user)
    new_user["_id"] = result.inserted_id

    user_response = doc_to_user(new_user)
    token = create_access_token({"sub": user_response.id})

    return TokenResponse(token=token, user=user_response)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest):
    """Authenticate and receive a JWT token."""
    db = get_database()
    clean_email = body.email.strip().lower()

    user_doc = await db.users.find_one({"email": clean_email})
    if not user_doc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this email. Please check your email or sign up.",
        )

    if not verify_password(body.password, user_doc.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again.",
        )

    user_response = doc_to_user(user_doc)
    token = create_access_token({"sub": user_response.id})

    return TokenResponse(token=token, user=user_response)


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    """Return the authenticated user's profile."""
    return doc_to_user(current_user)
