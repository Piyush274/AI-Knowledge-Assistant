from langchain_core.messages import SystemMessage
from app.agents.graph import GraphState
from app.agents.llm_factory import get_chat_llm

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


def generator_node(state: GraphState) -> dict:
    model_name = state.get("model")
    llm = get_chat_llm(model_name=model_name, temperature=0.3)

    route = state.get("route", "direct")
    docs = state.get("documents", [])
    messages = state.get("messages", [])

    # Direct conversational path (no documents retrieved)
    if route == "direct" or not docs:
        system_msg = SystemMessage(
            content="You are a helpful, concise, and intelligent AI assistant. Answer the user's questions clearly and accurately."
        )
        response = llm.invoke([system_msg, *messages])
        answer_text = _extract_text(response.content)
        return {
            "draft_answer": answer_text,
            "final_answer": answer_text,
        }

    # Document retrieval path with grounded citation instructions
    context_str = ""
    for index, doc in enumerate(docs, start=1):
        filename = doc.get("filename", "Document")
        content = doc.get("content", "").strip()
        context_str += f"[Source {index}] (File: {filename}):\n{content}\n\n"

    system_prompt = (
        "You are an expert technical AI assistant answering queries using the user's uploaded knowledge base.\n\n"
        "Guidelines:\n"
        "1. Base your answer strictly on the provided source contexts below.\n"
        "2. If the context does not provide sufficient information, state what is mentioned and clarify what is unknown. Do not hallucinate.\n"
        "3. Cite your sources using inline numeric markers like [1], [2], or [1, 2] whenever referencing facts from the source passages.\n"
        "4. Keep explanations structured, crisp, and readable.\n\n"
        f"Provided Context Passages:\n{context_str}"
    )

    prompt_messages = [
        SystemMessage(content=system_prompt),
        *messages,
    ]

    response = llm.invoke(prompt_messages)
    answer_text = _extract_text(response.content)

    return {
        "draft_answer": answer_text,
        "final_answer": answer_text,
    }
