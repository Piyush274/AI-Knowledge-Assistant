# Router manages document uploads, list checks, and deletions. It implements a non-blocking ingestion system
# API Upload - Saves the raw file to an uploads/ directory, creates a database entry with a status of processing, queues an ingestion pipeline, and immediately returns a 202 Accepted response
# Background Ingestion Pipeline (run_ingestion_pipeline) - Runs in the background (post-response). It parses the document text, splits it into semantic chunks, generates vector embeddings, stores them in the database, and transitions the document's status to ready (or failed in case of errors).

import os
import shutil #Used for copying files like uploaded file in upload folder
from pathlib import Path

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    HTTPException,
    UploadFile, #Tell fast api that it is file not json
    status,
)
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db # Get db session and current logged in user
from app.db.session import sessionLocal # Get other db session for background task
from app.models.document import Document
from app.models.user import User
from app.rag.embeddings import embed_text_chunks
from app.rag.loaders import extract_text
from app.rag.splitter import create_chunks
from app.rag.vector_store import save_chunks_to_db
from app.schemas.document import DocumentResponse

router = APIRouter()

# Create this directory dynamically using os.makedirs(UPLOAD_DIR, exist_ok=True)
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent.parent / "uploads"

# If folder does not exist create it
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {".txt", ".md", ".pdf", ".docx"}


def run_ingestion_pipeline(document_id: str, file_path: str):
    db = sessionLocal()

    try:
        text = extract_text(file_path)
        chunks = create_chunks(text)

        if not chunks:
            raise ValueError("No text extracted from document")

        embeddings = embed_text_chunks(chunks)

        save_chunks_to_db(
            db=db,
            document_id=document_id,
            chunks=chunks,
            embeddings=embeddings,
        )

        doc = (
            db.query(Document)
            .filter(Document.id == document_id)
            .first()
        )
        
        # If the document exists and has not been deleted by another process, update its status to ready
        if doc:
            doc.status = "ready"
            db.commit()
    
    # If anything fails, rollback the transaction and set the status to failed
    except Exception as e:
        print(f"Ingestion failed: {e}")

        db.rollback() #Undo unfinished db work

        doc = (
            db.query(Document)
            .filter(Document.id == document_id)
            .first()
        )

        if doc:
            doc.status = "failed"
            db.commit()

    finally:
        db.close()


# User uploads document, Whatever object you return is converted into the schema. 202 Accpeted not ok still prcocessing
@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_202_ACCEPTED)
def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...), #... Python's Ellipsis object,This field is required. frontend sends multipart/form-data
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    # Get suffic ai.pdf suffix is .pdf
    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format",
        )
    
    # Create database entry, creates python object
    db_doc = Document(
        user_id=current_user.id,
        filename=file.filename,
        status="processing",
    )

    db.add(db_doc)
    db.commit()
    db.refresh(db_doc)
    
    # id + _ + filename avoid overwriting files
    file_path = UPLOAD_DIR / f"{db_doc.id}_{file.filename}"

    # Save file, open a new mile mode wb (write binary)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer) # Copies UploadFile stream to uploads/abc123_notes.pdf

    # Start background tasks
    background_tasks.add_task(
        run_ingestion_pipeline,
        str(db_doc.id),
        str(file_path),
    )

    # FastAPI remembers, these after response
    # run_ingestion_pipeline(
    # document_id,
    # file_path
    # )

    # FastAPI remember these after the request has been completed
    background_tasks.add_task(
        run_ingestion_pipeline,
        str(db_doc.id),
        str(file_path),
    )

    # {
    # "id":"...",
    # "filename":"notes.pdf",
    # "status":"processing", processing under the hood
    # "uploaded_at":"..."
    # }
    return db_doc
    

# Get /documents/ - (users can only access their own documents)

@router.get("/", response_model=list[DocumentResponse])
def list_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(Document)
        .filter(Document.user_id == current_user.id)
        .all()
    )


@router.delete("/{id}")
def delete_document(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = (
        db.query(Document)
        .filter(
            Document.id == id,
            Document.user_id == current_user.id, # To avoid deletion of another user document
        )
        .first()
    )

    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found",
        )

    file_path = UPLOAD_DIR / f"{doc.id}_{doc.filename}"

    if file_path.exists():
        file_path.unlink() #Delete file (os.remove(file_path))

    db.delete(doc)
    db.commit()

    return {
        "detail": "Document deleted successfully"
    }