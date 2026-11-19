from typing import List, Optional
from pydantic import BaseModel


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = None
    university: Optional[str] = None
    bio: Optional[str] = None
    skillsOffered: Optional[List[str]] = None
    skillsWanted: Optional[List[str]] = None
    avatar: Optional[str] = None
    category: Optional[str] = None
