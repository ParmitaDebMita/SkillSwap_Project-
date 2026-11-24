from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.utils import get_current_user
from app.database import get_database
from app.notifications.router import create_notification
from app.exchanges.models import PersonSummary
from app.chat.models import (
    ConversationSummary,
    MessageResponse,
    SendMessageRequest,
    doc_to_message,
)

router = APIRouter(prefix="/chat", tags=["Chat & Messaging"])


def _extract_peer(exchange_doc: dict, current_user_id: str) -> PersonSummary:
    from_data = exchange_doc.get("from", {})
    to_data = exchange_doc.get("to", {})

    if str(exchange_doc.get("from_id")) == current_user_id:
        return PersonSummary(
            id=str(to_data.get("id", exchange_doc.get("to_id", ""))),
            name=to_data.get("name", ""),
            avatar=to_data.get("avatar", "🎓"),
            university=to_data.get("university", ""),
            email=to_data.get("email", ""),
        )
    else:
        return PersonSummary(
            id=str(from_data.get("id", exchange_doc.get("from_id", ""))),
            name=from_data.get("name", ""),
            avatar=from_data.get("avatar", "🎓"),
            university=from_data.get("university", ""),
            email=from_data.get("email", ""),
        )


async def _get_authorized_exchange(exchange_id: str, current_user_id: str) -> dict:
    db = get_database()
    try:
        ex_oid = ObjectId(exchange_id)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid exchange ID format.",
        )

    exchange_doc = await db.exchanges.find_one({"_id": ex_oid})
    if not exchange_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Exchange not found.",
        )

    from_id = str(exchange_doc.get("from_id"))
    to_id = str(exchange_doc.get("to_id"))

    if current_user_id not in (from_id, to_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to access this conversation.",
        )

    if exchange_doc.get("status") != "accepted":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Chat is only accessible for accepted skill exchanges. Current status: {exchange_doc.get('status')}.",
        )

    return exchange_doc


@router.get("/conversations", response_model=List[ConversationSummary])
async def list_conversations(current_user: dict = Depends(get_current_user)):
    """
    List all active chat conversations for the current user.
    Only exchanges with status='accepted' are included.
    """
    db = get_database()
    current_id_str = str(current_user["_id"])

    # Query only accepted exchanges where user is sender or receiver
    cursor = db.exchanges.find({
        "$or": [{"from_id": current_id_str}, {"to_id": current_id_str}],
        "status": "accepted",
    }).sort("created_at", -1)

    exchanges = await cursor.to_list(length=100)
    conversations: List[ConversationSummary] = []

    for ex in exchanges:
        ex_id_str = str(ex["_id"])
        peer = _extract_peer(ex, current_id_str)

        # Retrieve the latest message for preview
        last_msg_doc = await db.messages.find_one(
            {"exchange_id": ex_id_str},
            sort=[("timestamp", -1)],
        )

        last_message = None
        if last_msg_doc:
            last_message = doc_to_message(last_msg_doc)

        # Dynamic skill exchange description from perspective of current user
        is_initiator = str(ex.get("from_id")) == current_id_str
        my_offer = ex.get("skillOffered") if is_initiator else ex.get("skillWanted")
        my_want = ex.get("skillWanted") if is_initiator else ex.get("skillOffered")

        conversations.append(
            ConversationSummary(
                exchangeId=ex_id_str,
                peer=peer,
                skillOffered=str(my_offer or ""),
                skillWanted=str(my_want or ""),
                status=ex.get("status", "accepted"),
                date=ex.get("date", ""),
                lastMessage=last_message,
            )
        )

    return conversations


