from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

# Defines the validation model used when returning document details (like ID, filename, upload status, and creation time) to the client


class DocumentResponse(BaseModel):
    id: UUID
    user_id: UUID | None
    filename: str
    status: str
    uploaded_at: datetime

    model_config = {
        "from_attributes": True
    }