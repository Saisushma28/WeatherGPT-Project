import httpx
from typing import Optional, List
from datetime import datetime, timezone
from app.providers.weather.base import BaseWeatherProvider
from app.schemas.weather import (
    CurrentWeather, ForecastResponse, HourlyItem, DailyItem,
    HistoricalResponse, WeatherLocation
)
from app.schemas.alerts import AlertsResponse, AlertItem
from app.config.settings import settings


class WeatherAPIProvider(BaseWeatherProvider):
    """
    WeatherAPI.com Provider.
    Configurable via WEATHER_API_KEY.
    """
    BASE_URL = "https://api.weatherapi.com/v1"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.WEATHER_API_KEY
        self.timeout = httpx.Timeout(10.0, connect=5.0)

    async def get_current_weather(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> CurrentWeather:
        if not self.api_key:
            raise ValueError("WEATHER_API_KEY is not configured for WeatherAPI")

        url = f"{self.BASE_URL}/current.json"
        params = {"key": self.api_key, "q": f"{latitude},{longitude}", "aqi": "no"}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        curr = data.get("current", {})
        loc_data = data.get("location", {})

        loc = WeatherLocation(
            name=location_name or loc_data.get("name", "Unknown Location"),
            region=loc_data.get("region"),
            country=loc_data.get("country", "India"),
            latitude=latitude,
            longitude=longitude,
            timezone=loc_data.get("tz_id", "Asia/Kolkata")
        )

        return CurrentWeather(
            temperature=float(curr.get("temp_c", 0.0)),
            feels_like=float(curr.get("feelslike_c", 0.0)),
            condition=curr.get("condition", {}).get("text", "Clear"),
            condition_code=int(curr.get("condition", {}).get("code", 1000)),
            humidity=int(curr.get("humidity", 50)),
            wind_speed=float(curr.get("wind_kph", 0.0)),
            wind_direction=int(curr.get("wind_degree", 0)),
            wind_direction_cardinal=curr.get("wind_dir"),
            pressure=float(curr.get("pressure_mb", 1013.25)),
            visibility=float(curr.get("vis_km", 10.0)),
            rain_probability=0,
            precipitation=float(curr.get("precip_mm", 0.0)),
            uv_index=float(curr.get("uv", 0.0)),
            is_day=int(curr.get("is_day", 1)),
            timestamp=datetime.now(timezone.utc).isoformat(),
            source="WeatherAPI.com",
            location=loc
        )

    async def get_forecast(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> ForecastResponse:
        if not self.api_key:
            raise ValueError("WEATHER_API_KEY is not configured for WeatherAPI")

        url = f"{self.BASE_URL}/forecast.json"
        params = {"key": self.api_key, "q": f"{latitude},{longitude}", "days": 7, "aqi": "no", "alerts": "yes"}

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        curr = await self.get_current_weather(latitude, longitude, location_name)
        f_days = data.get("forecast", {}).get("forecastday", [])

        daily_items: List[DailyItem] = []
        hourly_items: List[HourlyItem] = []

        for fd in f_days:
            day = fd.get("day", {})
            astro = fd.get("astro", {})
            daily_items.append(DailyItem(
                date=fd.get("date", ""),
                min_temperature=float(day.get("mintemp_c", 0.0)),
                max_temperature=float(day.get("maxtemp_c", 0.0)),
                rain_probability=int(day.get("daily_chance_of_rain", 0)),
                precipitation_sum=float(day.get("totalprecip_mm", 0.0)),
                weather_condition=day.get("condition", {}).get("text", "Clear"),
                weather_code=int(day.get("condition", {}).get("code", 1000)),
                wind_speed_max=float(day.get("maxwind_kph", 0.0)),
                uv_index_max=float(day.get("uv", 0.0)),
                sunrise=astro.get("sunrise"),
                sunset=astro.get("sunset")
            ))

            for h in fd.get("hour", []):
                hourly_items.append(HourlyItem(
                    time=h.get("time", ""),
                    temperature=float(h.get("temp_c", 0.0)),
                    feels_like=float(h.get("feelslike_c", 0.0)),
                    rain_probability=int(h.get("chance_of_rain", 0)),
                    precipitation=float(h.get("precip_mm", 0.0)),
                    weather_condition=h.get("condition", {}).get("text", "Clear"),
                    weather_code=int(h.get("condition", {}).get("code", 1000)),
                    wind_speed=float(h.get("wind_kph", 0.0)),
                    wind_direction=int(h.get("wind_degree", 0)),
                    humidity=int(h.get("humidity", 50))
                ))

        return ForecastResponse(
            location=curr.location,
            current=curr,
            hourly=hourly_items[:48],
            daily=daily_items,
            source="WeatherAPI.com",
            attribution="WeatherAPI.com Global Forecast"
        )

    async def get_historical_weather(self, latitude: float, longitude: float, start_date: str, end_date: str, location_name: Optional[str] = None) -> HistoricalResponse:
        raise NotImplementedError("WeatherAPI historical endpoint requires paid tier.")

    async def get_alerts(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> AlertsResponse:
        return AlertsResponse(
            location=location_name or "Unknown Location",
            latitude=latitude,
            longitude=longitude,
            active_alerts_count=0,
            alerts=[],
            source="WeatherAPI Alerts",
            updated_at=datetime.now(timezone.utc).isoformat()
        )
