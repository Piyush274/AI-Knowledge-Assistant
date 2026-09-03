import re
from pydantic import BaseModel, Field
from typing import Literal
from app.agents.graph import GraphState
from app.agents.llm_factory import get_chat_llm

# Defines the structured output schema for routing
class RouteQuery(BaseModel):
    """Decides whether to fetch documents or generate answer directly."""
    datasource: Literal["retrieve", "direct"] = Field(
        description="Choose 'retrieve' if answering requires searching the uploaded documents. Choose 'direct' if the question is a greeting, casual conversation, or can be answered without document search."
    )

# Fast heuristic regex for common greetings & non-RAG chat (0ms instant routing)
CASUAL_PATTERNS = re.compile(
    r"^(hi|hello|hey|greetings|good\s+(morning|afternoon|evening|day)|howdy|hola|"
    r"who\s+are\s+you|what\s+can\s+you\s+do|help|thanks|thank\s+you|bye|goodbye|"
    r"how\s+are\s+you|what\s+is\s+your\s+name)[\s!\.\?]*$",
    re.IGNORECASE
)

def router_node(state: GraphState) -> dict:
    query = state.get("query", "").strip()
    
    # 1. Instant 0ms heuristic match for greetings and pleasantries
    if not query or CASUAL_PATTERNS.match(query) or len(query.split()) <= 1:
        # If single word like "Hi", "Hello", route directly without spending an LLM call
        if query.lower() in {"hi", "hello", "hey", "test", "help", "thanks"}:
            return {"route": "direct"}

    # 2. Dynamic model routing
    model_name = state.get("model")
    try:
        llm = get_chat_llm(model_name=model_name, temperature=0)
        structured_llm = llm.with_structured_output(RouteQuery)
        decision = structured_llm.invoke(query)
        return {"route": decision.datasource}
    except Exception as e:
        print(f"[RouterAgent] Routing structured LLM exception: {e}, defaulting to 'retrieve'")
        # Default to retrieval for any knowledge question
        return {"route": "retrieve"}