from pydantic import BaseModel, Field, field_validator


class CreateReviewRequest(BaseModel):
    rating: float = Field(..., ge=1.0, le=5.0)
    feedback: str

    @field_validator("feedback")
    @classmethod
    def validate_feedback(cls, v: str) -> str:
        trimmed = v.strip()
        if len(trimmed) < 2:
            raise ValueError("Feedback must be at least 2 characters long.")
        if len(trimmed) > 1000:
            raise ValueError("Feedback cannot exceed 1000 characters.")
        return trimmed


class ReviewResponse(BaseModel):
    id: str
    exchangeId: str
    reviewerId: str
    revieweeId: str
    reviewerName: str
    reviewerAvatar: str
    rating: float
    feedback: str
    timestamp: str


def doc_to_review(doc: dict) -> ReviewResponse:
    ts = doc.get("timestamp")
    if hasattr(ts, "isoformat"):
        ts_str = ts.isoformat()
    elif isinstance(ts, str):
        ts_str = ts
    else:
        ts_str = ""

    return ReviewResponse(
        id=str(doc["_id"]),
        exchangeId=str(doc.get("exchange_id", "")),
        reviewerId=str(doc.get("reviewer_id", "")),
        revieweeId=str(doc.get("reviewee_id", "")),
        reviewerName=doc.get("reviewer_name", "Student"),
        reviewerAvatar=doc.get("reviewer_avatar", "🎓"),
        rating=float(doc.get("rating", 5.0)),
        feedback=doc.get("feedback", ""),
        timestamp=ts_str,
    )
