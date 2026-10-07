from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App config
    PROJECT_NAME: str = "WeatherGPT API"
    VERSION: str = "1.0.0"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"

    # Weather Provider
    WEATHER_PROVIDER: str = "open_meteo"  # open_meteo, openweather, weatherapi
    WEATHER_API_KEY: str = ""

    # LLM Provider
    LLM_PROVIDER: str = "rule_based"  # rule_based, gemini, openai, groq
    LLM_API_KEY: str = ""
    LLM_MODEL: str = "gemini-1.5-flash"

    # Geocoding
    GEOCODING_PROVIDER: str = "open_meteo"  # open_meteo, nominatim
    GEOCODING_API_KEY: str = ""

    # Voice Providers
    STT_PROVIDER: str = "browser_fallback"
    STT_API_KEY: str = ""
    TTS_PROVIDER: str = "browser_fallback"
    TTS_API_KEY: str = ""

    # Weather Warning
    WEATHER_WARNING_PROVIDER: str = "imd_rules"
    WEATHER_WARNING_API_KEY: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @property
    def cors_origin_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]


settings = Settings()
