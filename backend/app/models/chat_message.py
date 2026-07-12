from sqlalchemy import Column, String, Uuid,  DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

import uuid

from app.db.session import Base

#Stores the individual text exchanges within a conversation (both user queries and AI assistant generated responses).

class ChatMessage(Base):
    __tablename__="chat_messages"

    id=Column(Uuid,primary_key=True, default=uuid.uuid4)
    # links the message to the parent conversation
    session_id=Column(Uuid, ForeignKey("conversations.id"),nullable=False)
    role=Column(String, nullable=False) # "user" or "assistant"
    content=Column(String, nullable=False)
    created_at=Column(DateTime(timezone=True),server_default=func.now())

    #Define the relationship back to the conversation thread
    conversation=relationship("Conversation", back_populates="messages")

