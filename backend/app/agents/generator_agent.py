import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage
from app.agents.graph import GraphState

load_dotenv()

MODEL_NAME = os.getenv("GEMINI_MODEL_NAME", "models/gemini-3.5-flash")

def _extract_text(content) -> str:
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for item in content:
            if isinstance(item, str):
                parts.append(item)
            elif isinstance(item, dict) and "text" in item:
                parts.append(str(item["text"]))
            elif hasattr(item, "text"):
                parts.append(str(getattr(item, "text")))
            else:
                parts.append(str(item))
        return "".join(parts)
    if isinstance(content, dict):
        return str(content.get("text", content))
    return str(content) if content is not None else ""


def generator_node(state: GraphState)->dict:
    llm=ChatGoogleGenerativeAI(model=MODEL_NAME, temperature=0.5)

    # In LangGraph, not every field is populated at every step, so use get to handle empty state fields and avoid error
    route=state["route"]
    docs = state.get("documents", [])
    messages = state.get("messages", [])

    # Direct chat path
    if route == "direct" or not docs:
        response = llm.invoke(messages)
    
    # Retrieval path
    else:
        context_str = ""
        
        # Loops over retrieved chunks, and create the context
        for index, doc in enumerate(docs, start=1):
            context_str += f"""
                Source [{index}]: (File: {doc['filename']}):\n
                {doc['content']}\n\n
                """

        # Add system message to handle citations
        system_prompt = (
            "You are a helpful AI assistant answering questions based on the provided document context. "
            "Answer the question using ONLY the facts from the sources. If the sources do not contain the answer, "
            "state that you do not know. Do not hallucinate or use external knowledge. "
            "Cite your sources using inline markers like [1], [2] at the end of sentences that use those facts.\n\n"
            f"Provided Context:\n{context_str}"
        )

        prompt_messages = [
            SystemMessage(content=system_prompt),
            *messages,
        ]

        response = llm.invoke(prompt_messages)

    return {
        "draft_answer": _extract_text(response.content)
    }

