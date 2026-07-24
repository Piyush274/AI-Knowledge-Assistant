import io
import time
import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient
from sqlalchemy.orm import Session

from app.models import Document, User, ChatMessage

@pytest_asyncio.fixture
async def auth_headers(async_client: AsyncClient, db_session: Session):
    # 1. Register a test user
    signup_payload = {
        "email": "testuser@example.com",
        "password": "securepassword123"
    }
    signup_res = await async_client.post("/auth/signup", json=signup_payload)
    assert signup_res.status_code == 201
    
    # 2. Login to get token
    login_data = {
        "username": "testuser@example.com",
        "password": "securepassword123"
    }
    response = await async_client.post("/auth/login", data=login_data)
    assert response.status_code == 200
    token = response.json()["access_token"]
    
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_document_ingestion_and_chat_pipeline(async_client: AsyncClient, db_session: Session, auth_headers: dict):
    # 1. Upload a document
    file_content = b"FastAPI is a modern, fast (high-performance), web framework for building APIs with Python 3.8+ based on standard Python type hints."
    file_name = "test_framework.txt"
    files = {"file": (file_name, file_content, "text/plain")}
    
    upload_res = await async_client.post(
        "/documents/upload",
        files=files,
        headers=auth_headers
    )
    assert upload_res.status_code == 202
    doc_data = upload_res.json()
    assert doc_data["filename"] == file_name
    assert doc_data["status"] == "processing"
    
    doc_id = doc_data["id"]

    # 2. Poll document status until it changes to "ready" (indicating ingestion is done)
    max_retries = 15
    ingestion_success = False
    for _ in range(max_retries):
        await asyncio.sleep(1)
        # Fetch document list
        get_res = await async_client.get("/documents/", headers=auth_headers)
        assert get_res.status_code == 200
        documents = get_res.json()
        doc = next((d for d in documents if d["id"] == doc_id), None)
        if doc and doc["status"] == "ready":
            ingestion_success = True
            break
        elif doc and doc["status"] == "failed":
            break
            
    assert ingestion_success, "Ingestion pipeline did not finish processing document in time"

    # 3. Create a chat session
    session_res = await async_client.post(
        "/chat/sessions",
        json={"title": "Test Integration Session"},
        headers=auth_headers
    )
    assert session_res.status_code == 200
    session_data = session_res.json()
    session_id = session_data["id"]

    # 4. Query chat and check SSE response
    chat_payload = {"content": "What is FastAPI?"}
    chat_res = await async_client.post(
        f"/chat/sessions/{session_id}/messages",
        json=chat_payload,
        headers=auth_headers
    )
    assert chat_res.status_code == 200
    
    # Collect streamed response to verify final answer tokens
    response_text = chat_res.text
    assert len(response_text) > 0
    # The SSE response yields data payload containing token or done structure
    assert "data" in response_text

    # 5. Verify document deletion
    del_res = await async_client.delete(f"/documents/{doc_id}", headers=auth_headers)
    assert del_res.status_code == 200
