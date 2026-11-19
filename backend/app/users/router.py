import re
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.models import UserResponse, doc_to_user
from app.auth.utils import get_current_user
from app.database import get_database
from app.users.models import ProfileUpdateRequest
from bson import ObjectId

router = APIRouter(tags=["Users & Students"])


@router.put("/users/profile", response_model=UserResponse)
async def update_profile(
    body: ProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update the authenticated user's profile fields."""
    db = get_database()

    # Build update document from only the provided (non-None) fields
    update_fields = {k: v for k, v in body.model_dump().items() if v is not None}

    if not update_fields:
        # Nothing to update — return current profile as-is
        return doc_to_user(current_user)

    result = await db.users.find_one_and_update(
        {"_id": current_user["_id"]},
        {"$set": update_fields},
        return_document=True,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    return doc_to_user(result)


@router.get("/students", response_model=List[UserResponse])
async def get_students(
    search: Optional[str] = Query(None, description="Search across name, skills, university, bio"),
    category: Optional[str] = Query(None, description="Filter by skill category"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Results per page"),
):
    """
    Return a paginated list of students.
    Supports full-text search and category filtering.
    Does NOT require authentication (public directory).
    """
    db = get_database()
    query: dict = {}

    # Search filter: match name, skillsOffered, skillsWanted, university, bio
    if search and search.strip():
        escaped = re.escape(search.strip())
        regex = {"$regex": escaped, "$options": "i"}
        query["$or"] = [
            {"name": regex},
            {"skillsOffered": regex},
            {"skillsWanted": regex},
            {"university": regex},
            {"bio": regex},
        ]

    # Category filter
    if category and category.strip() and category.strip().lower() != "all":
        query["category"] = {"$regex": re.escape(category.strip()), "$options": "i"}

    skip = (page - 1) * limit
    cursor = db.users.find(query, {"hashed_password": 0}).skip(skip).limit(limit)
    docs = await cursor.to_list(length=limit)

    return [doc_to_user(doc) for doc in docs]
