import os

# Limiter is responsible for tracking how many requests a client makes.
from slowapi import Limiter

# get_remote_address is a function that is used to get the remote address (client IP address) of the client from incoming HTTP request.
from slowapi.util import get_remote_address

# To get production url if dne then local running redis server
REDIS_URL = os.getenv(
    "REDIS_URL",
    "redis://localhost:6379",
)

limiter=Limiter(

    # Use the client's remote IP address as the rate-limit key, 192.168.1.10 → 20 requests/minute192.168.1.20 → 20 requests/minute
    key_func=get_remote_address,

    # Choosing where rate-limit data is stored
    storage_uri=REDIS_URL,

    # default_limits=["100/minute"]
    default_limits=["100/minute"],

)


