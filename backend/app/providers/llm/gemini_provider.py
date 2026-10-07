import json
import httpx
from typing import Dict, Any, Optional
from app.providers.llm.base import BaseLLMProvider
from app.config.settings import settings


class GeminiLLMProvider(BaseLLMProvider):
    """
    Google Gemini API Provider for WeatherGPT.
    Uses Gemini 1.5 Flash / 2.5 Flash for natural language reasoning with strict ground truth bounds.
    """
    API_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.LLM_API_KEY
        self.model = model or settings.LLM_MODEL or "gemini-1.5-flash"
        self.timeout = httpx.Timeout(15.0, connect=5.0)

    async def extract_intent_and_entities(self, query: str) -> Dict[str, Any]:
        if not self.api_key:
            raise ValueError("LLM_API_KEY not configured for Gemini")

        url = f"{self.API_URL}/{self.model}:generateContent?key={self.api_key}"
        prompt = f"""
You are an intent extraction component of WeatherGPT. Analyze this user query (which may be in English, Hindi, Telugu, or another Indian language):
"{query}"

Return ONLY a valid JSON object with:
{{
  "intent": "forecast" | "current_weather" | "rain" | "temperature" | "wind" | "alerts" | "agriculture" | "travel",
  "location": "City or Location name if mentioned, otherwise null",
  "date": "today" | "tomorrow" | "next_5_days" | "specific_date",
  "time": "morning" | "afternoon" | "evening" | "night" | "specific_time" | null,
  "parameter": "rain_probability" | "temperature" | "wind_speed" | "all",
  "language": "en" | "hi" | "te",
  "goal": "general" | "farmer" | "traveler"
}}
"""
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"temperature": 0.1, "responseMimeType": "application/json"}
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        text = data["candidates"][0]["content"]["parts"][0]["text"]
        return json.loads(text)

    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        language: str = "en",
        weather_context: Optional[Dict[str, Any]] = None
    ) -> str:
        if not self.api_key:
            raise ValueError("LLM_API_KEY not configured for Gemini")

        url = f"{self.API_URL}/{self.model}:generateContent?key={self.api_key}"

        sys_prompt = system_instruction or (
            "You are WeatherGPT, an authoritative, helpful, and friendly AI weather intelligence assistant. "
            "CRITICAL RULE: Never hallucinate or invent weather data. Ground all responses strictly in the provided "
            "retrieved meteorological facts. If data is unavailable, clearly state so. "
            f"Always reply in the requested language: {language} (en=English, hi=Hindi, te=Telugu). "
            "For uncertain forecasts, use cautious phrases like 'forecast indicates' or 'probability is around'."
        )

        full_prompt = f"""
System Instructions: {sys_prompt}

Retrieved Meteorological Data:
{json.dumps(weather_context or {}, indent=2, default=str)}

User Query:
{prompt}

Generate a concise, helpful response in {language}. Include actionable advice (e.g. carry umbrella, travel precautions, irrigation timing).
"""
        payload = {
            "contents": [{"parts": [{"text": full_prompt}]}],
            "generationConfig": {"temperature": 0.2, "maxOutputTokens": 800}
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()

        return data["candidates"][0]["content"]["parts"][0]["text"].strip()
