from sqlalchemy import Column, String, Uuid,  DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

import uuid

from app.db.session import Base

#Represents a chat session created by a user, which clusters individual chat messages.

class Conversation(Base):
    __tablename__="conversations"

    id=Column(Uuid,primary_key=True, default=uuid.uuid4)
    user_id=Column(Uuid, ForeignKey("users.id"),nullable=False)
    title=Column(String,nullable=True)
    created_at=Column(DateTime(timezone=True),server_default=func.now())

    user=relationship("User", back_populates="conversations")
    messages=relationship("ChatMessage", back_populates="conversation",cascade="all,delete-orphan")

