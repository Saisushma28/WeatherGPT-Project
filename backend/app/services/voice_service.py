from typing import Dict, Any
from app.providers.voice.stt_provider import stt_provider
from app.providers.voice.tts_provider import tts_provider


class VoiceService:
    async def transcribe_audio(self, audio_bytes: bytes, language: str = "en") -> Dict[str, Any]:
        return await stt_provider.transcribe(audio_bytes, language)

    async def synthesize_speech(self, text: str, language: str = "en") -> Dict[str, Any]:
        return await tts_provider.synthesize(text, language)


voice_service = VoiceService()
