from abc import ABC, abstractmethod
from typing import Optional
from app.schemas.weather import CurrentWeather, ForecastResponse, HistoricalResponse
from app.schemas.alerts import AlertsResponse


class BaseWeatherProvider(ABC):
    @abstractmethod
    async def get_current_weather(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> CurrentWeather:
        """Fetch real-time current weather conditions."""
        pass

    @abstractmethod
    async def get_forecast(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> ForecastResponse:
        """Fetch hourly (24-48h) and daily (5-7 day) weather forecast."""
        pass

    @abstractmethod
    async def get_historical_weather(self, latitude: float, longitude: float, start_date: str, end_date: str, location_name: Optional[str] = None) -> HistoricalResponse:
        """Fetch historical weather data for climate analysis."""
        pass

    @abstractmethod
    async def get_alerts(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> AlertsResponse:
        """Fetch official/meteorological extreme weather alerts."""
        pass
