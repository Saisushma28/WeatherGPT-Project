from typing import Dict, Type
from app.providers.llm.base import BaseLLMProvider
from app.providers.llm.fallback_provider import FallbackLLMProvider
from app.providers.llm.gemini_provider import GeminiLLMProvider
from app.providers.llm.openai_provider import OpenAILLMProvider
from app.providers.llm.groq_provider import GroqLLMProvider
from app.config.settings import settings


_LLM_PROVIDERS: Dict[str, Type[BaseLLMProvider]] = {
    "rule_based": FallbackLLMProvider,
    "fallback": FallbackLLMProvider,
    "gemini": GeminiLLMProvider,
    "openai": OpenAILLMProvider,
    "groq": GroqLLMProvider
}


def get_llm_provider(provider_name: str = None) -> BaseLLMProvider:
    name = (provider_name or settings.LLM_PROVIDER or "rule_based").lower()
    provider_cls = _LLM_PROVIDERS.get(name)

    # If provider requires key and key is missing, fallback cleanly to rule_based
    if name in ["gemini", "openai", "groq"] and not settings.LLM_API_KEY:
        return FallbackLLMProvider()

    if not provider_cls:
        return FallbackLLMProvider()

    try:
        return provider_cls()
    except Exception:
        return FallbackLLMProvider()
