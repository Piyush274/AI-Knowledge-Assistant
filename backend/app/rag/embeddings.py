"""
Google Generative AI Embedding Engine (768 Dimensions)
Generates 768-dimensional vector embeddings via Google Generative AI Embeddings API (models/gemini-embedding-001)
to match PostgreSQL Vector(768). Lightweight, API-based, and ideal for memory-constrained environments like Render Free Tier.
"""

import os
from dotenv import load_dotenv

load_dotenv()

_embedding_client = None


def get_embedding_client():
    """Lazy loader for GoogleGenerativeAIEmbeddings client."""
    global _embedding_client
    if _embedding_client is None:
        try:
            from langchain_google_genai import GoogleGenerativeAIEmbeddings
            google_api_key = os.getenv("GOOGLE_API_KEY", "").strip()
            model_name = os.getenv("GEMINI_EMBEDDING_MODEL", "models/gemini-embedding-001")
            _embedding_client = GoogleGenerativeAIEmbeddings(
                model=model_name,
                output_dimensionality=768,
                google_api_key=google_api_key if google_api_key else None,
            )
        except Exception as e:
            print(f"[Embeddings] GoogleGenerativeAIEmbeddings initialization error: {e}")
            _embedding_client = None
    return _embedding_client


def embed_query(query: str) -> list[float]:
    """Generates a 768-dimensional embedding vector for a single search query."""
    clean_query = query.strip()
    if not clean_query:
        return [0.0] * 768

    try:
        client = get_embedding_client()
        if client is not None:
            return client.embed_query(clean_query)
    except Exception as e:
        print(f"[Embeddings] embed_query error: {e}")

    return [0.0] * 768


def embed_text_chunks(chunks: list[str]) -> list[list[float]]:
    """Generates 768-dimensional embeddings for a batch of document text chunks."""
    if not chunks:
        return []

    try:
        client = get_embedding_client()
        if client is not None:
            batch_size = 16
            all_embeddings = []
            for i in range(0, len(chunks), batch_size):
                batch = chunks[i : i + batch_size]
                all_embeddings.extend(client.embed_documents(batch))
            return all_embeddings
    except Exception as e:
        print(f"[Embeddings] embed_text_chunks error: {e}")

    return [[0.0] * 768 for _ in chunks]


# Backward-compatible wrapper object for any code calling embeddings_client.embed_query
class _EmbeddingsClientWrapper:
    def embed_query(self, query: str) -> list[float]:
        return embed_query(query)

    def embed_documents(self, docs: list[str]) -> list[list[float]]:
        return embed_text_chunks(docs)


embeddings_client = _EmbeddingsClientWrapper()
