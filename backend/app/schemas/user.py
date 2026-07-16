# The user.py file defines the input/output validation models (Pydantic schemas) for user registrations, logins, tokens, and profile
# This decouples our database models from the client-facing APIs, ensuring safe input validation and preventing sensitive fields like passwords from being returned to the client.

# Used as a request nodu or response model in auth routes and authenticaltion dependancy checks

# Why use schemas instead of returning the database model?
# Model will return whole User model can i have sensitive info, fastapi convert sqlalchemy object into pydantic model
# Database models → how data is stored.
# Pydantic schemas → how data is accepted from and returned to clients.
# API routes → how requests are handled.

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr

# Contains fields common to all user-related schemas (email) - Parent class 
class UserBase(BaseModel):
    email: EmailStr

# Validates data when a user registers - post/register
class UserCreate(UserBase):
    password: str

# Controls what user information is returned to the client. Password is intentionally omitted. response_model for user endpoints
class UserResponse(UserBase):
    id: UUID
    role: str
    created_at: datetime

    # Pydantic v2 configuration to allow loading data from SQLAlchemy models
    model_config = {
        "from_attributes": True
    }

# Defines the JWT token response after login, POST /login response
class Token(BaseModel):
    access_token: str
    token_type: str

# Stores data extracted from the JWT after decoding (typically the email).
class TokenData(BaseModel):
    email: str | None = None