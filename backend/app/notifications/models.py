from typing import Optional
from pydantic import BaseModel


class NotificationResponse(BaseModel):
    id: str
    userId: str
    title: str
    message: str
    type: str  # request, accept, complete, message, session, review
    link: Optional[str] = ""
    read: bool = False
    timestamp: str


def doc_to_notification(doc: dict) -> NotificationResponse:
    ts = doc.get("timestamp")
    if hasattr(ts, "isoformat"):
        ts_str = ts.isoformat()
    elif isinstance(ts, str):
        ts_str = ts
    else:
        ts_str = ""

    return NotificationResponse(
        id=str(doc["_id"]),
        userId=str(doc.get("user_id", "")),
        title=doc.get("title", ""),
        message=doc.get("message", ""),
        type=doc.get("type", "info"),
        link=doc.get("link", ""),
        read=bool(doc.get("read", False)),
        timestamp=ts_str,
    )
