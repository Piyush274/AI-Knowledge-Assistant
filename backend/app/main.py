import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.documents import router as documents_router
from app.api.routes.chat import router as chat_router
from app.api.routes.analytics import router as analytics_router
from app.api.routes.speech import router as speech_router

# Rate limiter

# When a request exceeds its limit, SlowAPI raises
from slowapi.errors import RateLimitExceeded

# SlowAPI's predefined function for converting the exception into an HTTP response
from slowapi import _rate_limit_exceeded_handler

# Global limiter
from app.core.rate_limit import limiter
from fastapi.responses import JSONResponse
from fastapi import Request

# Initialize the main FastAPI application
app = FastAPI(title="AI Knowledge Assistant API", version="1.0.0")

# Auto-create tables on startup
from app.db.session import engine
from app.models import Base
Base.metadata.create_all(bind=engine)

# Attach limiter to application state object
app.state.limiter = limiter

# Custom rate limit exception handler that returns structured JSON with CORS compatibility
@app.exception_handler(RateLimitExceeded)
def custom_rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Rate limit exceeded. Please wait a moment before trying again."},
    )

# Configure CORS origins allowed to communicate with the API (React frontend)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "https://ai-knowledge-assistant-sooty.vercel.app",
]

# Allow dynamic origins from environment variables (e.g. Vercel domain)
allowed_origins_env = os.getenv("ALLOWED_ORIGINS")
if allowed_origins_env:
    origins.extend([origin.strip() for origin in allowed_origins_env.split(",") if origin.strip()])

# Allow dynamic origin regex (matches any Vercel app domain and localhost ports)
cors_regex = os.getenv(
    "CORS_ORIGIN_REGEX",
    r"^https://.*\.vercel\.app$|^https://.*\.onrender\.com$|^http://localhost(:\d+)?$|^http://127\.0\.0\.1(:\d+)?$"
)
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
    expose_headers=["*"],
)

# Register route prefixes

# Take every endpoint inside auth.py and attach it to the main application, prefix = /auth  router=/login so auth/login
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(documents_router, prefix="/documents", tags=["Documents"])
app.include_router(chat_router, prefix="/chat", tags=["Chat"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
app.include_router(speech_router, prefix="/speech", tags=["Speech"])

# Simple health check endpoint for monitoring app status
@app.get("/health")
def health_check():
    return {"status": "healthy"}
