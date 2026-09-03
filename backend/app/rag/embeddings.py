"""
Local FastEmbed Embedding Engine (768 Dimensions)
Runs in-process on CPU via ONNX runtime for ultra-fast (~5ms), free, zero-rate-limit vector embeddings.
Uses BAAI/bge-base-en-v1.5 which natively outputs 768-dimensional vectors to match PostgreSQL Vector(768).
"""

import os
from dotenv import load_dotenv

load_dotenv()

_fastembed_model = None

def get_fastembed_model():
    """Lazy loader for FastEmbed model to keep server startup fast."""
    global _fastembed_model
    if _fastembed_model is None:
        try:
            from fastembed import TextEmbedding
            # BAAI/bge-base-en-v1.5 outputs 768 dimensions (matches Vector(768) in DB)
            _fastembed_model = TextEmbedding(model_name="BAAI/bge-base-en-v1.5")
        except Exception as e:
            print(f"[Embeddings] FastEmbed initialization fallback notice: {e}")
            _fastembed_model = None
    return _fastembed_model


def embed_query(query: str) -> list[float]:
    """Generates a 768-dimensional embedding vector for a single search query."""
    clean_query = query.strip()
    if not clean_query:
        return [0.0] * 768

    model = get_fastembed_model()
    if model is not None:
        try:
            embeddings_list = list(model.embed([clean_query]))
            if embeddings_list and len(embeddings_list) > 0:
                return embeddings_list[0].tolist()
        except Exception as e:
            print(f"[Embeddings] FastEmbed embed_query error: {e}, falling back...")

    # Fallback to Google Gemini Embeddings if FastEmbed is unavailable
    try:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        client = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            output_dimensionality=768
        )
        return client.embed_query(clean_query)
    except Exception as e:
        print(f"[Embeddings] Gemini fallback failed: {e}")
        return [0.0] * 768


def embed_text_chunks(chunks: list[str]) -> list[list[float]]:
    """Generates 768-dimensional embeddings for a batch of document text chunks."""
    if not chunks:
        return []

    model = get_fastembed_model()
    if model is not None:
        try:
            embeddings_list = list(model.embed(chunks))
            return [e.tolist() for e in embeddings_list]
        except Exception as e:
            print(f"[Embeddings] FastEmbed batch error: {e}, falling back to Gemini...")

    # Fallback to Google Gemini Embeddings
    try:
        from langchain_google_genai import GoogleGenerativeAIEmbeddings
        client = GoogleGenerativeAIEmbeddings(
            model="models/gemini-embedding-001",
            output_dimensionality=768
        )
        batch_size = 16
        all_embeddings = []
        for i in range(0, len(chunks), batch_size):
            batch = chunks[i : i + batch_size]
            all_embeddings.extend(client.embed_documents(batch))
        return all_embeddings
    except Exception as e:
        print(f"[Embeddings] Gemini batch fallback failed: {e}")
        return [[0.0] * 768 for _ in chunks]


# Backward-compatible wrapper object for any code calling embeddings_client.embed_query
class _EmbeddingsClientWrapper:
    def embed_query(self, query: str) -> list[float]:
        return embed_query(query)
    
    def embed_documents(self, docs: list[str]) -> list[list[float]]:
        return embed_text_chunks(docs)

embeddings_client = _EmbeddingsClientWrapper()
