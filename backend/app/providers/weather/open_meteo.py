import httpx
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from app.providers.weather.base import BaseWeatherProvider
from app.schemas.weather import (
    CurrentWeather, WeatherLocation, ForecastResponse,
    HourlyItem, DailyItem, HistoricalResponse, HistoricalDataPoint
)
from app.schemas.alerts import AlertsResponse, AlertItem
from app.rules.alert_rules import evaluate_weather_alerts


# Standard WMO Weather interpretation codes
WMO_CODE_MAP = {
    0: ("Clear sky", "Clear"),
    1: ("Mainly clear", "Partly Cloudy"),
    2: ("Partly cloudy", "Partly Cloudy"),
    3: ("Overcast", "Cloudy"),
    45: ("Fog", "Fog"),
    48: ("Depositing rime fog", "Fog"),
    51: ("Light drizzle", "Drizzle"),
    53: ("Moderate drizzle", "Drizzle"),
    55: ("Dense drizzle", "Drizzle"),
    56: ("Light freezing drizzle", "Freezing Rain"),
    57: ("Dense freezing drizzle", "Freezing Rain"),
    61: ("Slight rain", "Rain"),
    62: ("Moderate rain", "Rain"),
    63: ("Heavy rain", "Heavy Rain"),
    65: ("Very heavy rain", "Heavy Rain"),
    66: ("Light freezing rain", "Freezing Rain"),
    67: ("Heavy freezing rain", "Freezing Rain"),
    71: ("Slight snow fall", "Snow"),
    73: ("Moderate snow fall", "Snow"),
    75: ("Heavy snow fall", "Heavy Snow"),
    77: ("Snow grains", "Snow"),
    80: ("Slight rain showers", "Rain Showers"),
    81: ("Moderate rain showers", "Rain Showers"),
    82: ("Violent rain showers", "Heavy Rain"),
    85: ("Slight snow showers", "Snow"),
    86: ("Heavy snow showers", "Snow"),
    95: ("Thunderstorm", "Thunderstorm"),
    96: ("Thunderstorm with slight hail", "Thunderstorm"),
    99: ("Thunderstorm with heavy hail", "Severe Thunderstorm")
}


def degrees_to_cardinal(d: float) -> str:
    dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
            "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"]
    ix = int((d + 11.25) / 22.5)
    return dirs[ix % 16]


