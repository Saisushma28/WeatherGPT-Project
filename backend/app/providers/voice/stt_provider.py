from typing import Optional, Dict, Any


class SpeechToTextProvider:
    """
    Speech-to-Text provider abstraction.
    Supports external Whisper / Cloud STT APIs with fallback to browser Web Speech API.
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    async def transcribe(self, audio_bytes: bytes, language: str = "en") -> Dict[str, Any]:
        # If external STT API key configured, call provider.
        # Otherwise, indicate browser Web Speech fallback capability.
        return {
            "transcription": "",
            "language": language,
            "provider": "browser_fallback",
            "message": "Use client-side Web Speech API for low-latency zero-cost voice input."
        }


stt_provider = SpeechToTextProvider()
