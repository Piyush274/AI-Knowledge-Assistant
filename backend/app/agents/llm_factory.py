"""
LLM Provider Factory
Dynamically provisions Groq (Qwen 3.8 27B, GPT-OSS 120B, Compound Mini, Llama) or Google Gemini models
based on the client's model selection and available API keys.
"""

import os
from dotenv import load_dotenv

load_dotenv()

DEFAULT_MODEL = os.getenv("DEFAULT_LLM_MODEL", "qwen/qwen3.8-27b")
DEFAULT_GEMINI_MODEL = os.getenv("GEMINI_MODEL_NAME", "models/gemini-2.5-flash")

# Candidate Groq models in order of preferred fallback
GROQ_MODEL_PREFERENCES = [
    "qwen/qwen3.8-27b",
    "groq/compound-mini",
    "openai/gpt-oss-120b",
    "openai/gpt-oss-20b",
]

def normalize_groq_model(model_name: str | None) -> str:
    """Maps model aliases to active Groq model endpoints."""
    if not model_name:
        return "qwen/qwen3.8-27b"

    m = model_name.strip().lower()
    
    # Fast / Instant models
    if "8b" in m or "instant" in m or "mini" in m or "compound" in m:
        return "groq/compound-mini"
    
    # Heavy / 70B / 120B models
    if "70b" in m or "120b" in m or "gpt" in m or "large" in m:
        return "openai/gpt-oss-120b"
    
    # Balanced default (Qwen 3.8 27B - incredible speed and reasoning)
    if "qwen" in m or "llama" in m or "versatile" in m or "smart" in m:
        return "qwen/qwen3.8-27b"

    return model_name.strip()


def get_chat_llm(model_name: str | None = None, temperature: float = 0.3):
    """
    Returns an initialized Chat LLM instance (ChatGroq or ChatGoogleGenerativeAI).
    Automatically falls back if a specific provider's API key is missing.
    """
    requested = (model_name or "").strip()
    groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
    google_api_key = os.getenv("GOOGLE_API_KEY", "").strip()

    is_gemini_requested = requested.startswith("models/") or "gemini" in requested.lower()

    # 1. If Gemini explicitly requested and Google key is set
    if is_gemini_requested and google_api_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            gemini_id = requested if requested.startswith("models/") else "models/gemini-2.5-flash"
            return ChatGoogleGenerativeAI(
                model=gemini_id,
                temperature=temperature,
                google_api_key=google_api_key,
            )
        except Exception as e:
            print(f"[LLMFactory] Gemini initialization failed: {e}, attempting Groq fallback...")

    # 2. Try Groq (Ultra-fast LPU inference)
    if groq_api_key:
        try:
            from langchain_groq import ChatGroq
            groq_model_id = normalize_groq_model(requested)
            return ChatGroq(
                model=groq_model_id,
                temperature=temperature,
                api_key=groq_api_key,
                max_retries=2,
            )
        except Exception as e:
            print(f"[LLMFactory] Groq initialization failed: {e}")

    # 3. Fallback to Gemini if Groq failed or wasn't available
    if google_api_key:
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                model=DEFAULT_GEMINI_MODEL,
                temperature=temperature,
                google_api_key=google_api_key,
            )
        except Exception as e:
            print(f"[LLMFactory] Final Gemini fallback failed: {e}")

    raise RuntimeError("No valid LLM provider configured. Set GROQ_API_KEY or GOOGLE_API_KEY.")
