# Google's Gemini generative models to convert text chunks into high-dimensional numerical vectors (vector embeddings).

# Ingestion pipeline to convert the processed text chunks into mathematical vectors
from langchain_google_genai import GoogleGenerativeAIEmbeddings
import os
from dotenv import load_dotenv

load_dotenv()

# Instantiate the embedding client
embeddings_client = GoogleGenerativeAIEmbeddings(
    model="models/gemini-embedding-001",
    output_dimensionality=768
)

def embed_text_chunks(chunks: list[str]) -> list[list[float]]:
    batch_size = 16
    embeddings = []
    
    for i in range(0, len(chunks), batch_size):
        batch = chunks[i: i + batch_size]
        batch_embeddings = embeddings_client.embed_documents(batch)
        embeddings.extend(batch_embeddings)
        
    return embeddings