class OpenMeteoProvider(BaseWeatherProvider):
    FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
    HISTORICAL_URL = "https://archive-api.open-meteo.com/v1/archive"

    def __init__(self):
        self.timeout = httpx.Timeout(10.0, connect=5.0)

    async def get_current_weather(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> CurrentWeather:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": [
                "temperature_2m", "relative_humidity_2m", "apparent_temperature",
                "is_day", "precipitation", "rain", "weather_code",
                "surface_pressure", "wind_speed_10m", "wind_direction_10m", "cloud_cover"
            ],
            "hourly": ["precipitation_probability", "visibility", "uv_index"],
            "daily": ["sunrise", "sunset"],
            "timezone": "auto",
            "forecast_days": 1
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(self.FORECAST_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        curr = data.get("current", {})
        daily = data.get("daily", {})
        hourly = data.get("hourly", {})
        wcode = curr.get("weather_code", 0)
        cond_text, _ = WMO_CODE_MAP.get(wcode, ("Fair", "Clear"))

        # Current rain prob from closest hourly
        rain_prob = 0
        hourly_probs = hourly.get("precipitation_probability", [])
        if hourly_probs:
            rain_prob = int(hourly_probs[0] or 0)

        visibility_km = 10.0
        vis_list = hourly.get("visibility", [])
        if vis_list and vis_list[0] is not None:
            visibility_km = round(vis_list[0] / 1000.0, 1)

        uv = 0.0
        uv_list = hourly.get("uv_index", [])
        if uv_list and uv_list[0] is not None:
            uv = float(uv_list[0])

        sunrises = daily.get("sunrise", [])
        sunsets = daily.get("sunset", [])
        sr = sunrises[0] if sunrises else None
        ss = sunsets[0] if sunsets else None

        wind_dir = int(curr.get("wind_direction_10m", 0))

        loc = WeatherLocation(
            name=location_name or f"Lat: {latitude:.2f}, Lon: {longitude:.2f}",
            latitude=latitude,
            longitude=longitude,
            timezone=data.get("timezone", "Asia/Kolkata"),
            elevation=data.get("elevation")
        )

        return CurrentWeather(
            temperature=float(curr.get("temperature_2m", 0.0)),
            feels_like=float(curr.get("apparent_temperature", curr.get("temperature_2m", 0.0))),
            condition=cond_text,
            condition_code=wcode,
            humidity=int(curr.get("relative_humidity_2m", 50)),
            wind_speed=float(curr.get("wind_speed_10m", 0.0)),
            wind_direction=wind_dir,
            wind_direction_cardinal=degrees_to_cardinal(wind_dir),
            pressure=float(curr.get("surface_pressure", 1013.25)),
            visibility=visibility_km,
            rain_probability=rain_prob,
            precipitation=float(curr.get("precipitation", 0.0)),
            uv_index=uv,
            cloud_cover=int(curr.get("cloud_cover", 0)),
            sunrise=sr,
            sunset=ss,
            is_day=int(curr.get("is_day", 1)),
            timestamp=curr.get("time", datetime.now(timezone.utc).isoformat()),
            source="Open-Meteo",
            location=loc
        )

    async def get_forecast(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> ForecastResponse:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "current": [
                "temperature_2m", "relative_humidity_2m", "apparent_temperature",
                "is_day", "precipitation", "weather_code",
                "surface_pressure", "wind_speed_10m", "wind_direction_10m", "cloud_cover"
            ],
            "hourly": [
                "temperature_2m", "relative_humidity_2m", "apparent_temperature",
                "precipitation_probability", "precipitation", "weather_code",
                "wind_speed_10m", "wind_direction_10m", "visibility", "uv_index"
            ],
            "daily": [
                "weather_code", "temperature_2m_max", "temperature_2m_min",
                "precipitation_sum", "precipitation_probability_max",
                "wind_speed_10m_max", "uv_index_max", "sunrise", "sunset"
            ],
            "timezone": "auto",
            "forecast_days": 7
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(self.FORECAST_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        curr_data = data.get("current", {})
        hourly_data = data.get("hourly", {})
        daily_data = data.get("daily", {})

        loc = WeatherLocation(
            name=location_name or f"Lat: {latitude:.2f}, Lon: {longitude:.2f}",
            latitude=latitude,
            longitude=longitude,
            timezone=data.get("timezone", "Asia/Kolkata"),
            elevation=data.get("elevation")
        )

        wcode = curr_data.get("weather_code", 0)
        cond_text, _ = WMO_CODE_MAP.get(wcode, ("Fair", "Clear"))
        wind_dir = int(curr_data.get("wind_direction_10m", 0))

        # Hourly items (first 24-48 hours)
        hourly_items: List[HourlyItem] = []
        times = hourly_data.get("time", [])
        temps = hourly_data.get("temperature_2m", [])
        app_temps = hourly_data.get("apparent_temperature", [])
        humids = hourly_data.get("relative_humidity_2m", [])
        precip_probs = hourly_data.get("precipitation_probability", [])
        precips = hourly_data.get("precipitation", [])
        wcodes = hourly_data.get("weather_code", [])
        winds = hourly_data.get("wind_speed_10m", [])
        wind_dirs = hourly_data.get("wind_direction_10m", [])

        # Include up to 48 hours
        limit = min(len(times), 48)
        for i in range(limit):
            hc = wcodes[i] if i < len(wcodes) else 0
            h_cond, _ = WMO_CODE_MAP.get(hc, ("Clear", "Clear"))
            hourly_items.append(HourlyItem(
                time=times[i],
                temperature=float(temps[i]) if i < len(temps) and temps[i] is not None else 0.0,
                feels_like=float(app_temps[i]) if i < len(app_temps) and app_temps[i] is not None else None,
                rain_probability=int(precip_probs[i]) if i < len(precip_probs) and precip_probs[i] is not None else 0,
                precipitation=float(precips[i]) if i < len(precips) and precips[i] is not None else 0.0,
                weather_condition=h_cond,
                weather_code=hc,
                wind_speed=float(winds[i]) if i < len(winds) and winds[i] is not None else 0.0,
                wind_direction=int(wind_dirs[i]) if i < len(wind_dirs) and wind_dirs[i] is not None else None,
                humidity=int(humids[i]) if i < len(humids) and humids[i] is not None else 50
            ))

        # Daily items
        daily_items: List[DailyItem] = []
        d_dates = daily_data.get("time", [])
        d_maxs = daily_data.get("temperature_2m_max", [])
        d_mins = daily_data.get("temperature_2m_min", [])
        d_precip_sums = daily_data.get("precipitation_sum", [])
        d_rain_probs = daily_data.get("precipitation_probability_max", [])
        d_wcodes = daily_data.get("weather_code", [])
        d_winds = daily_data.get("wind_speed_10m_max", [])
        d_uvs = daily_data.get("uv_index_max", [])
        d_sunrises = daily_data.get("sunrise", [])
        d_sunsets = daily_data.get("sunset", [])

        for i in range(len(d_dates)):
            dc = d_wcodes[i] if i < len(d_wcodes) else 0
            d_cond, _ = WMO_CODE_MAP.get(dc, ("Clear", "Clear"))
            daily_items.append(DailyItem(
                date=d_dates[i],
                min_temperature=float(d_mins[i]) if i < len(d_mins) and d_mins[i] is not None else 0.0,
                max_temperature=float(d_maxs[i]) if i < len(d_maxs) and d_maxs[i] is not None else 0.0,
                rain_probability=int(d_rain_probs[i]) if i < len(d_rain_probs) and d_rain_probs[i] is not None else 0,
                precipitation_sum=float(d_precip_sums[i]) if i < len(d_precip_sums) and d_precip_sums[i] is not None else 0.0,
                weather_condition=d_cond,
                weather_code=dc,
                wind_speed_max=float(d_winds[i]) if i < len(d_winds) and d_winds[i] is not None else 0.0,
                uv_index_max=float(d_uvs[i]) if i < len(d_uvs) and d_uvs[i] is not None else None,
                sunrise=d_sunrises[i] if i < len(d_sunrises) else None,
                sunset=d_sunsets[i] if i < len(d_sunsets) else None
            ))

        # Current weather object
        rain_prob = hourly_items[0].rain_probability if hourly_items else 0
        vis = hourly_data.get("visibility", [])
        vis_km = round(vis[0] / 1000.0, 1) if vis and vis[0] is not None else 10.0
        uvs = hourly_data.get("uv_index", [])
        uv_curr = float(uvs[0]) if uvs and uvs[0] is not None else 0.0

        current_obj = CurrentWeather(
            temperature=float(curr_data.get("temperature_2m", 0.0)),
            feels_like=float(curr_data.get("apparent_temperature", curr_data.get("temperature_2m", 0.0))),
            condition=cond_text,
            condition_code=wcode,
            humidity=int(curr_data.get("relative_humidity_2m", 50)),
            wind_speed=float(curr_data.get("wind_speed_10m", 0.0)),
            wind_direction=wind_dir,
            wind_direction_cardinal=degrees_to_cardinal(wind_dir),
            pressure=float(curr_data.get("surface_pressure", 1013.25)),
            visibility=vis_km,
            rain_probability=rain_prob,
            precipitation=float(curr_data.get("precipitation", 0.0)),
            uv_index=uv_curr,
            cloud_cover=int(curr_data.get("cloud_cover", 0)),
            sunrise=d_sunrises[0] if d_sunrises else None,
            sunset=d_sunsets[0] if d_sunsets else None,
            is_day=int(curr_data.get("is_day", 1)),
            timestamp=curr_data.get("time", datetime.now(timezone.utc).isoformat()),
            source="Open-Meteo",
            location=loc
        )

        return ForecastResponse(
            location=loc,
            current=current_obj,
            hourly=hourly_items,
            daily=daily_items,
            source="Open-Meteo",
            attribution="Open-Meteo / ECMWF / GFS Global Models"
        )

    async def get_historical_weather(self, latitude: float, longitude: float, start_date: str, end_date: str, location_name: Optional[str] = None) -> HistoricalResponse:
        params = {
            "latitude": latitude,
            "longitude": longitude,
            "start_date": start_date,
            "end_date": end_date,
            "daily": ["temperature_2m_mean", "temperature_2m_max", "temperature_2m_min", "precipitation_sum"],
            "timezone": "auto"
        }

        async with httpx.AsyncClient(timeout=self.timeout) as client:
            resp = await client.get(self.HISTORICAL_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        daily = data.get("daily", {})
        dates = daily.get("time", [])
        t_means = daily.get("temperature_2m_mean", [])
        t_maxs = daily.get("temperature_2m_max", [])
        t_mins = daily.get("temperature_2m_min", [])
        precips = daily.get("precipitation_sum", [])

        points: List[HistoricalDataPoint] = []
        tot_temp = 0.0
        tot_rain = 0.0
        valid_temps = 0

        for i in range(len(dates)):
            mean_t = float(t_means[i]) if i < len(t_means) and t_means[i] is not None else 0.0
            max_t = float(t_maxs[i]) if i < len(t_maxs) and t_maxs[i] is not None else mean_t
            min_t = float(t_mins[i]) if i < len(t_mins) and t_mins[i] is not None else mean_t
            p = float(precips[i]) if i < len(precips) and precips[i] is not None else 0.0

            if i < len(t_means) and t_means[i] is not None:
                tot_temp += mean_t
                valid_temps += 1
            tot_rain += p

            points.append(HistoricalDataPoint(
                date=dates[i],
                mean_temperature=round(mean_t, 1),
                max_temperature=round(max_t, 1),
                min_temperature=round(min_t, 1),
                precipitation=round(p, 1)
            ))

        avg_temp = round(tot_temp / max(valid_temps, 1), 1)
        tot_rain = round(tot_rain, 1)

        loc = WeatherLocation(
            name=location_name or f"Lat: {latitude:.2f}, Lon: {longitude:.2f}",
            latitude=latitude,
            longitude=longitude,
            timezone=data.get("timezone", "Asia/Kolkata")
        )

        return HistoricalResponse(
            location=loc,
            start_date=start_date,
            end_date=end_date,
            points=points,
            average_temperature=avg_temp,
            total_rainfall=tot_rain,
            source="Open-Meteo Historical Archive"
        )

    async def get_alerts(self, latitude: float, longitude: float, location_name: Optional[str] = None) -> AlertsResponse:
        forecast = await self.get_forecast(latitude, longitude, location_name)
        alerts = evaluate_weather_alerts(
            forecast=forecast,
            location_name=location_name or forecast.location.name,
            latitude=latitude,
            longitude=longitude
        )

        return AlertsResponse(
            location=location_name or forecast.location.name,
            latitude=latitude,
            longitude=longitude,
            active_alerts_count=len(alerts),
            alerts=alerts,
            source="IMD Rule Engine / High-Resolution Meteorological Analysis",
            updated_at=datetime.now(timezone.utc).isoformat()
        )
