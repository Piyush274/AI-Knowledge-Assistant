import uuid
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.analytics import AnalyticsEvent


# Inserts a new row into analytics_events
def log_query_metrics(
    db: Session,
    user_id: uuid.UUID | str | None,
    event_type: str,
    latency_ms: float,
    success: bool = True,
):
    """
    Store performance metrics for one application event.

    Parameters:
        db:
            SQLAlchemy database session.

        user_id:
            ID of the user who triggered the event.
            Can be None for anonymous users.

        event_type:
            Type of operation being tracked.
            Example:
            - "search_query"
            - "chat_query"
            - "document_ingestion"

        latency_ms:
            Time taken by the operation in milliseconds.

        success:
            Whether the operation succeeded.
            Defaults to True.
    """

    # Create a new AnalyticsEvent Python object
    event = AnalyticsEvent(
        user_id=user_id,
        event_type=event_type,
        latency_ms=latency_ms,
        success=success,
    )

    # Add the object to the current database session
    db.add(event)

    # Permanently save the event to PostgreSQL
    db.commit()

    # Refresh the object with database-generated values
    # such as id and created_at
    db.refresh(event)

    # Return the saved analytics event
    return event


# Queries aggregate statistics (COUNT, AVG(latency_ms), error rates
def get_analytics_summary(db: Session):

    """
    Calculate aggregate analytics statistics.

    Returns:
        A dictionary containing:
        - total_queries
        - avg_latency_ms
        - success_rate
    """

    # Count the total number of analytics events
    # func.count(AnalyticsEvent.id) == COUNT(analytics_events.id)
    # A query normally returns a SQLAlchemy result object - Database Result Object
    # We use .scalar() to extract the actual value.
#     Without scalar:
# ┌──────────────────┐
# │ Row / Result     │
# │                  │
# │      4           │
# └──────────────────┘
#         ↓
#       (4,)
# 
# 
# With scalar:
#         ↓
#         4
    
    total_queries = (
        db.query(
            func.count(AnalyticsEvent.id)
        )
        .scalar()
        or 0
    )

    # Calculate the average latency of all events
    avg_latency = (
        db.query(
            func.avg(AnalyticsEvent.latency_ms)
        )
        .scalar()
        or 0.0 # Returns 0.0 if total_queries is None
    )

    # Count only successful events
    successful_queries = (
        db.query(
            func.count(AnalyticsEvent.id)
        )
        .filter(
            AnalyticsEvent.success.is_(True)
        )
        .scalar()
        or 0
    )

    # Calculate the success percentage
    success_rate = (
        (successful_queries / total_queries) * 100
        if total_queries > 0
        else 100.0
    )

    # Return a clean summary object
    return {
        "total_queries": total_queries,
        "avg_latency_ms": round(float(avg_latency), 2),
        "success_rate": round(success_rate, 2),
    }