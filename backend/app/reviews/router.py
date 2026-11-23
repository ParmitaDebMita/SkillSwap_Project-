from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.utils import get_current_user
from app.database import get_database
from app.notifications.router import create_notification
from app.reviews.models import CreateReviewRequest, ReviewResponse, doc_to_review

router = APIRouter(prefix="/reviews", tags=["Reviews & Feedback"])


@router.post("/{exchange_id}", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def submit_review(
    exchange_id: str,
    body: CreateReviewRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Submit rating and feedback after completing an exchange.
    Enforces authorization, completed exchange status, and prevents duplicate reviews.
    """
    db = get_database()
    current_id_str = str(current_user["_id"])

    try:
        ex_oid = ObjectId(exchange_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid exchange ID.")

    exchange_doc = await db.exchanges.find_one({"_id": ex_oid})
    if not exchange_doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exchange not found.")

    from_id = str(exchange_doc.get("from_id"))
    to_id = str(exchange_doc.get("to_id"))

    if current_id_str not in (from_id, to_id):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a participant in this exchange.")

    # Status must be completed (or accepted)
    status_val = exchange_doc.get("status")
    if status_val not in ("completed", "accepted"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Reviews can only be submitted for completed exchanges. Current status: {status_val}.",
        )

    # Check for duplicate review by current user for this exchange
    existing = await db.reviews.find_one({
        "exchange_id": exchange_id,
        "reviewer_id": current_id_str,
    })
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted feedback for this exchange.",
        )

    reviewee_id = to_id if current_id_str == from_id else from_id
    now = datetime.now(timezone.utc)

    review_doc = {
        "exchange_id": exchange_id,
        "reviewer_id": current_id_str,
        "reviewee_id": reviewee_id,
        "reviewer_name": current_user.get("name", "Student"),
        "reviewer_avatar": current_user.get("avatar", "🎓"),
        "rating": round(float(body.rating), 1),
        "feedback": body.feedback,
        "timestamp": now,
        "created_at": now,
    }

    result = await db.reviews.insert_one(review_doc)
    review_doc["_id"] = result.inserted_id

    # Recalculate average rating for the reviewee
    pipeline = [
        {"$match": {"reviewee_id": reviewee_id}},
        {"$group": {"_id": None, "avgRating": {"$avg": "$rating"}}},
    ]
    agg = await db.reviews.aggregate(pipeline).to_list(length=1)
    if agg:
        new_rating = round(float(agg[0]["avgRating"]), 1)
        try:
            reviewee_oid = ObjectId(reviewee_id)
            await db.users.update_one({"_id": reviewee_oid}, {"$set": {"rating": new_rating}})
        except Exception:
            pass

    # Notify reviewee
    await create_notification(
        user_id=reviewee_id,
        title="⭐ New Review Received",
        message=f"{current_user.get('name', 'Peer')} rated you {body.rating}★: \"{body.feedback[:60]}\"",
        link="/requests",
        notif_type="review",
    )

    return doc_to_review(review_doc)


@router.get("/{exchange_id}", response_model=List[ReviewResponse])
async def get_exchange_reviews(
    exchange_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Retrieve all reviews left for a specific exchange."""
    db = get_database()
    cursor = db.reviews.find({"exchange_id": exchange_id}).sort("timestamp", -1)
    docs = await cursor.to_list(length=10)
    return [doc_to_review(d) for d in docs]


@router.get("/users/{user_id}", response_model=List[ReviewResponse])
async def get_user_reviews(user_id: str):
    """Publicly retrieve reviews received by a user."""
    db = get_database()
    cursor = db.reviews.find({"reviewee_id": user_id}).sort("timestamp", -1).limit(20)
    docs = await cursor.to_list(length=20)
    return [doc_to_review(d) for d in docs]
