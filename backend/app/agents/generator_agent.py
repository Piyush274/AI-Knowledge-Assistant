from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage
from app.agents.graph import GraphState

def generator_node(state: GraphState) -> dict:
    llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.5)
    route = state["route"]
    docs = state["documents"]
    messages = state["messages"]

    # Direct chat path
    if route == "direct" or not docs:
        response = llm.invoke(messages)
        return {"draft_answer": response.content}
    
    # Retrieval path
    else:
        context_str = ""
        # Loops over retrieved chunks, and create the context
        for index, doc in enumerate(docs, start=1):
            context_str += f"Source [{index}] (File: {doc['filename']}):\n{doc['content']}\n\n"

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
            "draft_answer": response.content
        }
