from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.utils import get_current_user
from app.database import get_database
from app.notifications.router import create_notification
from app.exchanges.models import (
    CreateExchangeRequest,
    ExchangeResponse,
    ScheduleSessionRequest,
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

    # Prevent exchange if either user has blocked the other
    current_blocked = current_user.get("blockedUsers", [])
    target_blocked = target_doc.get("blockedUsers", [])
    if body.toId in current_blocked or current_id_str in target_blocked:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot send an exchange request to this student.",
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

    # Create notification for receiver
    await create_notification(
        user_id=body.toId,
        title="📥 New Skill Exchange Request",
        message=f"{current_user.get('name', 'A peer')} proposed: {body.skillOffered} ⇄ {body.skillWanted}",
        link="/requests",
        notif_type="request",
    )

    return doc_to_exchange(new_exchange)


@router.patch("/{exchange_id}/status", response_model=ExchangeResponse, response_model_by_alias=True)
async def update_exchange_status(
    exchange_id: str,
    body: UpdateStatusRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Accept, reject, or mark an exchange as completed.
    - Only the RECEIVER (to_id) can accept or reject a pending request.
    - EITHER participant can mark an accepted exchange as completed.
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

    from_id_str = str(exchange_doc.get("from_id", ""))
    to_id_str = str(exchange_doc.get("to_id", ""))

    # Handling 'completed' status
    if body.status == "completed":
        if current_id_str not in (from_id_str, to_id_str):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to complete this exchange.",
            )
        if exchange_doc.get("status") != "accepted":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only accepted exchanges can be marked as completed. Current status: {exchange_doc.get('status')}.",
            )

        updated_doc = await db.exchanges.find_one_and_update(
            {"_id": ex_oid},
            {"$set": {"status": "completed", "completed_at": datetime.now(timezone.utc)}},
            return_document=True,
        )

        other_id = from_id_str if current_id_str == to_id_str else to_id_str
        await create_notification(
            user_id=other_id,
            title="🎉 Exchange Completed",
            message=f"{current_user.get('name', 'Peer')} marked your exchange as completed! Please share your feedback.",
            link="/requests",
            notif_type="complete",
        )
        return doc_to_exchange(updated_doc)

    # For 'accepted' or 'rejected': Only receiver can update
    if to_id_str != current_id_str:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the receiver of this request can accept or reject it.",
        )

    # Must be pending to change to accepted/rejected
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

    # If accepted: increment exchanges counter for both participants and create connection
    if body.status == "accepted":
        try:
            from_oid = ObjectId(from_id_str)
            to_oid = ObjectId(current_id_str)
            await db.users.update_many(
                {"_id": {"$in": [from_oid, to_oid]}},
                {"$inc": {"exchanges": 1}},
            )
            # Automatically create or enable private connection between the two students
            await db.connections.update_one(
                {"exchange_id": str(ex_oid)},
                {
                    "$set": {
                        "exchange_id": str(ex_oid),
                        "user1_id": from_id_str,
                        "user2_id": current_id_str,
                        "connected_at": datetime.now(timezone.utc),
                        "status": "connected",
                    }
                },
                upsert=True,
            )
        except Exception:
            pass

        # Notify sender
        await create_notification(
            user_id=from_id_str,
            title="✅ Exchange Request Accepted!",
            message=f"{current_user.get('name', 'Peer')} accepted your exchange proposal! You can now chat and schedule a session.",
            link="/requests",
            notif_type="accept",
        )

    elif body.status == "rejected":
        # Notify sender
        await create_notification(
            user_id=from_id_str,
            title="Exchange Request Declined",
            message=f"{current_user.get('name', 'Peer')} was unable to accept your skill exchange proposal.",
            link="/requests",
            notif_type="info",
        )

    return doc_to_exchange(updated_doc)


@router.post("/{exchange_id}/schedule", response_model=ExchangeResponse, response_model_by_alias=True)
async def schedule_session(
    exchange_id: str,
    body: ScheduleSessionRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Schedule or reschedule a learning session inside an accepted exchange.
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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized for this exchange.")

    if exchange_doc.get("status") not in ("accepted", "completed"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Sessions can only be scheduled for accepted exchanges. Current status: {exchange_doc.get('status')}.",
        )

    is_reschedule = bool(exchange_doc.get("session"))
    session_status = "rescheduled" if is_reschedule else "scheduled"

    session_payload = {
        "date": body.date.strip(),
        "time": body.time.strip(),
        "note": body.note.strip() if body.note else "",
        "status": session_status,
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "updatedBy": current_id_str,
    }

    updated_doc = await db.exchanges.find_one_and_update(
        {"_id": ex_oid},
        {"$set": {"session": session_payload}},
        return_document=True,
    )

    # Notify peer
    other_id = to_id if current_id_str == from_id else from_id
    action_label = "Rescheduled" if is_reschedule else "Scheduled"
    await create_notification(
        user_id=other_id,
        title=f"📅 Session {action_label}",
        message=f"{current_user.get('name', 'Peer')} {action_label.lower()} a session for {body.date} at {body.time}.",
        link="/requests",
        notif_type="session",
    )

    return doc_to_exchange(updated_doc)


@router.post("/{exchange_id}/schedule/cancel", response_model=ExchangeResponse, response_model_by_alias=True)
async def cancel_session(
    exchange_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Cancel a scheduled learning session.
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
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not authorized for this exchange.")

    if not exchange_doc.get("session"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No session found to cancel.")

    updated_doc = await db.exchanges.find_one_and_update(
        {"_id": ex_oid},
        {"$set": {
            "session.status": "cancelled",
            "session.updatedAt": datetime.now(timezone.utc).isoformat(),
            "session.updatedBy": current_id_str,
        }},
        return_document=True,
    )

    other_id = to_id if current_id_str == from_id else from_id
    await create_notification(
        user_id=other_id,
        title="Session Cancelled",
        message=f"{current_user.get('name', 'Peer')} cancelled the scheduled session.",
        link="/requests",
        notif_type="session",
    )

    return doc_to_exchange(updated_doc)
