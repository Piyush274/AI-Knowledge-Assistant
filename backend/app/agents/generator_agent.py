from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage
from app.agents.graph import GraphState


def generator_node(state: GraphState)->dict:
    llm=ChatGoogleGenerativeAI(model="gemini-1.5-flash", temperature=0.5)

    # In LangGraph, not every field is populated at every step, so use get to handle empty state fields and avoid error
    route=state["route"]
    docs = state.get("documents", [])
    messages = state.get("messages", [])

    # Direct chat path
    if route=="direct" or not docs:
        response=llm.invoke(messages)
    
    # Retrieval path
    else:
        context_str=""
        
        # Loops over retrieved chunks, and create the context
        # Source [1] (File: handbook.pdf):
        # Refunds are allowed within 30 days.
        # Source [2] (File: handbook.pdf):
        # Products must be returned unused.
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
        
        # Create system prompt to use usese sources and SystemMessage tells the AI how it should behave.

            #  [
            #     SystemMessage(...),

            #     [ 
            #         HumanMessage(...),
            #         HumanMessage(...)
            #     ]
            # ]
            #  The second item is another list, so *messages = unpacks the conversation history into the list so the LLM receives a single      
            # [
            #     SystemMessage(...),
            #     HumanMessage(...),
            #     HumanMessage(...)
            # ]   

        prompt_messages=[
            SystemMessage(content=system_prompt),
            *messages,
        ]

        response=llm.invoke(prompt_messages)

        return {
            "draft_answer": response.content
        }
            
           
            