@router.get("/{exchange_id}", response_model=ConversationSummary)
async def get_conversation_details(
    exchange_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Get conversation metadata for a specific accepted exchange.
    Enforces authorization and accepted status.
    """
    db = get_database()
    current_id_str = str(current_user["_id"])
    ex = await _get_authorized_exchange(exchange_id, current_id_str)

    peer = _extract_peer(ex, current_id_str)
    last_msg_doc = await db.messages.find_one(
        {"exchange_id": exchange_id},
        sort=[("timestamp", -1)],
    )

    last_message = doc_to_message(last_msg_doc) if last_msg_doc else None

    is_initiator = str(ex.get("from_id")) == current_id_str
    my_offer = ex.get("skillOffered") if is_initiator else ex.get("skillWanted")
    my_want = ex.get("skillWanted") if is_initiator else ex.get("skillOffered")

    return ConversationSummary(
        exchangeId=exchange_id,
        peer=peer,
        skillOffered=str(my_offer or ""),
        skillWanted=str(my_want or ""),
        status=ex.get("status", "accepted"),
        date=ex.get("date", ""),
        lastMessage=last_message,
    )


@router.get("/{exchange_id}/messages", response_model=List[MessageResponse])
async def get_messages(
    exchange_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Get all messages for an accepted exchange conversation.
    Only the two students in the accepted exchange can read messages.
    """
    db = get_database()
    current_id_str = str(current_user["_id"])
    ex = await _get_authorized_exchange(exchange_id, current_id_str)

    # Build summaries for both participants
    from_id = str(ex.get("from_id"))
    to_id = str(ex.get("to_id"))
    from_data = ex.get("from", {})
    to_data = ex.get("to", {})

    sender_map = {
        from_id: PersonSummary(
            id=from_id,
            name=from_data.get("name", "Student"),
            avatar=from_data.get("avatar", "🎓"),
            university=from_data.get("university", ""),
            email=from_data.get("email", ""),
        ),
        to_id: PersonSummary(
            id=to_id,
            name=to_data.get("name", "Student"),
            avatar=to_data.get("avatar", "🎓"),
            university=to_data.get("university", ""),
            email=to_data.get("email", ""),
        ),
    }

    cursor = db.messages.find({"exchange_id": exchange_id}).sort("timestamp", 1)
    docs = await cursor.to_list(length=500)

    return [
        doc_to_message(d, sender_map.get(str(d.get("sender_id"))))
        for d in docs
    ]


@router.post("/{exchange_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    exchange_id: str,
    body: SendMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Send a new message in an accepted exchange conversation.
    Stores the message in the MongoDB `messages` collection.
    """
    db = get_database()
    current_id_str = str(current_user["_id"])
    ex = await _get_authorized_exchange(exchange_id, current_id_str)

    from_id = str(ex.get("from_id"))
    to_id = str(ex.get("to_id"))

    # Determine receiver
    receiver_id = to_id if current_id_str == from_id else from_id

    # Check if either user has blocked the other
    receiver_doc = await db.users.find_one({"_id": ObjectId(receiver_id)})
    if receiver_doc:
        current_blocked = current_user.get("blockedUsers", [])
        receiver_blocked = receiver_doc.get("blockedUsers", [])
        if receiver_id in current_blocked or current_id_str in receiver_blocked:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot send messages because one of the users is blocked.",
            )

    now = datetime.now(timezone.utc)
    new_message = {
        "exchange_id": exchange_id,
        "sender_id": current_id_str,
        "receiver_id": receiver_id,
        "text": body.text,
        "timestamp": now,
        "created_at": now,
    }

    result = await db.messages.insert_one(new_message)
    new_message["_id"] = result.inserted_id

    # Create notification for recipient
    await create_notification(
        user_id=receiver_id,
        title="💬 New Message",
        message=f"{current_user.get('name', 'Peer')}: {body.text[:60]}",
        link="/requests",
        notif_type="message",
    )

    sender_summary = PersonSummary(
        id=current_id_str,
        name=current_user.get("name", "Student"),
        avatar=current_user.get("avatar", "🎓"),
        university=current_user.get("university", ""),
        email=current_user.get("email", ""),
    )

    return doc_to_message(new_message, sender_summary)
