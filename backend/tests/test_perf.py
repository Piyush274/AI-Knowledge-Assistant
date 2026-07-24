import time
import math
import random
import pytest

def generate_random_vector(dim=768):
    return [random.gauss(0, 1) for _ in range(dim)]

def normalize_vector(v):
    magnitude = math.sqrt(sum(x * x for x in v))
    if magnitude == 0:
        return v
    return [x / magnitude for x in v]

def dot_product(v1, v2):
    return sum(x * y for x, y in zip(v1, v2))

class MockVectorDB:
    """
    Mock database helper that stores 100 sentences with mock 768-dimension embeddings
    and computes cosine similarity using pure Python to simulate vector searches.
    """
    def __init__(self):
        # Seed 100 mock sentences
        self.sentences = [
            f"Sentence key {i}: FastAPI and pgvector perform highly scalable vector similarity searches."
            for i in range(100)
        ]
        # Generate 100 random 768-dimension vectors and normalize them
        self.embeddings = [normalize_vector(generate_random_vector()) for _ in range(100)]

    def similarity_search(self, query_embedding, limit=5):
        # Simulate index search latency (e.g. 5ms to 20ms)
        time.sleep(random.uniform(0.005, 0.020))
        
        # Calculate cosine similarity
        similarities = []
        for idx, stored_embedding in enumerate(self.embeddings):
            sim = dot_product(stored_embedding, query_embedding)
            similarities.append((idx, sim))
            
        # Sort by similarity descending
        similarities.sort(key=lambda x: x[1], reverse=True)
        
        # Return top limit
        return [(self.sentences[idx], sim) for idx, sim in similarities[:limit]]


@pytest.fixture
def mock_db():
    return MockVectorDB()


def test_p95_latency(mock_db):
    latencies = []
    
    # Run 50 random similarity search queries
    for _ in range(50):
        # Generate a random 768-dimension query vector and normalize it
        query_vector = normalize_vector(generate_random_vector())
        
        start_time = time.time()
        _ = mock_db.similarity_search(query_vector, limit=5)
        elapsed_ms = (time.time() - start_time) * 1000
        
        latencies.append(elapsed_ms)
        
    # Calculate the 95th percentile (p95) latency
    sorted_latencies = sorted(latencies)
    p95_idx = min(int(len(sorted_latencies) * 0.95), len(sorted_latencies) - 1)
    p95_latency = sorted_latencies[p95_idx]
    
    print(f"\nCalculated p95 Latency: {p95_latency:.2f}ms")
    
    # Assert that p95 latency is strictly less than 300ms
    assert p95_latency < 300.0, f"p95 latency was {p95_latency:.2f}ms, which exceeds 300ms limit"
