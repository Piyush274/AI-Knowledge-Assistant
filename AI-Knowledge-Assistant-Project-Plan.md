# AI Knowledge Assistant – Multi-Agent RAG Platform

A full-stack, multi-agent Retrieval-Augmented Generation (RAG) platform for semantic search and conversational Q&A over user-uploaded documents.

---

## 1. Project Overview

**Goal:** Build a production-grade RAG system where users upload documents (PDF, DOCX, TXT, MD), and interact with an AI agent that answers questions using retrieved context, cites sources inline, and remembers conversation history — all orchestrated by a multi-agent pipeline instead of a single monolithic LLM call.

**Resume bullet alignment:**
- Full-stack multi-agent RAG platform → React.js + FastAPI + LangGraph
- Semantic search + conversational Q&A → pgvector + LangChain retrievers + chat memory
- 1,000+ documents, 300–500ms retrieval, 2–4s end-to-end → performance targets to engineer and benchmark for
- Auth, rate limiting, admin analytics dashboard → product-grade features, not just a demo
- PyTest suites → testing discipline
- Docker + GitHub Actions CI/CD → AWS EC2 → real deployment, not just localhost

---

## 2. Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React.js (Vite), TailwindCSS, React Query | Chat UI, document upload, admin dashboard |
| Backend API | FastAPI (Python 3.11+) | REST/streaming endpoints, orchestration entrypoint |
| Agent Orchestration | LangGraph | Multi-agent state machine (router, retriever, generator, critic) |
| RAG Framework | LangChain | Document loaders, text splitters, retrievers, chains |
| LLM | Google Gemini API (gemini-1.5-flash / pro) | Generation, query rewriting, summarization |
| Vector DB | PostgreSQL + pgvector extension | Embedding storage + similarity search |
| Relational Data | PostgreSQL | Users, documents, chat sessions, analytics |
| Auth | FastAPI + JWT (OAuth2 password flow) | Login, signup, role-based access |
| Rate Limiting | slowapi / Redis token bucket | Prevent abuse, per-user quotas |
| Testing | PyTest, httpx AsyncClient | API + retrieval pipeline tests |
| Containerization | Docker, docker-compose | Local dev parity + deployment |
| CI/CD | GitHub Actions | Lint, test, build, push image, deploy |
| Hosting | AWS EC2 (+ optionally S3 for file storage, RDS for Postgres) | Production deployment |

---

## 3. High-Level Architecture

```
┌─────────────┐     ┌──────────────┐     ┌────────────────────────────┐
│   React UI  │────▶│  FastAPI     │────▶│      LangGraph Agent Graph   │
│ (chat, docs,│◀────│  (REST + SSE)│◀────│                              │
│  admin)     │     └──────────────┘     │  ┌───────────┐  ┌─────────┐ │
└─────────────┘            │             │  │  Router   │─▶│Retriever│ │
                            │             │  │  Agent    │  │ Agent   │ │
                     ┌──────▼──────┐      │  └───────────┘  └────┬────┘ │
                     │  PostgreSQL │      │                      ▼      │
                     │  + pgvector │◀─────┼──────────────  ┌───────────┐│
                     │  (docs,     │      │                │ Generator ││
                     │  chunks,    │      │                │  Agent    ││
                     │  chat log)  │      │                └────┬──────┘│
                     └─────────────┘      │                     ▼       │
                                          │              ┌─────────────┐│
                                          │              │ Critic/     ││
                                          │              │ Citation    ││
                                          │              │ Agent       ││
                                          │              └─────────────┘│
                                          └────────────────┬────────────┘
                                                            ▼
                                                    Google Gemini API
```

### Multi-agent roles (LangGraph nodes)
1. **Router Agent** – classifies the query (new question, follow-up, out-of-scope) and decides whether retrieval is needed.
2. **Retriever Agent** – rewrites the query for retrieval, runs hybrid similarity + keyword search against pgvector, re-ranks top-k chunks.
3. **Generator Agent** – synthesizes an answer from retrieved chunks + conversation memory using Gemini.
4. **Citation/Critic Agent** – verifies claims are grounded in retrieved chunks, attaches inline citation markers, flags hallucination risk.

State is passed between nodes as a shared `GraphState` object (query, chat history, retrieved docs, draft answer, citations).

---

## 4. Database Schema (PostgreSQL + pgvector)

