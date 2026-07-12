from sqlalchemy import Column, String, Uuid,  DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid #Generates a unique random 128-bit ID (uuid.uuid4)

#Import the declarative metadata class Base
from app.db.session import Base

class User(Base):
    __tablename__="users"

    id=Column(Uuid,primary_key=True, default=uuid.uuid4)
    email=Column(String,unique=True,index=True,nullable=False)
    hashed_password=Column(String,nullable=False)
    role=Column(String,default="user")
    created_at=Column(DateTime(timezone=True),server_default=func.now())
    conversations=relationship("Conversation", back_populates="user", cascade="all,delete-orphan") 

    #back_populates="user": Tells SQLAlchemy that the Conversation model has a matching variable named user pointing back here
    #cascade="all, delete-orphan": Crucial for cleanup. If you delete a user, this automatically deletes all of their conversations so you don't leave "orphan" data cluttering your database.




