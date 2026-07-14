# File defines the SQLAlchemy ORM models representing our database tables for uploaded files and their split, vectorized chunks

from sqlalchemy import Column, String, Uuid, DateTime, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.session import Base

# To install vector extension in pg to store vector embeddings
from pgvector.sqlalchemy import Vector

# To store data in JSON column, JSONB in binary optimized format for faster searching
from sqlalchemy.dialects.postgresql import JSONB


# Document: Tracks user-uploaded files, including filename, upload status (processing, ready, failed), and the user who uploaded them.
class Document(Base):
    __tablename__ = "documents"

    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id = Column(Uuid, ForeignKey("users.id"), nullable=True)

    # Stores uploaded file name
    filename = Column(String, nullable=False) 
    status = Column(String, default="processing", nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")


# DocumentChunk: Stores the actual text segments (chunks) from a document along with their high-dimensional vector representations (Vector(768))
class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(Uuid, primary_key=True, default=uuid.uuid4)
    document_id = Column(Uuid, ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)

    # Stores actual text of the chunk
    content = Column(Text, nullable=False)

    # Vector embedding for semantic search
    embedding = Column(Vector(768), nullable=False)

    # Chunk index - stores position of chunk inside document
    chunk_index = Column(Integer, nullable=False)

    # Metadata - stores extra information about the chunk (JSONB for flexibility to add more fields later)
    # {
    # "page": 5,
    # "figure": "Figure 2" 
    # }
    meta = Column("metadata", JSONB, default={})

    # Parent document mapping
    document = relationship("Document", back_populates="chunks")