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
    db.refresh(db_session)

    return db_session


# List sessions
@router.get("/sessions", response_model=list[SessionResponse])
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
@router.post("/sessions/{session_id}/messages")
async def send_message(
    session_id: str,
    message_in: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify session ownership
    session = (
        db.query(Conversation)
        .filter(
            Conversation.id == session_id,
            Conversation.user_id == current_user.id,
        )
        .first()
    )
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found",
        )

    # Save user message to database
    user_msg = ChatMessage(
        session_id=session.id,
        role="user",
        content=message_in.content,
    )
    db.add(user_msg)
    db.commit()

    # Fetch conversation history to pass to LangGraph
    history = (
        db.query(ChatMessage)
        .filter(ChatMessage.session_id == session.id)
        .order_by(ChatMessage.created_at.asc())
        .all()
    )

    # Format history for LangChain
    langchain_messages = []
    for msg in history:
        if msg.role == "user":
            langchain_messages.append(HumanMessage(content=msg.content))
        else:
            langchain_messages.append(AIMessage(content=msg.content))

    # Construct the graph state inputs and then send to langgraph as intital state
    inputs = {
        "query": message_in.content,
        "messages": langchain_messages,
        "route": "direct",
        "documents": [],
        "draft_answer": "",
        "final_answer": "",
        "citations": [],
    }

    # This function is not executed immediately, it only runs on Streaming Response StreamingResponse(event_generator())
    async def event_generator():
        final_answer = ""
        citations = []

 
        try:
            # Stream events from LangGraph
            async for event in agent_app.astream_events(inputs, version="v2"):
                
                # Suppose LangGraph gives tokens in chunks of AIMessageChunk
                # event = {"event": "on_chat_model_stream", "data": {"chunk": AIMessageChunk(content="RAG")}}

                # token is small part of response "Hello" then " I am Gpt"

                # Filter for text tokens from the chat model
                if event["event"] == "on_chat_model_stream":
                    token = event["data"]["chunk"].content
                    # SSE requires blank line after every event
                    yield f"data: {json.dumps({'token': token})}\n\n"

                # Capture final answer and citations when the citation critic node ends
                elif (
                    event["event"] == "on_chain_end"
                    and event["metadata"].get("langgraph_node") == "citation"
                ):
                    node_output = event["data"]["output"]
                    final_answer = node_output.get("final_answer", "")
                    citations = node_output.get("citations", [])

            # Write the assistant's final response to the database
            assistant_msg = ChatMessage(
                session_id=session.id,
                role="assistant",
                content=final_answer,
            )
            db.add(assistant_msg)
            db.commit()

            # Yield done signal and citations metadata
            yield f"data: {json.dumps({'done': True, 'citations': citations})}\n\n"

        except Exception as e:
            print(f"Streaming error: {e}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
    )

