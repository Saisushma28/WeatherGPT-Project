from fastapi import APIRouter
from datetime import datetime, timezone
from app.config.settings import settings

router = APIRouter(prefix="/api/health", tags=["health"])


@router.get("")
async def health_check():
    return {
        "status": "healthy",
        "service": "WeatherGPT API",
        "version": settings.VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "weather_provider": settings.WEATHER_PROVIDER,
        "llm_provider": settings.LLM_PROVIDER,
        "geocoding_provider": settings.GEOCODING_PROVIDER
    }
