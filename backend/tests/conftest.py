# PyTest configuration file containing shared test fixtures
# Sets up isolated database engines/sessions and an AsyncClient for testing FastAPI routes in memory without hitting production data.

# conftest.py file is simply a collection of fixtures that prepare the environment for all your tests. In a FastAPI project, those fixtures typically:

# Create a clean test database.
# Give tests a database session.
# Make FastAPI use the test database instead of the real one.
# Provide an HTTP client to call your API endpoints.
# Clean everything up after each test so every test starts with a fresh environment.

import pytest

# asyncio helps Python do other work while waiting for slow operations like network requests or database queries.
import asyncio

# Imports an HTTP client, Instead of opening a browser, your test sends requests directly.
from httpx import AsyncClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Import your fast api application to call apis
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/knowledge_db")

# Protect production database from being dropped
if "neon.tech" in DATABASE_URL:
    # Use Neon test database instead of production Neon
    # Split by @ to avoid changing username (e.g. neondb_owner containing neondb)
    parts = DATABASE_URL.split("@")
    parts[-1] = parts[-1].replace("/neondb", "/neondb_test")
    TEST_DATABASE_URL = "@".join(parts)
else:
    # Append _test suffix to the local database URL
    if "?" in DATABASE_URL:
        base_url, query = DATABASE_URL.split("?", 1)
        TEST_DATABASE_URL = f"{base_url}_test?{query}"
    else:
        TEST_DATABASE_URL = f"{DATABASE_URL}_test"

engine = create_engine(TEST_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Enable vector extension BEFORE importing any app modules that might call Base.metadata.create_all()
from sqlalchemy import text
try:
    with engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT").execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
except Exception as e:
    print(f"Warning: Could not enable vector extension on startup: {e}")

# Import your fast api application to call apis
from app.main import app as fastapi_app
from app.api.deps import get_db
from app.db.session import Base

# Monkeypatch sessionLocal globally for testing, ensuring background tasks and agents use the test database
import app.db.session
app.db.session.sessionLocal = TestingSessionLocal

import app.api.routes.documents
app.api.routes.documents.sessionLocal = TestingSessionLocal

import app.agents.retriever_agent
app.agents.retriever_agent.sessionLocal = TestingSessionLocal

# Creates db session, test need db connection, before every test create tables, during test use db, after test close db, delete db
@pytest.fixture
def db_session():
    # Enable vector extension
    from sqlalchemy import text
    with engine.connect() as conn:
        conn.execution_options(isolation_level="AUTOCOMMIT").execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))

    # Creates every table
    Base.metadata.create_all(bind=engine)

    # Creates a session
    db = TestingSessionLocal()

    yield db

    db.close() 

    # Delete all tables
    Base.metadata.drop_all(bind=engine)


# Overrides FastAPI database dependency to use test database session
@pytest.fixture(scope="function", autouse=True)
def override_db(db_session):
    def get_db_override():
        try:
            yield db_session
        finally:
            pass
    fastapi_app.dependency_overrides[get_db] = get_db_override
    yield
    fastapi_app.dependency_overrides.clear()


import pytest_asyncio

# Creates http client to call APIs
@pytest_asyncio.fixture
async def async_client():
    from httpx import ASGITransport
    async with AsyncClient(transport=ASGITransport(app=fastapi_app), base_url="http://test") as client:
        yield client


