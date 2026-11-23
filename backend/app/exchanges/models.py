from typing import Literal, Optional
from pydantic import BaseModel, Field, ConfigDict


class CreateExchangeRequest(BaseModel):
    toId: str
    skillOffered: str
    skillWanted: str
    message: Optional[str] = ""


class UpdateStatusRequest(BaseModel):
    status: Literal["accepted", "rejected", "completed"]


class ScheduleSessionRequest(BaseModel):
    date: str
    time: str
    note: Optional[str] = ""


class SessionInfo(BaseModel):
    date: Optional[str] = None
    time: Optional[str] = None
    status: Optional[str] = "scheduled"  # scheduled, rescheduled, cancelled, completed
    note: Optional[str] = ""
    updatedAt: Optional[str] = None
    updatedBy: Optional[str] = None


class PersonSummary(BaseModel):
    id: str
    name: str
    avatar: str
    university: str
    email: str


class ExchangeResponse(BaseModel):
    """
    Exchange object matching the frontend's expected shape.
    The 'from' field is a reserved Python keyword, so we store it as
    'from_field' internally and alias it to 'from' in JSON output.
    """
    model_config = ConfigDict(populate_by_name=True)

    id: str
    fromId: str
    toId: str
    from_field: PersonSummary = Field(..., alias="from")
    to: PersonSummary
    skillOffered: str
    skillWanted: str
    status: str
    date: str
    message: str
    session: Optional[SessionInfo] = None


def doc_to_exchange(doc: dict) -> ExchangeResponse:
    from_data = doc.get("from", {})
    to_data = doc.get("to", {})
    session_data = doc.get("session")

    session_obj = None
    if session_data and isinstance(session_data, dict):
        session_obj = SessionInfo(
            date=session_data.get("date"),
            time=session_data.get("time"),
            status=session_data.get("status", "scheduled"),
            note=session_data.get("note", ""),
            updatedAt=session_data.get("updatedAt") or session_data.get("updated_at"),
            updatedBy=session_data.get("updatedBy") or session_data.get("updated_by"),
        )

    return ExchangeResponse.model_validate({
        "id": str(doc["_id"]),
        "fromId": str(doc.get("from_id", "")),
        "toId": str(doc.get("to_id", "")),
        "from": PersonSummary(
            id=str(from_data.get("id", "")),
            name=from_data.get("name", ""),
            avatar=from_data.get("avatar", "🎓"),
            university=from_data.get("university", ""),
            email=from_data.get("email", ""),
        ),
        "to": PersonSummary(
            id=str(to_data.get("id", "")),
            name=to_data.get("name", ""),
            avatar=to_data.get("avatar", "🎓"),
            university=to_data.get("university", ""),
            email=to_data.get("email", ""),
        ),
        "skillOffered": doc.get("skillOffered", ""),
        "skillWanted": doc.get("skillWanted", ""),
        "status": doc.get("status", "pending"),
        "date": doc.get("date", ""),
        "message": doc.get("message", ""),
        "session": session_obj,
    })
