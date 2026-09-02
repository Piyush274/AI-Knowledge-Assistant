import os
import re
import httpx
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from pydantic import BaseModel, Field
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "sk_i1q9e6v5_a5n6uMnkPXqBudkon36FNXAZ")
SARVAM_BASE_URL = "https://api.sarvam.ai"

class SynthesizeRequest(BaseModel):
    text: str = Field(..., description="Text to convert to speech")
    target_language_code: str = Field(default="en-IN", description="Language code e.g. en-IN or hi-IN")
    speaker: str = Field(default="priya", description="Speaker name e.g. priya, aditya, ritu, ashutosh, rohan")
    pitch: float = Field(default=0.0, description="Pitch modifier (-1.0 to 1.0)")
    pace: float = Field(default=1.0, description="Speed modifier (0.5 to 2.0)")


def clean_markdown_for_speech(text: str) -> str:
    """Removes markdown syntax, inline citations, URLs, and asterisks for smooth audio narration."""
    # Remove citations like [1], [2], [12]
    cleaned = re.sub(r'\[\d+\]', '', text)
    # Remove markdown headers #, ##, ###
    cleaned = re.sub(r'#+\s*', '', cleaned)
    # Remove bold/italic **text**, *text*
    cleaned = re.sub(r'\*{1,3}(.*?)\*{1,3}', r'\1', cleaned)
    # Remove markdown links [label](url) -> label
    cleaned = re.sub(r'\[(.*?)\]\(.*?\)', r'\1', cleaned)
    # Remove bullet symbols
    cleaned = re.sub(r'^[•\-\*]\s*', '', cleaned, flags=re.MULTILINE)
    # Collapse multiple spaces and newlines
    cleaned = re.sub(r'\s+', ' ', cleaned).strip()
    return cleaned


@router.post("/transcribe")
async def transcribe_speech(
    file: UploadFile = File(...),
    language_code: str = "en-IN",
    model: str = "saarika:v2.5"
):
    """
    Transcribes audio recorded from browser microphone using Sarvam AI Saaras/Saarika Speech-to-Text.
    """
    if not SARVAM_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sarvam AI API key is not configured"
        )

    try:
        audio_bytes = await file.read()
        filename = file.filename or "audio.webm"
        content_type = file.content_type or "audio/webm"

        # Prepare multipart file upload for Sarvam API
        files = {
            "file": (filename, audio_bytes, content_type)
        }
        data = {
            "model": str(model) if not hasattr(model, 'default') else "saarika:v2.5",
            "language_code": str(language_code) if not hasattr(language_code, 'default') else "en-IN"
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{SARVAM_BASE_URL}/speech-to-text",
                headers={"api-subscription-key": SARVAM_API_KEY},
                files=files,
                data=data
            )

        if response.status_code != 200:
            err_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"detail": response.text}
            raise HTTPException(
                status_code=response.status_code,
                detail=err_data.get("error", {}).get("message", "Sarvam transcription failed")
            )

        res_json = response.json()
        return {
            "transcript": res_json.get("transcript", ""),
            "language_code": res_json.get("language_code", language_code)
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Speech to text error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech transcription failed: {str(e)}"
        )


@router.post("/synthesize")
async def synthesize_speech(request_data: SynthesizeRequest):
    """
    Converts text to speech using Sarvam AI Bulbul Text-to-Speech.
    Returns base64 audio and metadata.
    """
    if not SARVAM_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Sarvam AI API key is not configured"
        )

    # Clean text to remove markdown/citations
    cleaned_text = clean_markdown_for_speech(request_data.text)
    if not cleaned_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid speakable text provided"
        )

    # Sarvam AI supports inputs array (up to 500 chars per chunk)
    # Truncate or split if too long
    input_text = cleaned_text[:500]

    payload = {
        "inputs": [input_text],
        "target_language_code": request_data.target_language_code,
        "speaker": request_data.speaker,
        "model": "bulbul:v3"
    }
    if request_data.pace and request_data.pace != 1.0:
        payload["pace"] = request_data.pace

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{SARVAM_BASE_URL}/text-to-speech",
                headers={
                    "api-subscription-key": SARVAM_API_KEY,
                    "Content-Type": "application/json"
                },
                json=payload
            )

        if response.status_code != 200:
            err_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {"detail": response.text}
            raise HTTPException(
                status_code=response.status_code,
                detail=err_data.get("error", {}).get("message", "Sarvam synthesis failed")
            )

        res_json = response.json()
        audios = res_json.get("audios", [])
        if not audios:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail="No audio returned by speech synthesis service"
            )

        return {
            "audio_base64": audios[0],
            "format": "audio/wav",
            "speaker": request_data.speaker
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Speech synthesis error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Speech synthesis failed: {str(e)}"
        )
