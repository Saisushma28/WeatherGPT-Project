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


class OpenWeatherProvider(BaseWeatherProvider):
    """
    OpenWeather API Provider (compatible with OpenWeather One Call 3.0 / 2.5 API).
    Configurable via WEATHER_API_KEY.
    """
    BASE_URL = "https://api.openweathermap.org/data/2.5"
    GEO_URL = "http://api.openweathermap.org/geo/1.0"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or settings.WEATHER_API_KEY
        self.timeout = httpx.Timeout(10.0, connect=5.0)

    async def get_current_weather(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> CurrentWeather:
        if not self.api_key:
            raise ValueError("WEATHER_API_KEY is not configured for OpenWeather")

        url = f"{self.BASE_URL}/weather"
        params = {
            "lat": latitude,
            "lon": longitude,
            "appid": self.api_key,
            "units": "metric"
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        weather_desc = data.get("weather", [{}])[0]
        main_data = data.get("main", {})
        wind_data = data.get("wind", {})
        sys_data = data.get("sys", {})

        loc = WeatherLocation(
            name=location_name or data.get("name", "Unknown Location"),
            country=sys_data.get("country", "India"),
            latitude=latitude,
            longitude=longitude
        )

        return CurrentWeather(
            temperature=float(main_data.get("temp", 0.0)),
            feels_like=float(main_data.get("feels_like", main_data.get("temp", 0.0))),
            condition=weather_desc.get("main", "Clear"),
            condition_code=weather_desc.get("id", 800),
            humidity=int(main_data.get("humidity", 50)),
            wind_speed=float(wind_data.get("speed", 0.0) * 3.6),  # convert m/s to km/h
            wind_direction=int(wind_data.get("deg", 0)),
            pressure=float(main_data.get("pressure", 1013.25)),
            visibility=float(data.get("visibility", 10000) / 1000.0),
            rain_probability=0,
            precipitation=float(data.get("rain", {}).get("1h", 0.0)),
            sunrise=datetime.fromtimestamp(sys_data["sunrise"], timezone.utc).strftime("%H:%M") if "sunrise" in sys_data else None,
            sunset=datetime.fromtimestamp(sys_data["sunset"], timezone.utc).strftime("%H:%M") if "sunset" in sys_data else None,
            is_day=1,
            timestamp=datetime.now(timezone.utc).isoformat(),
            source="OpenWeatherMap",
            location=loc
        )

    async def get_forecast(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> ForecastResponse:
        # 5-day / 3-hour forecast endpoint
        if not self.api_key:
            raise ValueError("WEATHER_API_KEY is not configured for OpenWeather")

        url = f"{self.BASE_URL}/forecast"
        params = {
            "lat": latitude,
            "lon": longitude,
            "appid": self.api_key,
            "units": "metric"
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(url, params=params)
            resp.raise_for_status()
            data = resp.json()

        city = data.get("city", {})
        loc = WeatherLocation(
            name=location_name or city.get("name", "Unknown Location"),
            country=city.get("country", "India"),
            latitude=latitude,
            longitude=longitude
        )

        curr = await self.get_current_weather(latitude, longitude, location_name)

        hourly_items: List[HourlyItem] = []
        for item in data.get("list", [])[:16]:
            w = item.get("weather", [{}])[0]
            m = item.get("main", {})
            wnd = item.get("wind", {})
            hourly_items.append(HourlyItem(
                time=item.get("dt_txt", ""),
                temperature=float(m.get("temp", 0.0)),
                feels_like=float(m.get("feels_like", 0.0)),
                rain_probability=int(item.get("pop", 0.0) * 100),
                precipitation=float(item.get("rain", {}).get("3h", 0.0)),
                weather_condition=w.get("main", "Clear"),
                weather_code=w.get("id", 800),
                wind_speed=float(wnd.get("speed", 0.0) * 3.6),
                wind_direction=int(wnd.get("deg", 0)),
                humidity=int(m.get("humidity", 50))
            ))

        # Build daily items
        daily_items: List[DailyItem] = []
        return ForecastResponse(
            location=loc,
            current=curr,
            hourly=hourly_items,
            daily=daily_items,
            source="OpenWeatherMap",
            attribution="OpenWeatherMap 5-Day Forecast"
        )

    async def get_historical_weather(self, latitude: float, longitude: float, start_date: str, end_date: str, location_name: Optional[str] = None) -> HistoricalResponse:
        raise NotImplementedError("Historical weather requires OpenWeather Paid History subscription.")

    async def get_alerts(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> AlertsResponse:
        return AlertsResponse(
            location=location_name or "Unknown Location",
            latitude=latitude,
            longitude=longitude,
            active_alerts_count=0,
            alerts=[],
            source="OpenWeather Alerts",
            updated_at=datetime.now(timezone.utc).isoformat()
        )
