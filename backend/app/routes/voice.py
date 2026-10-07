from fastapi import APIRouter, File, UploadFile, Query, Body, HTTPException
from typing import Optional
from app.services.voice_service import voice_service

router = APIRouter(prefix="/api/voice", tags=["voice"])


@router.post("/transcribe")
async def transcribe_voice(
    file: Optional[UploadFile] = File(None),
    language: str = Query("en", description="Language code (en, hi, te)")
):
    try:
        content = await file.read() if file else b""
        return await voice_service.transcribe_audio(content, language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")


@router.post("/synthesize")
async def synthesize_voice(
    text: str = Body(..., embed=True),
    language: str = Body("en", embed=True)
):
    try:
        return await voice_service.synthesize_speech(text, language)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Speech synthesis error: {str(e)}")
