from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
)
from sqlalchemy.sql import func

from app.db.session import Base


class AnalyticsEvent(Base):
    
    # Name of the table in PostgreSQL
    __tablename__ = "analytics_events"

    # Unique ID for each analytics event
    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    # ID of the user who triggered the event.
    # nullable=True because some events may come from anonymous users.
    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=True,
    )

    # Type of operation being tracked
    # Example: "search_query", "chat_query"
    event_type = Column(
        String,
        index=True,
        nullable=False,
    )

    # Time taken by the operation in milliseconds
    # Example: 250.5 means the operation took 250.5 ms
    latency_ms = Column(
        Float,
        nullable=False,
    )

    # Whether the operation succeeded or failed
    success = Column(
        Boolean,
        default=True,
        nullable=False,
    )

    # Automatically stores when this event was created
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        index=True,
    )