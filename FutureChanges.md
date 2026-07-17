1. Background Task Processing: BackgroundTasks → Celery + Redis


Current: Document ingestion runs via FastAPI's built-in BackgroundTasks (in-process, simple, no extra infra).
Planned: Migrate to Celery with Redis as the broker.
Why: Adds retries, task persistence, and horizontal scaling across multiple workers — BackgroundTasks loses jobs on server restart and can't scale beyond one process.
Why Redis (not RabbitMQ): Already used for rate limiting, so no new infrastructure needed. RabbitMQ offers stronger delivery guarantees but is overkill at this project's scale.
Not Kafka: Kafka solves event streaming/replay across multiple consumers — a different problem than "run this task once." Not needed here.


3. Visually Stunning UI (The "Wow Factor" Bullets)

PDF Highlights: Instead of plain text citations, integrate a PDF viewer in React (like pdfjs) that opens the document in a split pane and highlights the exact bounding boxes/pages matching the RAG search citations.
Live Admin Dashboard: Build a real-time monitor using Recharts showing active system uploads, cumulative cost estimation, and p50/p95 latency distributions.

3. Fix JWT cookie 
Refactor my authentication flow to use secure HttpOnly cookies instead of storing JWTs in localStorage.

.\venv\Scripts\uvicorn app.main:app --reload --app-dir backend
