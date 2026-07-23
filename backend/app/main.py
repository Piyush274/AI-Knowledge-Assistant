import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import route handlers from the API layer
from app.api.routes.auth import router as auth_router
from app.api.routes.documents import router as documents_router
from app.api.routes.chat import router as chat_router
from app.api.routes.analytics import router as analytics_router

# Rate limiter

# When a request exceeds its limit, SlowAPI raises
from slowapi.errors import RateLimitExceeded

# SlowAPI's predefined function for converting the exception into an HTTP response
from slowapi import _rate_limit_exceeded_handler

# Global limiter
from app.core.rate_limit import limiter

# Initialize the main FastAPI application
app = FastAPI(title="AI Knowledge Assistant API", version="1.0.0")

# Auto-create tables on startup
from app.db.session import engine
from app.models import Base
Base.metadata.create_all(bind=engine)

# Attach limiter to application state object where application-wide objects can be stored
app.state.limiter=limiter

# Register the exception handler, RateLimitExceeded occurs, use _rate_limit_exceeded_handler to handle it
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configure CORS origins allowed to communicate with the API (React frontend)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Allow dynamic origins from environment variables (e.g. Vercel domain)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    origins.extend([origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()])

# Allow dynamic origin regex from environment variable (default matches user's Vercel subdomains)
cors_regex = os.getenv("CORS_ORIGIN_REGEX", r"https://ai-knowledge-assistant-.*\.vercel\.app")
if cors_regex == "":
    cors_regex = None

# Apply CORS middleware to enable secure cross-origin HTTP and SSE requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=cors_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route prefixes

# Take every endpoint inside auth.py and attach it to the main application, prefix = /auth  router=/login so auth/login
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(documents_router, prefix="/documents", tags=["Documents"])
app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])

# Simple health check endpoint for monitoring app status
@app.get("/health")
def health_check():
    return {"status": "healthy"}