```sql
-- users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    hashed_password TEXT NOT NULL,
    role TEXT DEFAULT 'user', -- 'user' | 'admin'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- documents
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    filename TEXT NOT NULL,
    status TEXT DEFAULT 'processing', -- processing | ready | failed
    uploaded_at TIMESTAMPTZ DEFAULT now()
);

-- document_chunks (vector store)
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    embedding VECTOR(768), -- Gemini embedding dimension
    chunk_index INT,
    metadata JSONB
);

CREATE INDEX ON document_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- chat_sessions
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- chat_messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user' | 'assistant'
    content TEXT NOT NULL,
    citations JSONB,
    latency_ms INT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- analytics_events (for admin dashboard)
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    event_type TEXT, -- 'query' | 'upload' | 'login'
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 5. Backend Folder Structure

```
backend/
├── app/
│   ├── main.py                  # FastAPI app entrypoint
│   ├── core/
│   │   ├── config.py             # env vars, settings
│   │   ├── security.py           # JWT, password hashing
│   │   └── rate_limit.py
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── documents.py
│   │   │   ├── chat.py
│   │   │   └── admin.py
│   ├── agents/
│   │   ├── graph.py               # LangGraph state graph definition
│   │   ├── router_agent.py
│   │   ├── retriever_agent.py
│   │   ├── generator_agent.py
│   │   └── citation_agent.py
│   ├── rag/
│   │   ├── loaders.py             # PDF/DOCX/TXT loaders
│   │   ├── splitter.py            # chunking strategy
│   │   ├── embeddings.py          # Gemini embedding client
│   │   └── vector_store.py        # pgvector queries
│   ├── models/                    # SQLAlchemy models
│   ├── schemas/                   # Pydantic request/response schemas
│   ├── db/
│   │   ├── session.py
│   │   └── migrations/ (Alembic)
│   └── services/
│       ├── document_service.py
│       ├── chat_service.py
│       └── analytics_service.py
├── tests/
│   ├── test_auth.py
│   ├── test_documents.py
│   ├── test_chat.py
│   └── test_retrieval_pipeline.py
├── Dockerfile
├── requirements.txt
└── alembic.ini
```

## 6. Frontend Folder Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── ChatPage.jsx
│   │   ├── DocumentsPage.jsx
│   │   └── AdminDashboard.jsx
│   ├── components/
│   │   ├── ChatWindow.jsx
│   │   ├── MessageBubble.jsx     # renders inline citations
│   │   ├── CitationTooltip.jsx
│   │   ├── UploadDropzone.jsx
│   │   └── AnalyticsChart.jsx
│   ├── hooks/
│   │   ├── useChat.js             # SSE streaming hook
│   │   └── useAuth.js
│   ├── api/
│   │   └── client.js
│   └── App.jsx
├── Dockerfile
└── package.json
```

---

## 7. Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/auth/signup` | Create account |
| POST | `/auth/login` | Get JWT token |
| POST | `/documents/upload` | Upload + async chunk/embed pipeline |
| GET | `/documents` | List user's documents + status |
| DELETE | `/documents/{id}` | Remove document + its chunks |
| POST | `/chat/sessions` | Create new chat session |
| POST | `/chat/sessions/{id}/messages` | Send message (SSE streamed response) |
| GET | `/chat/sessions/{id}` | Fetch chat history |
| GET | `/admin/analytics` | Query volume, latency, active users |
| GET | `/health` | Liveness/readiness probe |

---

## 8. RAG Pipeline Details

1. **Ingestion**
   - Loader detects file type → extracts text (PyMuPDF for PDF, python-docx for DOCX).
   - Recursive character/token-based splitter → 500–800 token chunks with ~15% overlap.
   - Batch-embed chunks via Gemini embedding endpoint → store in `document_chunks` with pgvector.
   - Background task (FastAPI `BackgroundTasks` or Celery/RQ if you want to show queueing skills) so upload returns immediately with `status=processing`.

2. **Retrieval**
   - User query → optionally rewritten by Router Agent for better recall.
   - Cosine similarity search via pgvector (`<=>` operator) with top-k (e.g., k=6).
   - Optional hybrid search: combine vector similarity with PostgreSQL full-text search (`ts_rank`) for keyword precision.
   - Re-rank top candidates (simple heuristic or cross-encoder) before passing to generator.

3. **Generation**
   - Prompt template includes: system instructions, retrieved chunks (with source IDs), last N turns of chat memory, user query.
   - Gemini call streamed back to frontend via Server-Sent Events for a "typing" effect.

4. **Citation & Grounding**
   - Citation agent maps sentences in the answer back to chunk IDs.
   - Frontend renders `[1]`, `[2]` inline markers → hover/click shows source snippet + document name.

