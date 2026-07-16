# Manages conversations, stores chat history, invokes the AI agent, streams tokens to the frontend using Server-Sent Events (SSE), and saves the final AI response.

import json
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from langchain_core.messages import HumanMessage, AIMessage
from app.api.deps import get_db, get_current_user
from app.models import Conversation
from app.models import ChatMessage
from app.models import User
from app.schemas.chat import SessionCreate, SessionResponse, MessageCreate
from app.agents.graph import app as agent_app

router = APIRouter()

# Create a new chat session
@router.post("/sessions", response_model=SessionResponse)
def create_session(
    session_in: SessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Creates a new conversation session with an initial user message
    # Get user ID or generate UUID
    db_session = Conversation(
        user_id=current_user.id,
        title=session_in.title or "New Chat"
    )
    db.add(db_session)
    db.commit()
    db.refresh(session)

    return session


# List sessions
@router.get("/sessions", response_model=List[SessionResponse])
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Lists all conversation sessions for the current user

    return db.query(Conversation).filter(Conversation.user_id==current_user.id).order_by(Conversation.created_at.desc()).all()


# Get session details
@router.get("/sessions/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    
    session=db.query(Conversation).filter(Conversation.id==session_id, Conversation.user_id==current_user.id).first()

    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

    return session

# Send Message & Stream SSE
@router.post("/sessions/{session_id}/messages", response_model=Message)
def send_message(
    session_id: str,
    message_input: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
   # Search the DB for the conversation
   session=db.query(Conversation).filter(Conversation.id==session_id, Conversation.user_id==current_user.id).first()

   if not session:
       raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")

   # Create a user chat message and save
   user_message=ChatMessage(
       session_id=session_id,
       role="user",
       content=message_input.content,
   )
   db.add(user_message)
   db.commit()
   db.refresh(user_message)

   # Build LLM history, Retrieve Conversation History, to give full context to model

   history=db.query(ChatMessage).filter(ChatMessage.session_id==session_id).order_by(ChatMessage.created_at.asc()).all()
   
   for x in history:
      if x.role=="user"
        HumanMessage(content=x.content)
      if x.role=="assitant"
        AIMessage(content==x.content)

   # Assemble graph state inputs
   inputs = {
    "query": message_input.content,
    "messages": langchain_messages,
    "route": "direct",
    "documents": [],
    "draft_answer": "",
    "final_answer": "",
    "citations": []
    }

    # Create the Serve Sent Events (SSE) Generator
    # async because langgraph streams events asynchronously, async for event in instead of for event in
    async def event_generator():
        final_answer = ""    
        citaions=[]
        
        # Start listening to langgraph event by event
        async for event in agent_app.astream(inputs, version="v2"):
            

      

   


   
