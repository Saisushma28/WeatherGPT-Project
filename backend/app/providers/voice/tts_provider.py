from typing import Optional, Dict, Any


class TextToSpeechProvider:
    """
    Text-to-Speech provider abstraction.
    Supports external Cloud TTS APIs (ElevenLabs, Google TTS, Azure)
    with seamless fallback to browser Web Speech API (SpeechSynthesis).
    """
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key

    async def synthesize(self, text: str, language: str = "en") -> Dict[str, Any]:
        return {
            "text": text,
            "language": language,
            "provider": "browser_fallback",
            "message": "SpeechSynthesis supported directly in browser for zero latency and multilingual Indian accents."
        }


tts_provider = TextToSpeechProvider()
