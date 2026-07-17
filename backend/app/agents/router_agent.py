# BaseModel to create a structured response schema.
from pydantic import BaseModel, Field
from typing import Literal
from langchain_google_genai import ChatGoogleGenerativeAI
from app.agents.graph import GraphState

# Defines the format the LLM must return.
class RouteQuery(BaseModel):
    """Decides whether to fetch documents or generate answer directly."""
    datasource: Literal["retrieve", "direct"] = Field(
        description="Choose 'retrieve' if answering requires searching the uploaded documents. Choose 'direct' if the question is a greeting, casual conversation, or can be answered without document search."
    )

# temperature=0 makes routing more consistent.
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0)

# Bind the schema
structured_llm = llm.with_structured_output(RouteQuery)

def router_node(state: GraphState) -> dict:
    query = state["query"]
    decision = structured_llm.invoke(query)
    
    # Store the result in the 'route' key of GraphState
    return {"route": decision.datasource}