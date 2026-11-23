from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.utils import get_current_user
from app.database import get_database
from app.moderation.models import BlockUserRequest, ReportUserRequest

router = APIRouter(prefix="/moderation", tags=["Moderation & Safety"])


def _user_to_brief(doc: dict) -> dict:
    """Return a minimal public dict for a user document."""
    return {
        "id": str(doc["_id"]),
        "name": doc.get("name", "Unknown Student"),
        "avatar": doc.get("avatar", "🎓"),
        "university": doc.get("university", ""),
    }


@router.post("/report")
async def report_user(
    body: ReportUserRequest,
    current_user: dict = Depends(get_current_user),
):
    """Report an inappropriate user."""
    db = get_database()
    current_id_str = str(current_user["_id"])

    if body.reportedUserId == current_id_str:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot report yourself.")

    try:
        reported_oid = ObjectId(body.reportedUserId)
    except Exception:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user ID.")

    target = await db.users.find_one({"_id": reported_oid})
    if not target:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Target user not found.")

    report_doc = {
        "reporter_id": current_id_str,
        "reported_user_id": body.reportedUserId,
        "reason": body.reason,
        "details": body.details or "",
        "created_at": datetime.now(timezone.utc),
        "status": "pending_review",
    }
    await db.reports.insert_one(report_doc)
    return {"success": True, "message": "Report submitted. Our moderation team will review this promptly."}


@router.post("/block")
async def block_user(
    body: BlockUserRequest,
    current_user: dict = Depends(get_current_user),
):
    """Block another user to prevent contact."""
    db = get_database()
    current_id_str = str(current_user["_id"])

    if body.blockedUserId == current_id_str:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="You cannot block yourself.")

    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$addToSet": {"blockedUsers": body.blockedUserId}},
    )
    return {"success": True, "message": "User has been blocked successfully."}


@router.post("/unblock")
async def unblock_user(
    body: BlockUserRequest,
    current_user: dict = Depends(get_current_user),
):
    """Unblock a previously blocked user."""
    db = get_database()
    await db.users.update_one(
        {"_id": current_user["_id"]},
        {"$pull": {"blockedUsers": body.blockedUserId}},
    )
    return {"success": True, "message": "User has been unblocked."}


@router.get("/blocked")
async def get_blocked_users(
    current_user: dict = Depends(get_current_user),
):
    """Return the list of users blocked by the current user, with public profile info."""
    db = get_database()
    blocked_ids: list = current_user.get("blockedUsers", [])
    if not blocked_ids:
        return {"blockedUsers": []}

    # Convert to ObjectIds, skip any malformed entries
    oids = []
    for bid in blocked_ids:
        try:
            oids.append(ObjectId(bid))
        except Exception:
            pass

    if not oids:
        return {"blockedUsers": []}

    docs = await db.users.find({"_id": {"$in": oids}}).to_list(length=len(oids))
    return {"blockedUsers": [_user_to_brief(d) for d in docs]}
