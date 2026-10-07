from typing import Optional
from app.providers.weather.factory import get_weather_provider
from app.schemas.weather import CurrentWeather, ForecastResponse, HistoricalResponse
from app.schemas.alerts import AlertsResponse


class WeatherService:
    def __init__(self):
        self.provider = get_weather_provider()

    async def get_current_weather(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> CurrentWeather:
        return await self.provider.get_current_weather(latitude, longitude, location_name)

    async def get_forecast(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> ForecastResponse:
        return await self.provider.get_forecast(latitude, longitude, location_name)

    async def get_historical_weather(self, latitude: float, longitude: float, start_date: str, end_date: str, location_name: Optional[str] = None) -> HistoricalResponse:
        return await self.provider.get_historical_weather(latitude, longitude, start_date, end_date, location_name)

    async def get_alerts(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> AlertsResponse:
        return await self.provider.get_alerts(latitude, longitude, location_name)


weather_service = WeatherService()
