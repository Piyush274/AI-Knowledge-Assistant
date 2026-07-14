# Save_chunks_to_db: Receives document chunks and their generated embeddings and performs a transaction-safe bulk insert into your database.


# search_similar_chunks: Runs the mathematical cosine similarity queries to retrieve the most contextually relevant chunks matching a query.

from sqlalchemy.orm import Session
from app.models import DocumentChunk, Document


def save_chunks_to_db(db: Session, document_id: str, chunks: list[str], embeddings: list[list[float]]):
    try:
        # Enumerate to get index for the loop else need to manually use a counter and increment
        for index, chunk in enumerate(chunks):
            db_chunk = DocumentChunk(
                document_id=document_id,
                content=chunk,
                embedding=embeddings[index],
                chunk_index=index,
                meta={}
            )
            db.add(db_chunk)
        db.commit()
    except Exception as e:
        db.rollback()
        raise e

def search_similar_chunks(db: Session, query_embedding: list[float], limit: int)->list[DocumentChunk]:
    
    results=db.query(DocumentChunk).order_by(DocumentChunk.embedding.cosine_distance(query_embedding)).limit(limit).all()
    return results
