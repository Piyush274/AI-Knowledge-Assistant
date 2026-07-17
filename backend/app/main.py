from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import route handlers from the API layer
from app.api.routes.auth import router as auth_router
from app.api.routes.documents import router as documents_router
from app.api.routes.chat import router as chat_router

# Initialize the main FastAPI application
app = FastAPI(title="AI Knowledge Assistant API", version="1.0.0")

# Configure CORS origins allowed to communicate with the API (React frontend)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Apply CORS middleware to enable secure cross-origin HTTP and SSE requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route prefixes

# Take every endpoint inside auth.py and attach it to the main application, prefix = /auth  router=/login so auth/login
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(documents_router, prefix="/documents", tags=["Documents"])
app.include_router(chat_router, prefix="/chat", tags=["Chat"])

# Simple health check endpoint for monitoring app status
@app.get("/health")
def health_check():
    return {"status": "healthy"}
