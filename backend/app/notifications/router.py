from datetime import datetime, timezone
from typing import List

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.utils import get_current_user
from app.database import get_database
from app.notifications.models import NotificationResponse, doc_to_notification

router = APIRouter(prefix="/notifications", tags=["Notifications"])


async def create_notification(
    user_id: str,
    title: str,
    message: str,
    link: str = "",
    notif_type: str = "info",
):
    """Internal helper to dispatch an in-app notification to a user."""
    db = get_database()
    now = datetime.now(timezone.utc)
    notif_doc = {
        "user_id": str(user_id),
        "title": title,
        "message": message,
        "type": notif_type,
        "link": link,
        "read": False,
        "timestamp": now,
        "created_at": now,
    }
    await db.notifications.insert_one(notif_doc)


@router.get("", response_model=List[NotificationResponse])
async def get_my_notifications(current_user: dict = Depends(get_current_user)):
    """Retrieve notifications for the authenticated user."""
    db = get_database()
    current_id_str = str(current_user["_id"])

    cursor = db.notifications.find({"user_id": current_id_str}).sort("timestamp", -1).limit(50)
    docs = await cursor.to_list(length=50)
    return [doc_to_notification(d) for d in docs]


@router.patch("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Mark a single notification as read."""
    db = get_database()
    try:
        oid = ObjectId(notification_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid notification ID.")

    result = await db.notifications.update_one(
        {"_id": oid, "user_id": str(current_user["_id"])},
        {"$set": {"read": True}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    return {"success": True}


@router.patch("/read-all")
async def mark_all_notifications_as_read(current_user: dict = Depends(get_current_user)):
    """Mark all notifications as read for current user."""
    db = get_database()
    await db.notifications.update_many(
        {"user_id": str(current_user["_id"]), "read": False},
        {"$set": {"read": True}},
    )
    return {"success": True}
