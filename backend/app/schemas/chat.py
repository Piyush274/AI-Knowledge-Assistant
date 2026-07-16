from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

# schema file validates request bodies for creating new chat sessions and sending user messages, as well as formatting responses containing chat histories and message lists.


class MessageCreate(BaseModel):
    content: str


class MessageResponse(BaseModel):
    id: UUID
    session_id: UUID
    role: str
    content: str
    created_at: datetime

    model_config = {
        "from_attributes": True
    }


class SessionCreate(BaseModel):
    title: str | None = None


class SessionResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str | None
    created_at: datetime
    messages: list[MessageResponse] = Field(default_factory=list)

    model_config = {
        "from_attributes": True
    }