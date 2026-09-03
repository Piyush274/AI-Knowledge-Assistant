import re
from typing import Any

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


def citation_node(state: Any) -> dict:
    """
    Fast in-memory citation mapping node.
    Parses inline citations ([1], [2]) and maps them to retrieved document chunks
    in <1ms with zero blocking network calls.
    """
    route = state.get("route")
    draft = _extract_text(state.get("final_answer") or state.get("draft_answer", ""))
    docs = state.get("documents", [])

    # Direct chat path or no documents retrieved
    if route == "direct" or not docs or not draft.strip():
        return {
            "final_answer": draft,
            "citations": []
        }

    # Extract citation numbers like [1], [2], [1, 2], [2, 4] from answer text
    matches = re.findall(r"\[([\d\s,]+)\]", draft)
    unique_nums = set()
    for match in matches:
        for num_str in match.split(','):
            num_str = num_str.strip()
            if num_str.isdigit():
                unique_nums.add(int(num_str))

    # If the LLM referenced specific numbers, map those; otherwise include top referenced sources
    if not unique_nums and docs:
        unique_nums = {1}

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
        "final_answer": draft,
        "citations": citations_list,
    }
