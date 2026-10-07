from abc import ABC, abstractmethod
from typing import Dict, Any, Optional


class BaseLLMProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        prompt: str,
        system_instruction: Optional[str] = None,
        language: str = "en",
        weather_context: Optional[Dict[str, Any]] = None
    ) -> str:
        """Generate a natural language response grounded in retrieved meteorological facts."""
        pass

    @abstractmethod
    async def extract_intent_and_entities(self, query: str) -> Dict[str, Any]:
        """
        Extract user intent, location, date/time reference, parameter, and goal from a user query
        in English, Telugu, or Hindi.
        """
        pass