5. **Conversation Memory**
   - Last-k messages stored per session; optionally summarized when the session grows long (LangChain `ConversationSummaryBufferMemory` pattern) to control token usage.

---

## 9. Performance Targets (map directly to resume claims)

| Metric | Target | How to Achieve / Measure |
|---|---|---|
| Retrieval latency | 300–500 ms | Proper `ivfflat` index, connection pooling, limit k, async DB calls |
| End-to-end response | 2–4 s | Streaming generation, parallelize retrieval + minor agent steps where possible |
| Scale | 1,000+ documents | Batch embedding jobs, indexed vector search, pagination |

**Benchmark it for real:** write a small script that seeds 1,000+ chunked documents and logs p50/p95 latency for retrieval and full response — this turns the resume bullet into a defensible, demonstrable claim in an interview.

---

## 10. Security & Platform Features

- **Auth:** JWT access + refresh tokens, password hashing with `bcrypt`/`passlib`, role field for `admin` vs `user`.
- **Rate limiting:** per-user and per-IP limits (e.g., 20 messages/min) via `slowapi` backed by Redis.
- **Admin analytics dashboard:** total users, documents ingested, queries/day, average latency, error rate — charted with Recharts on the frontend.
- **Input validation:** Pydantic schemas on every request; file type/size validation on upload.
- **Secrets management:** `.env` + `pydantic-settings`, never committed; separate `.env.example`.

---

## 11. Testing Strategy (PyTest)

- `test_auth.py` – signup/login, invalid credentials, token expiry.
- `test_documents.py` – upload flow, unsupported file type rejection, deletion cascades to chunks.
- `test_retrieval_pipeline.py` – given a seeded document, assert top-k retrieval returns expected chunk; assert latency under threshold.
- `test_chat.py` – full round trip: create session → send message → assert citations present → assert memory carried into next turn.
- Use `pytest-asyncio` + `httpx.AsyncClient` against a test Postgres instance (via `docker-compose.test.yml` or `testcontainers-python`).

---

## 12. Docker & CI/CD

**docker-compose.yml (local dev)**
```yaml
services:
  db:
    image: ankane/pgvector
    environment:
      POSTGRES_DB: rag_db
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
  backend:
    build: ./backend
    env_file: .env
    depends_on: [db]
    ports: ["8000:8000"]
  frontend:
    build: ./frontend
    ports: ["5173:5173"]
```

**GitHub Actions pipeline (`.github/workflows/ci-cd.yml`)**
1. Trigger on push/PR to `main`.
2. Lint (ruff/black) + run PyTest suite against a service-container Postgres.
3. Build Docker images for backend and frontend.
4. Push images to GitHub Container Registry (or Docker Hub).
5. On merge to `main`: SSH into AWS EC2 → `docker-compose pull && docker-compose up -d` (or use a deploy action).

---

## 13. Build Roadmap (suggested order)

1. **Week 1** – Scaffold FastAPI + React apps, Docker Compose, Postgres + pgvector setup, auth (signup/login/JWT).
2. **Week 2** – Document upload + ingestion pipeline (loaders, chunking, embeddings, storage).
3. **Week 3** – Basic single-agent RAG chat (retrieval + generation, no LangGraph yet) to get an end-to-end demo working.
4. **Week 4** – Refactor into LangGraph multi-agent flow (router, retriever, generator, citation agents); add streaming SSE.
5. **Week 5** – Conversation memory, inline citations UI, rate limiting.
6. **Week 6** – Admin analytics dashboard, PyTest suite, performance benchmarking script.
7. **Week 7** – Dockerize fully, GitHub Actions CI/CD, deploy to AWS EC2, write README + architecture diagram, open-source it.

---

## 14. README Checklist for the Repo (what recruiters/interviewers will look at)

- [ ] Architecture diagram (reuse the one above, rendered as an image)
- [ ] Setup instructions (`docker-compose up`)
- [ ] Demo GIF or screenshots of chat + citations + admin dashboard
- [ ] Benchmark results table (latency numbers you actually measured)
- [ ] `.env.example`
- [ ] License (MIT recommended for open-source)
- [ ] Link to live demo (EC2 instance or a short-lived deployment)

---

## 15. Stretch Goals (if you want to go further)

- Add a document-summarization agent for long-doc TL;DRs on upload.
- Add hybrid search reranking with a cross-encoder model.
- Add streaming token-level cost tracking per user (nice for the analytics dashboard).
- Add multi-tenant workspace support (teams sharing a document corpus).
- Swap Gemini for a pluggable LLM provider interface (shows abstraction skills).
