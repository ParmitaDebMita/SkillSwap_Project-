from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.utils import get_current_user
from app.database import get_database
from app.exchanges.models import (
    CreateExchangeRequest,
    ExchangeResponse,
    UpdateStatusRequest,
    doc_to_exchange,
)

router = APIRouter(prefix="/exchanges", tags=["Exchanges"])


@router.get("", response_model=List[ExchangeResponse], response_model_by_alias=True)
async def list_exchanges(current_user: dict = Depends(get_current_user)):
    """
    Return all exchange requests where the current user is sender OR receiver.
    The frontend filters client-side into sent/received tabs.
    """
    db = get_database()
    user_id_str = str(current_user["_id"])

    cursor = db.exchanges.find(
        {"$or": [{"from_id": user_id_str}, {"to_id": user_id_str}]}
    ).sort("created_at", -1)

    docs = await cursor.to_list(length=200)
    return [doc_to_exchange(doc) for doc in docs]


@router.post("", response_model=ExchangeResponse, response_model_by_alias=True, status_code=status.HTTP_201_CREATED)
async def create_exchange(
    body: CreateExchangeRequest,
    current_user: dict = Depends(get_current_user),
):
    """Submit a new skill exchange request to another student."""
    db = get_database()
    current_id_str = str(current_user["_id"])

    # Prevent self-requests
    if body.toId == current_id_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot send an exchange request to yourself.",
        )

    # Verify target user exists
    try:
        target_oid = ObjectId(body.toId)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid target user ID.",
        )

    target_doc = await db.users.find_one({"_id": target_oid})
    if not target_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target student not found.",
        )

    # Prevent duplicate pending requests between same pair
    existing = await db.exchanges.find_one(
        {
            "$or": [
                {"from_id": current_id_str, "to_id": body.toId},
                {"from_id": body.toId, "to_id": current_id_str},
            ],
            "status": "pending",
        }
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A pending exchange request already exists between you and this student.",
        )

    # Build the exchange document
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    default_message = (
        body.message.strip()
        or f"Hi {target_doc.get('name', 'there')}! I would love to exchange "
        f"{body.skillOffered} for {body.skillWanted}. Let's learn together!"
    )

    new_exchange = {
        "from_id": current_id_str,
        "to_id": body.toId,
        "from": {
            "id": current_id_str,
            "name": current_user.get("name", ""),
            "avatar": current_user.get("avatar", "🎓"),
            "university": current_user.get("university", ""),
            "email": current_user.get("email", ""),
        },
        "to": {
            "id": body.toId,
            "name": target_doc.get("name", ""),
            "avatar": target_doc.get("avatar", "🎓"),
            "university": target_doc.get("university", ""),
            "email": target_doc.get("email", ""),
        },
        "skillOffered": body.skillOffered,
        "skillWanted": body.skillWanted,
        "status": "pending",
        "date": today,
        "message": default_message,
        "created_at": datetime.now(timezone.utc),
    }

    result = await db.exchanges.insert_one(new_exchange)
    new_exchange["_id"] = result.inserted_id

    return doc_to_exchange(new_exchange)


@router.patch("/{exchange_id}/status", response_model=ExchangeResponse, response_model_by_alias=True)
async def update_exchange_status(
    exchange_id: str,
    body: UpdateStatusRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Accept or reject an exchange request.
    Only the RECEIVER (to_id) may change the status.
    """
    db = get_database()
    current_id_str = str(current_user["_id"])

    try:
        ex_oid = ObjectId(exchange_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid exchange ID.",
        )

    exchange_doc = await db.exchanges.find_one({"_id": ex_oid})
    if not exchange_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exchange request not found.",
        )

    # Only the receiver can accept/reject
    if exchange_doc.get("to_id") != current_id_str:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the receiver of this request can accept or reject it.",
        )

    # Must be pending to change status
    if exchange_doc.get("status") != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This request is already {exchange_doc.get('status')}.",
        )

    # Update status
    updated_doc = await db.exchanges.find_one_and_update(
        {"_id": ex_oid},
        {"$set": {"status": body.status}},
        return_document=True,
    )

    # If accepted: increment exchanges counter for both participants
    if body.status == "accepted":
        from_id_str = exchange_doc.get("from_id", "")
        try:
            from_oid = ObjectId(from_id_str)
            to_oid = ObjectId(current_id_str)
            await db.users.update_many(
                {"_id": {"$in": [from_oid, to_oid]}},
                {"$inc": {"exchanges": 1}},
            )
        except Exception:
            pass  # Non-critical — exchange is updated regardless

    return doc_to_exchange(updated_doc)
