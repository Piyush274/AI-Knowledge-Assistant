from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.models.analytics import AnalyticsEvent
from app.models.user import User
from app.models.document import Document

router = APIRouter()

def get_relative_time(dt):
    now = datetime.utcnow()
    if dt.tzinfo:
        dt = dt.replace(tzinfo=None)
    diff = now - dt
    seconds = diff.total_seconds()
    if seconds < 60:
        return "just now"
    minutes = seconds // 60
    if minutes < 60:
        return f"{int(minutes)} mins ago"
    hours = minutes // 60
    if hours < 24:
        return f"{int(hours)} hours ago"
    days = hours // 24
    return f"{int(days)} days ago"

@router.get("/dashboard")
def get_analytics_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # 1. Total Active Users count
    active_users = db.query(func.count(User.id)).scalar() or 0

    # 2. Total Files Ingested count
    files_ingested = db.query(func.count(Document.id)).scalar() or 0

    # 3. Chat queries in the last 24 hours
    yesterday = datetime.utcnow() - timedelta(days=1)
    queries_24h = (
        db.query(func.count(AnalyticsEvent.id))
        .filter(
            AnalyticsEvent.event_type == "chat_query",
            AnalyticsEvent.created_at >= yesterday
        )
        .scalar()
        or 0
    )

    # 4. Average latency of chat queries
    avg_latency = (
        db.query(func.avg(AnalyticsEvent.latency_ms))
        .filter(AnalyticsEvent.event_type == "chat_query")
        .scalar()
        or 0.0
    )

    # 5. Daily statistics (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    events = (
        db.query(
            cast(AnalyticsEvent.created_at, Date).label("date"),
            AnalyticsEvent.event_type,
            func.count(AnalyticsEvent.id).label("count"),
            func.avg(AnalyticsEvent.latency_ms).label("avg_latency")
        )
        .filter(AnalyticsEvent.created_at >= seven_days_ago)
        .group_by(cast(AnalyticsEvent.created_at, Date), AnalyticsEvent.event_type)
        .all()
    )

    # Form daily stats dictionary mapped to dates
    stats_by_day = {}
    for i in range(6, -1, -1):
        day_date = (datetime.utcnow() - timedelta(days=i)).date()
        day_name = day_date.strftime("%a")
        stats_by_day[day_date] = {
            "day": day_name,
            "queries": 0,
            "latency": 0.0,
            "uploads": 0
        }

    # Fill actual values from db events
    for row in events:
        row_date = row.date
        if row_date in stats_by_day:
            if row.event_type == "chat_query":
                stats_by_day[row_date]["queries"] = row.count
                stats_by_day[row_date]["latency"] = round(float(row.avg_latency), 1)
            elif row.event_type == "document_ingestion":
                stats_by_day[row_date]["uploads"] = row.count

    daily_stats = list(stats_by_day.values())

    # 6. Recent Audit Log Events (10 most recent)
    recent_events_raw = (
        db.query(AnalyticsEvent, User.email)
        .outerjoin(User, AnalyticsEvent.user_id == User.id)
        .order_by(AnalyticsEvent.created_at.desc())
        .limit(10)
        .all()
    )

    recent_activities = []
    for event, email in recent_events_raw:
        user_label = email if email else "anonymous@example.com"
        
        # Friendly description
        if event.event_type == "chat_query":
            target_desc = "Semantic search query"
            type_label = "query"
        elif event.event_type == "document_ingestion":
            target_desc = "Document ingestion pipeline"
            type_label = "upload"
        else:
            target_desc = f"{event.event_type.capitalize()} operation"
            type_label = "other"

        recent_activities.append({
            "id": event.id,
            "type": type_label,
            "user": user_label,
            "target": target_desc,
            "time": get_relative_time(event.created_at)
        })

    return {
        "active_users": active_users,
        "files_ingested": files_ingested,
        "queries_24h": queries_24h,
        "avg_latency": round(float(avg_latency), 1),
        "daily_stats": daily_stats,
        "recent_activities": recent_activities
    }
