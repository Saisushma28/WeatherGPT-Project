import json
import httpx
from typing import Dict, Any, Optional
from app.providers.llm.base import BaseLLMProvider
from app.config.settings import settings


class OpenAILLMProvider(BaseLLMProvider):
    """OpenAI API Provider (GPT-4o-mini / GPT-4o)."""
    API_URL = "https://api.openai.com/v1/chat/completions"

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key or settings.LLM_API_KEY
        self.model = model or "gpt-4o-mini"
        self.timeout = httpx.Timeout(15.0, connect=5.0)

    async def extract_intent_and_entities(self, query: str) -> Dict[str, Any]:
        if not self.api_key:
            raise ValueError("LLM_API_KEY not configured for OpenAI")

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        prompt = f"""
You are the query analysis unit for WeatherGPT. Analyze this query: "{query}"
Output ONLY a valid JSON object with keys:
"intent": "forecast" | "current_weather" | "rain" | "temperature" | "wind" | "alerts" | "agriculture" | "travel",
"location": extracted city/location string or null,
"date": "today" | "tomorrow" | "next_5_days",
"time": "morning" | "afternoon" | "evening" | "night" | null,
"parameter": "rain_probability" | "temperature" | "wind_speed" | "all",
"language": "en" | "hi" | "te",
"goal": "general" | "farmer" | "traveler"
"""
        payload = {
            "model": self.model,
            "messages": [{"role": "system", "content": "You output JSON only."}, {"role": "user", "content": prompt}],
            "response_format": {"type": "json_object"},
            "temperature": 0.1
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(self.API_URL, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        content = data["choices"][0]["message"]["content"]
        return json.loads(content)

    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        language: str = "en",
        weather_context: Optional[Dict[str, Any]] = None
    ) -> str:
        if not self.api_key:
            raise ValueError("LLM_API_KEY not configured for OpenAI")

        headers = {"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"}
        sys_prompt = system_instruction or (
            "You are WeatherGPT, an authoritative AI weather intelligence assistant. "
            "Never hallucinate weather figures. Base your answer entirely on the retrieved data provided. "
            f"Respond fluently in language code: {language}."
        )

        user_content = f"Retrieved Weather Data:\n{json.dumps(weather_context or {}, default=str)}\n\nUser Question:\n{prompt}"
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": sys_prompt},
                {"role": "user", "content": user_content}
            ],
            "temperature": 0.2
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.post(self.API_URL, headers=headers, json=payload)
            resp.raise_for_status()
            data = resp.json()

        return data["choices"][0]["message"]["content"].strip()
