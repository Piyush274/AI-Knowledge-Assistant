import os
from dotenv import load_dotenv
from fastapi import Request
from slowapi import Limiter

load_dotenv()

def get_real_client_ip(request: Request) -> str:
    # Extract client IP behind proxies (Render, Cloudflare, Vercel, AWS ALB)
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "127.0.0.1"

# To get production url if dne then local running redis server
REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://localhost:6379",
)

limiter = Limiter(
    key_func=get_real_client_ip,
    storage_uri=REDIS_URL,
)


