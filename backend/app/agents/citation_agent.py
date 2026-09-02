import os
import re
from typing import TYPE_CHECKING, Any
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage

if TYPE_CHECKING:
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


# Citation agent:
# 1. Audits grounding: checks draft answer against retrieved documents, refines answer, and removes hallucinations.
# 2. Extracts citation metadata: parses the final answer to find all referenced markers (e.g. [1], [2], [1, 2]) and maps them to document details.

def citation_node(state: Any) -> dict:
    route = state.get("route")
    draft = _extract_text(state.get("draft_answer", ""))
    docs = state.get("documents", [])

    # Direct chat path or no documents retrieved, no auditing needed
    if route == "direct" or not docs or not draft.strip():
        return {
            "final_answer": draft,
            "citations": []
        }
    else:
        # Retrieval path
        llm = ChatGoogleGenerativeAI(
            model=MODEL_NAME,
            temperature=0
        )

        context_str = ""
        # Format context for the critic
        for index, doc in enumerate(docs, start=1):
            context_str += f"Source [{index}] (File: {doc['filename']}):\n{doc['content']}\n\n"
        
        critic_system = (
            "You are an expert editor and fact checker. "
            "Review the draft answer using ONLY the provided sources. "
            "Remove any unsupported or hallucinated claims. "
            "Do not add new information. "
            "Preserve inline citations like [1], [2], [1, 2]."
        )
        critic_user = f"Sources:\n{context_str}\n\nDraft Answer:\n{draft}"

        try:
            response = llm.invoke([
                SystemMessage(content=critic_system),
                HumanMessage(content=critic_user)
            ])
            final_answer = _extract_text(response.content)
            if not final_answer or not final_answer.strip():
                final_answer = draft
        except Exception as err:
            print(f"Citation critic warning: {err}, falling back to draft answer")
            final_answer = draft
        
        # Extract citation numbers like [1], [2], [1, 2], [2, 4]
        matches = re.findall(r"\[([\d\s,]+)\]", final_answer)
        unique_nums = set()
        for match in matches:
            for num_str in match.split(','):
                num_str = num_str.strip()
                if num_str.isdigit():
                    unique_nums.add(int(num_str))
        
        unique_nums = sorted(list(unique_nums))
        
        citations_list = []
        for x in unique_nums:
            if 1 <= x <= len(docs):
                doc = docs[x - 1]
                snippet_text = doc.get("content", "")
                filename = doc.get("filename", "Unknown")
                citations_list.append(
                    {
                        "source_index": x,
                        "document_id": doc.get("document_id"),
                        "filename": filename,
                        "document_name": filename,
                        "source_name": filename,
                        "chunk_index": doc.get("chunk_index", x),
                        "text_snippet": snippet_text,
                        "snippet": snippet_text,
                    }
                )

        return {
            "final_answer": final_answer,
            "citations": citations_list,
        }
