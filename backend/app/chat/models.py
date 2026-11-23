from typing import Optional
from pydantic import BaseModel, field_validator
from app.exchanges.models import PersonSummary


class SendMessageRequest(BaseModel):
    text: str

    @field_validator("text")
    @classmethod
    def text_not_empty(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Message text cannot be empty.")
        if len(trimmed) > 2000:
            raise ValueError("Message exceeds maximum length of 2000 characters.")
        return trimmed


class MessageResponse(BaseModel):
    id: str
    exchangeId: str
    senderId: str
    receiverId: str
    text: str
    timestamp: str
    sender: Optional[PersonSummary] = None


class ConversationSummary(BaseModel):
    exchangeId: str
    peer: PersonSummary
    skillOffered: str
    skillWanted: str
    status: str
    date: str
    lastMessage: Optional[MessageResponse] = None


def doc_to_message(doc: dict, sender_summary: Optional[PersonSummary] = None) -> MessageResponse:
    ts = doc.get("timestamp")
    if hasattr(ts, "isoformat"):
        ts_str = ts.isoformat()
    elif isinstance(ts, str):
        ts_str = ts
    else:
        ts_str = ""

    return MessageResponse(
        id=str(doc["_id"]),
        exchangeId=str(doc.get("exchange_id", "")),
        senderId=str(doc.get("sender_id", "")),
        receiverId=str(doc.get("receiver_id", "")),
        text=doc.get("text", ""),
        timestamp=ts_str,
        sender=sender_summary,
    )
