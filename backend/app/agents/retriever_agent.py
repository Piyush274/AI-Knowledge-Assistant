from app.db.session import sessionLocal
from app.rag.embeddings import embeddings_client
from app.rag.vector_store import search_similar_chunks
from app.agents.graph import GraphState

def retriever_node(state: GraphState) -> dict:
    db=sessionLocal()
    try:
        query=state["query"]
        query_embedding=embeddings_client.embed_query(query)

        chunks=search_similar_chunks(db, query_embedding, limit=5)

        retrieved_docs=[]
        for chunk in chunks:
            retrieved_docs.append(
                {
                    "content": chunk.content,
                    "document_id": str(chunk.document_id),
                    "chunk_index": chunk.chunk_index,
                    "filename": (
                        chunk.document.filename
                        if chunk.document
                        else "Unknown"
                    ),
                }
            )

        return {"documents":retrieved_docs}

    finally:
        db.close()
        