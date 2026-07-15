# Import Regex using to find citations like [1][2]
import re
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage
from app.agents.graph import GraphState


# Citation agent does 
# 1. Audits grounding check draft answer afainst retrieved documents, refines answer kind of Review
# 2. Extracts citaion metadata  parses the final answer to find all referenced markers (e.g. [1]) and extracts their corresponding document details (document ID, filename, chunk index) from the state

def citation_node(state:GraphState)->dict:
    route = state.get("route")
    draft = state.get("draft_answer", "")
    docs = state.get("documents", [])

    # Direct chat path, no auditing needed
    if route=="direct" or not docs:
        return {
            "final_answer": draft,
            "citations":[]
        }
    else:
        # Retrieval path
        llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            temperature=0
        )

        context_str = ""
        # Format context for the critic
        for index, doc in enumerate(docs, start=1):
            context_str += f"Source [{index}] (File: {doc['filename']}):\n{doc['content']}\n\n"
        
        critic_prompt = (
            "You are an expert editor and fact checker.\n"
            "Review the draft answer using ONLY the provided sources.\n"
            "Remove any unsupported or hallucinated claims.\n"
            "Do not add new information.\n"
            "Preserve inline citations like [1], [2].\n\n"
            f"Sources:\n{context_str}\n\n"
            f"Draft Answer:\n{draft}"
        )

        response = llm.invoke(
            [SystemMessage(content=critic_prompt)]
        )

        final_answer = response.content
        
        # Extract citation numbers like [1], [2]
        str_nums = re.findall(r"\[(\d+)\]", final_answer)
        
        # Convert to unique sorted integer numbers
        unique_nums = sorted(list(set(int(num) for num in str_nums)))
        
        citations_list = []
        for x in unique_nums:
            if 1 <= x <= len(docs):
                doc = docs[x - 1]
                citations_list.append(
                    {
                        "source_index": x,
                        "document_id": doc["document_id"],
                        "filename": doc["filename"],
                        "chunk_index": doc["chunk_index"],
                    }
                )

        return {
            "final_answer": final_answer,
            "citations": citations_list,
        }
